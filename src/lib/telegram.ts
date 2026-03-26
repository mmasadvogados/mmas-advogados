import { Bot, InlineKeyboard } from "grammy";
import { db } from "@/lib/db";
import {
  telegramSessions,
  users,
  articles,
  articleStatusHistory,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { generateArticle } from "@/lib/openrouter";
import { transcribeAudio } from "@/lib/groq";
import { onArticlePublished } from "@/lib/article-utils";

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN || "dummy");

// --- DB-backed state helpers (replaces in-memory Map) ---

async function getSession(tgId: number) {
  return db.query.telegramSessions.findFirst({
    where: eq(telegramSessions.telegramUserId, tgId),
  });
}

async function updateSession(
  tgId: number,
  data: Partial<{
    botStep: string;
    pendingTopic: string | null;
    pendingArticleId: string | null;
    generatingAt: Date | null;
    authenticated: boolean;
    userId: string | null;
  }>
) {
  await db
    .update(telegramSessions)
    .set(data)
    .where(eq(telegramSessions.telegramUserId, tgId));
}

// --- Casual message filter ---

const CASUAL_PATTERNS = [
  /^(oi|ol[aá]|hey|hello|hi|e a[ií]|eai|fala|salve|opa)\b/i,
  /^(bom dia|boa tarde|boa noite|bom fds|bom final de semana)\b/i,
  /^(obrigad[oa]|valeu|brigad[oa]|vlw|thanks|tks)\b/i,
  /^(tchau|at[eé] mais|at[eé] logo|flw|falou)\b/i,
  /^(tudo bem|tudo certo|como vai|beleza|blz|td bem)\b/i,
  /^(ok|sim|n[aã]o|s|n|yes|no)\s*[.!?]*$/i,
];

function isCasualMessage(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 3) return true;
  return CASUAL_PATTERNS.some((p) => p.test(trimmed));
}

// --- Generation lock helpers ---

function isGenerationLocked(session: { generatingAt: Date | null }): boolean {
  if (!session.generatingAt) return false;
  const elapsed = Date.now() - new Date(session.generatingAt).getTime();
  return elapsed < 120_000; // 2 min lock
}

// --- Auto-detect practice area from topic keywords ---

function detectArea(topic: string): string | undefined {
  const lower = topic.toLowerCase();
  const areaKeywords: Record<string, string[]> = {
    Internet: [
      "internet", "digital", "lgpd", "dados", "cibernético", "cibernetico",
      "online", "rede social", "privacidade", "tecnologia",
    ],
    Civil: [
      "civil", "contrato", "família", "familia", "herança", "heranca",
      "consumidor", "compra", "indenização", "indenizacao", "dano moral",
      "divórcio", "divorcio", "pensão", "guarda", "inventário", "inventario",
      "usucapião", "usucapiao",
    ],
    Empresarial: [
      "empresa", "societário", "societario", "falência", "falencia",
      "recuperação judicial", "compliance", "sócio", "socio", "cnpj",
      "contrato social",
    ],
    "Tributário": [
      "tribut", "imposto", "icms", "issqn", "irpf", "irpj", "fiscal",
      "contribuição", "contribuicao", "simples nacional", "taxa",
    ],
    "Agrário e Ambiental": [
      "agrário", "agrario", "rural", "ambiental", "terra", "fazenda", "posse",
      "propriedade rural", "desmatamento", "APP", "reserva legal", "divisa",
    ],
    Cooperativas: [
      "cooperativa", "cooperado", "assembleia", "associação", "associacao",
    ],
    Administrativo: [
      "administrativo", "licitação", "licitacao", "concurso",
      "servidor público", "servidor publico", "improbidade", "pregão", "pregao",
    ],
    Trabalho: [
      "trabalho", "trabalhista", "clt", "empregado", "empregador", "demissão",
      "demissao", "rescisão", "rescisao", "fgts", "férias", "ferias",
      "hora extra", "assédio", "assedio",
    ],
    "Previdenciário": [
      "previdência", "previdencia", "aposentadoria", "inss", "benefício",
      "beneficio", "incapacidade", "auxílio", "auxilio", "pensão por morte",
    ],
    "Direito Médico e Hospitalar": [
      "médico", "medico", "hospital", "saúde", "saude", "erro médico",
      "plano de saúde", "sus", "anvisa",
    ],
    "Direito Eleitoral": [
      "eleitor", "eleitoral", "candidat", "voto", "urna", "campanha",
      "partido", "propaganda eleitoral",
    ],
  };
  for (const [area, keywords] of Object.entries(areaKeywords)) {
    if (keywords.some((k) => lower.includes(k))) return area;
  }
  return undefined;
}

// ============================================
// /start command
// ============================================
bot.command("start", async (ctx) => {
  const tgId = ctx.from?.id;
  if (!tgId) return;

  const session = await getSession(tgId);

  if (session?.authenticated) {
    await ctx.reply(
      "Voce ja esta autenticado! Envie um tema para gerar artigo.\n\nExemplo: \"Direitos do consumidor em compras online\""
    );
    return;
  }

  // Create or update session with awaiting_password step
  if (session) {
    await updateSession(tgId, { botStep: "awaiting_password" });
  } else {
    await db.insert(telegramSessions).values({
      telegramUserId: tgId,
      authenticated: false,
      botStep: "awaiting_password",
    });
  }

  await ctx.reply("Bem-vindo ao MMAS Artigos Bot!\n\nDigite sua senha para autenticar:");
});

// ============================================
// /logout command
// ============================================
bot.command("logout", async (ctx) => {
  const tgId = ctx.from?.id;
  if (!tgId) return;

  await updateSession(tgId, {
    authenticated: false,
    botStep: "idle",
    pendingTopic: null,
    pendingArticleId: null,
    generatingAt: null,
  });

  await ctx.reply("Sessao encerrada. Use /start para autenticar novamente.");
});

// ============================================
// Handle callback queries (inline buttons)
// ============================================
bot.on("callback_query:data", async (ctx) => {
  // ALWAYS answer callback FIRST to prevent Telegram retries
  await ctx.answerCallbackQuery();

  const tgId = ctx.from.id;
  const data = ctx.callbackQuery.data;

  try {
    const session = await getSession(tgId);
    if (!session?.authenticated) return;

    if (data === "approve" && session.pendingArticleId) {
      // Read draft article from DB
      const [draft] = await db
        .select()
        .from(articles)
        .where(eq(articles.id, session.pendingArticleId))
        .limit(1);

      if (!draft) {
        await ctx.editMessageText("Artigo nao encontrado. Envie novo tema.");
        await updateSession(tgId, {
          botStep: "idle",
          pendingArticleId: null,
          pendingTopic: null,
        });
        return;
      }

      // Update draft to published
      await db
        .update(articles)
        .set({ status: "published", publishedAt: new Date() })
        .where(eq(articles.id, draft.id));

      if (session.userId) {
        await db.insert(articleStatusHistory).values({
          articleId: draft.id,
          fromStatus: "draft",
          toStatus: "published",
          changedBy: session.userId,
        });
      }

      onArticlePublished(draft);

      const blogUrl = `${process.env.NEXT_PUBLIC_APP_URL}/blog/${draft.slug}`;
      const shareKeyboard = new InlineKeyboard()
        .url("Ver no Blog", blogUrl)
        .row()
        .url(
          "Compartilhar WhatsApp",
          `https://wa.me/?text=${encodeURIComponent(draft.title + " " + blogUrl)}`
        );

      await updateSession(tgId, {
        botStep: "idle",
        pendingArticleId: null,
        pendingTopic: null,
      });

      await ctx.editMessageText(`Artigo publicado!\n\n${blogUrl}`, {
        reply_markup: shareKeyboard,
      });

    } else if (data === "confirm_topic" && session.pendingTopic) {
      await ctx.editMessageText(
        `Gerando artigo sobre: "${session.pendingTopic}"...\n\nIsso pode levar ate 60 segundos.`
      );
      await handleGeneration(ctx, tgId, session.pendingTopic);

    } else if (data === "reject_topic") {
      await updateSession(tgId, {
        botStep: "idle",
        pendingTopic: null,
      });
      await ctx.editMessageText("Ok, envie o tema correto por texto.");

    } else if (data === "reject") {
      // Delete draft article if exists
      if (session.pendingArticleId) {
        await db.delete(articles).where(eq(articles.id, session.pendingArticleId));
      }
      await updateSession(tgId, {
        botStep: "idle",
        pendingArticleId: null,
        pendingTopic: null,
      });
      await ctx.editMessageText("Artigo descartado. Envie novo tema quando quiser.");

    } else if (data === "regenerate" && session.pendingTopic) {
      // Delete previous draft
      if (session.pendingArticleId) {
        await db.delete(articles).where(eq(articles.id, session.pendingArticleId));
      }
      await updateSession(tgId, { pendingArticleId: null });
      await ctx.editMessageText("Regenerando artigo...");
      await handleGeneration(ctx, tgId, session.pendingTopic);
    }
  } catch (err) {
    console.error("Callback error:", err);
    try {
      await ctx.reply("Erro ao processar. Tente novamente enviando o tema.");
    } catch {
      // silently ignore if reply also fails
    }
    await updateSession(tgId, {
      botStep: "idle",
      generatingAt: null,
      pendingArticleId: null,
      pendingTopic: null,
    });
  }
});

// ============================================
// Handle voice messages
// ============================================
bot.on("message:voice", async (ctx) => {
  const tgId = ctx.from.id;
  const session = await getSession(tgId);

  if (!session?.authenticated) {
    await ctx.reply("Use /start para autenticar primeiro.");
    return;
  }

  // Check generation lock
  if (isGenerationLocked(session)) {
    await ctx.reply("Ja estou gerando um artigo. Aguarde a conclusao.");
    return;
  }

  await ctx.reply("Transcrevendo audio...");

  try {
    const file = await ctx.getFile();
    const url = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${file.file_path}`;
    const response = await fetch(url);
    const buffer = Buffer.from(await response.arrayBuffer());

    const transcription = await transcribeAudio(buffer);

    if (!transcription || transcription.length < 3) {
      await ctx.reply(
        "Nao consegui transcrever o audio. Tente novamente ou digite o tema."
      );
      return;
    }

    // Store pending topic in DB and set awaiting_confirmation
    await updateSession(tgId, {
      botStep: "awaiting_confirmation",
      pendingTopic: transcription,
    });

    const keyboard = new InlineKeyboard()
      .text("Sim, gerar artigo", "confirm_topic")
      .text("Nao, corrigir", "reject_topic");

    await ctx.reply(
      `Transcricao: *${transcription}*\n\nGerar artigo sobre este tema?`,
      {
        parse_mode: "Markdown",
        reply_markup: keyboard,
      }
    );
  } catch (err) {
    console.error("STT error:", err);
    await ctx.reply("Erro ao transcrever audio. Tente digitar o tema.");
  }
});

// ============================================
// Handle text messages
// ============================================
bot.on("message:text", async (ctx) => {
  const tgId = ctx.from.id;
  const text = ctx.message.text;

  // Read state from DB (survives cold starts)
  const session = await getSession(tgId);

  // Password auth flow
  if (session?.botStep === "awaiting_password") {
    const allUsers = await db.select().from(users);
    let authenticatedUser = null;

    for (const user of allUsers) {
      if (await bcrypt.compare(text, user.passwordHash)) {
        authenticatedUser = user;
        break;
      }
    }

    if (!authenticatedUser) {
      await ctx.reply("Senha incorreta. Tente novamente:");
      return;
    }

    await updateSession(tgId, {
      authenticated: true,
      userId: authenticatedUser.id,
      botStep: "idle",
    });

    await ctx.reply(
      "Autenticado! Envie um tema para gerar artigo.\n\nExemplo: \"Direitos do consumidor em compras online\""
    );
    return;
  }

  // Check auth
  if (!session?.authenticated) {
    await ctx.reply("Use /start para autenticar primeiro.");
    return;
  }

  // Filter casual messages (greetings, etc.)
  if (isCasualMessage(text)) {
    await ctx.reply(
      "Ola! Para gerar um artigo, envie o tema desejado.\n\nExemplo: \"Direitos do consumidor em compras online\""
    );
    return;
  }

  // Check generation lock
  if (isGenerationLocked(session)) {
    await ctx.reply("Ja estou gerando um artigo. Aguarde a conclusao.");
    return;
  }

  // Confirmation step: store topic, ask before generating
  await updateSession(tgId, {
    botStep: "awaiting_confirmation",
    pendingTopic: text,
  });

  const detectedArea = detectArea(text);
  const areaHint = detectedArea ? `\nArea detectada: ${detectedArea}` : "";

  const keyboard = new InlineKeyboard()
    .text("Sim, gerar artigo", "confirm_topic")
    .text("Cancelar", "reject_topic");

  await ctx.reply(
    `Gerar artigo sobre: *${text}*?${areaHint}\n\n(Geracao leva ate 60 segundos)`,
    { parse_mode: "Markdown", reply_markup: keyboard }
  );
});

// ============================================
// Article generation with DB lock
// ============================================
async function handleGeneration(
  ctx: { reply: (text: string, options?: object) => Promise<unknown> },
  tgId: number,
  topic: string
) {
  // Set generation lock
  await updateSession(tgId, {
    generatingAt: new Date(),
    botStep: "idle",
  });

  try {
    const area = detectArea(topic);
    const article = await generateArticle({ topic, area });

    const session = await getSession(tgId);

    // Save as draft article in DB
    const slug =
      article.title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .substring(0, 100) +
      "-" +
      Date.now().toString(36);

    const [saved] = await db
      .insert(articles)
      .values({
        title: article.title,
        slug,
        body: article.body,
        summary: article.summary,
        tags: article.tags,
        seoDescription: article.seoDescription,
        status: "draft",
        authorId: session?.userId || null,
        source: "telegram",
      })
      .returning();

    // Update session: clear lock, store pending article reference
    await updateSession(tgId, {
      generatingAt: null,
      pendingTopic: topic,
      pendingArticleId: saved.id,
      botStep: "idle",
    });

    const areaLabel = area ? `\nArea detectada: ${area}` : "";
    const preview =
      `*${article.title}*\n\n` +
      `${article.summary}\n` +
      `${areaLabel}\n\n` +
      `Tags: ${article.tags.map((t) => `#${t}`).join(" ")}`;

    const keyboard = new InlineKeyboard()
      .text("Aprovar", "approve")
      .text("Rejeitar", "reject")
      .row()
      .text("Regenerar", "regenerate");

    await ctx.reply(preview, {
      parse_mode: "Markdown",
      reply_markup: keyboard,
    });
  } catch (err) {
    console.error("Generation error:", err);
    // Clear lock on error
    await updateSession(tgId, {
      generatingAt: null,
      botStep: "idle",
    });
    await ctx.reply("Falha ao gerar artigo. Tente novamente.");
  }
}

export { bot };
