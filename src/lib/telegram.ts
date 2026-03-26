import { Bot, InlineKeyboard } from "grammy";
import { db } from "@/lib/db";
import {
  telegramSessions,
  users,
  articles,
  articleStatusHistory,
} from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { generateArticle } from "@/lib/openrouter";
import { transcribeAudio } from "@/lib/groq";
// onArticlePublished is now triggered via HTTP to avoid blocking the webhook handler

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN || "dummy", {
  client: {
    // Vercel serverless can have high latency to Telegram API
    // Default grammy timeout is 10s which is too low
    timeoutSeconds: 60,
  },
});

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

// --- Casual message detection and friendly responses ---

const CASUAL_CATEGORIES: { patterns: RegExp[]; replies: string[] }[] = [
  {
    // Greetings
    patterns: [
      /^(oi|ol[aá]|hey|hello|hi|e a[ií]|eai|fala|salve|opa)\b/i,
      /^(bom dia|boa tarde|boa noite)\b/i,
    ],
    replies: [
      "Ola! Tudo bem? Qual tema voce gostaria de transformar em artigo?\n\nVoce pode digitar o tema ou enviar um audio!",
      "Oi! Que bom falar com voce! Sobre qual assunto juridico deseja gerar um artigo?\n\nPode enviar por texto ou audio!",
      "Ola! Estou pronto para ajudar! Me diga o tema do artigo que deseja gerar.\n\nAceito texto ou audio!",
    ],
  },
  {
    // How are you / small talk
    patterns: [
      /^(tudo bem|tudo certo|como vai|beleza|blz|td bem|como voce esta|como vc esta)/i,
    ],
    replies: [
      "Tudo otimo! Pronto para gerar artigos. Qual tema voce tem em mente?\n\nPode enviar por texto ou audio!",
      "Tudo bem sim! Em que posso ajudar? Me envie o tema do artigo por texto ou audio.",
    ],
  },
  {
    // Thanks
    patterns: [/^(obrigad[oa]|valeu|brigad[oa]|vlw|thanks|tks)\b/i],
    replies: [
      "De nada! Se precisar de outro artigo, e so enviar o tema por texto ou audio.",
      "Por nada! Estou aqui quando precisar. Envie um tema ou audio para gerar outro artigo.",
    ],
  },
  {
    // Goodbye
    patterns: [/^(tchau|at[eé] mais|at[eé] logo|flw|falou)\b/i],
    replies: [
      "Ate mais! Quando precisar de um artigo, e so me chamar.",
      "Ate logo! Estarei aqui quando precisar. Envie um tema ou audio a qualquer momento.",
    ],
  },
  {
    // Short affirmatives/negatives (prevent accidental generation)
    patterns: [/^(ok|sim|n[aã]o|s|n|yes|no)\s*[.!?]*$/i],
    replies: [
      "Se quiser gerar um artigo, envie o tema completo por texto ou audio.\n\nExemplo: \"Direitos do consumidor em compras online\"",
    ],
  },
];

function getCasualReply(text: string): string | null {
  const trimmed = text.trim();
  if (trimmed.length < 3) {
    return "Se quiser gerar um artigo, envie o tema completo por texto ou audio.\n\nExemplo: \"Direitos do consumidor em compras online\"";
  }
  for (const category of CASUAL_CATEGORIES) {
    if (category.patterns.some((p) => p.test(trimmed))) {
      return category.replies[Math.floor(Math.random() * category.replies.length)];
    }
  }
  return null;
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

// Safe edit that ignores "message is not modified" errors (duplicate clicks / Telegram retries)
async function safeEditMessage(
  ctx: { editMessageText: (text: string, options?: object) => Promise<unknown> },
  text: string,
  options?: object
) {
  try {
    await ctx.editMessageText(text, options);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("message is not modified")) return; // harmless duplicate
    throw err; // re-throw real errors
  }
}

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

    if (data === "approve") {
      let articleId = session.pendingArticleId;

      // Fallback: find most recent draft by this user if pendingArticleId was lost
      if (!articleId && session.userId) {
        const [recent] = await db
          .select({ id: articles.id })
          .from(articles)
          .where(
            and(
              eq(articles.authorId, session.userId),
              eq(articles.status, "draft"),
              eq(articles.source, "telegram")
            )
          )
          .orderBy(desc(articles.createdAt))
          .limit(1);
        articleId = recent?.id || null;
      }

      if (!articleId) {
        await ctx.reply(
          "Nenhum artigo pendente para aprovar. Envie um tema para gerar."
        );
        return;
      }

      // Read article from DB
      const [draft] = await db
        .select()
        .from(articles)
        .where(eq(articles.id, articleId))
        .limit(1);

      if (!draft) {
        await ctx.reply("Artigo nao encontrado no banco. Envie novo tema.");
        await updateSession(tgId, {
          botStep: "idle",
          pendingArticleId: null,
          pendingTopic: null,
        });
        return;
      }

      // Guard: if already published (retry/duplicate click), just confirm
      if (draft.status === "published") {
        const blogUrl = `${process.env.NEXT_PUBLIC_APP_URL}/blog/${draft.slug}`;
        await updateSession(tgId, {
          botStep: "idle",
          pendingArticleId: null,
          pendingTopic: null,
        });
        await safeEditMessage(ctx, "Artigo ja foi publicado!");
        await ctx.reply(
          `Artigo ja publicado anteriormente.\n\nLink: ${blogUrl}`,
          {
            reply_markup: new InlineKeyboard()
              .url("Ver no Blog", blogUrl)
              .row()
              .url(
                "Compartilhar WhatsApp",
                `https://wa.me/?text=${encodeURIComponent(draft.title + " " + blogUrl)}`
              ),
          }
        );
        return;
      }

      // STEP 1: Clear session FIRST (prevents duplicate actions on retry)
      console.log(`[APPROVE] Step 1: Clearing session for tgId=${tgId}, articleId=${draft.id}`);
      await updateSession(tgId, {
        botStep: "idle",
        pendingArticleId: null,
        pendingTopic: null,
        generatingAt: null,
      });

      // STEP 2: Update to published (simple WHERE by ID only — idempotency guard above handles duplicates)
      console.log(`[APPROVE] Step 2: Updating article ${draft.id} from "${draft.status}" to "published"`);
      const [updated] = await db
        .update(articles)
        .set({ status: "published", publishedAt: new Date() })
        .where(eq(articles.id, draft.id))
        .returning({ id: articles.id, status: articles.status, slug: articles.slug });

      console.log(`[APPROVE] Step 3: Update returned: ${JSON.stringify(updated)}`);

      if (!updated || updated.status !== "published") {
        console.error(`[APPROVE] FAILED: updated=${JSON.stringify(updated)}`);
        await ctx.reply(
          `ERRO: Falha ao publicar artigo (ID: ${draft.id}). Status: ${updated?.status || "nenhum retorno"}. Tente novamente.`
        );
        return;
      }

      // STEP 3: Verify in DB (belt-and-suspenders — confirm the write persisted)
      const [verified] = await db
        .select({ status: articles.status, slug: articles.slug })
        .from(articles)
        .where(eq(articles.id, draft.id))
        .limit(1);

      console.log(`[APPROVE] Step 4: Verified in DB: status=${verified?.status}, slug=${verified?.slug}`);

      if (verified?.status !== "published") {
        console.error(`[APPROVE] VERIFICATION FAILED! DB shows: ${verified?.status}`);
        await ctx.reply(
          `ERRO: Artigo atualizado mas verificacao falhou (status=${verified?.status}). Contate o admin.`
        );
        return;
      }

      // Record status history
      if (session.userId) {
        await db.insert(articleStatusHistory).values({
          articleId: draft.id,
          fromStatus: draft.status,
          toStatus: "published",
          changedBy: session.userId,
        });
      }

      // STEP 4: Reply to Telegram IMMEDIATELY (before heavy work)
      const blogUrl = `${process.env.NEXT_PUBLIC_APP_URL}/blog/${verified.slug}`;
      const shareKeyboard = new InlineKeyboard()
        .url("Ver no Blog", blogUrl)
        .row()
        .url(
          "Compartilhar WhatsApp",
          `https://wa.me/?text=${encodeURIComponent(draft.title + " " + blogUrl)}`
        );

      await safeEditMessage(ctx, "Publicado!");
      await ctx.reply(
        `Artigo publicado!\n\n` +
          `Titulo: ${draft.title}\n` +
          `Status: publicado (verificado no banco)\n` +
          `Link: ${blogUrl}\n\n` +
          `Blog e newsletter sendo atualizados...`,
        { reply_markup: shareKeyboard }
      );

      console.log(`[APPROVE] Step 5: Telegram reply sent, firing background tasks`);

      // STEP 5: Trigger revalidation + newsletter via separate HTTP calls
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";

      fetch(`${appUrl}/api/revalidate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.REVALIDATE_SECRET || ""}`,
        },
        body: JSON.stringify({
          paths: ["/blog", `/blog/${verified.slug}`, "/"],
        }),
        signal: AbortSignal.timeout(15000),
      }).catch((err) => console.error("[APPROVE] Revalidate failed:", err));

      fetch(`${appUrl}/api/telegram/publish-notify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.REVALIDATE_SECRET || ""}`,
        },
        body: JSON.stringify({ articleId: draft.id }),
        signal: AbortSignal.timeout(15000),
      }).catch((err) => console.error("[APPROVE] Newsletter failed:", err));

    } else if (data === "confirm_topic") {
      console.log(`[CALLBACK] confirm_topic for tgId=${tgId}`);
      const topic = session.pendingTopic;
      if (!topic) {
        await ctx.reply(
          "Tema nao encontrado. Envie o tema novamente por texto ou audio."
        );
        return;
      }
      await safeEditMessage(
        ctx,
        `Gerando artigo sobre: "${topic}"...\n\nIsso pode levar ate 60 segundos.`
      );
      console.log(`[CALLBACK] Starting handleGeneration for topic="${topic}"`);
      await handleGeneration(ctx, tgId, topic);

    } else if (data === "reject_topic") {
      await updateSession(tgId, {
        botStep: "idle",
        pendingTopic: null,
      });
      await safeEditMessage(ctx, "Ok, envie o tema correto por texto.");

    } else if (data === "reject") {
      // Delete draft article if exists
      if (session.pendingArticleId) {
        await db
          .delete(articles)
          .where(eq(articles.id, session.pendingArticleId));
      }
      await updateSession(tgId, {
        botStep: "idle",
        pendingArticleId: null,
        pendingTopic: null,
      });
      await safeEditMessage(
        ctx,
        "Artigo descartado. Envie novo tema quando quiser."
      );

    } else if (data === "regenerate") {
      const topic = session.pendingTopic;
      if (!topic) {
        await ctx.reply(
          "Tema nao encontrado. Envie o tema novamente por texto ou audio."
        );
        return;
      }
      // Delete previous draft
      if (session.pendingArticleId) {
        await db
          .delete(articles)
          .where(eq(articles.id, session.pendingArticleId));
      }
      await updateSession(tgId, { pendingArticleId: null });
      await safeEditMessage(ctx, "Regenerando artigo...");
      await handleGeneration(ctx, tgId, topic);

    } else {
      await ctx.reply(
        "Nenhuma acao pendente. Envie um tema para gerar novo artigo."
      );
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("Callback error:", errorMsg, err);
    try {
      await ctx.reply(
        `Erro ao processar: ${errorMsg.substring(0, 200)}\n\nTente novamente enviando o tema.`
      );
    } catch {
      // silently ignore if reply also fails
    }
    // Only clean up lock/step — preserve pendingArticleId and pendingTopic
    // so the user can still approve/reject after an error
    try {
      await updateSession(tgId, {
        botStep: "idle",
        generatingAt: null,
      });
    } catch {
      // DB cleanup failed, continue anyway
    }
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
      `Transcricao: <b>${escapeHtml(transcription)}</b>\n\nGerar artigo sobre este tema?`,
      {
        parse_mode: "HTML",
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

  // Friendly response to casual messages (greetings, thanks, etc.)
  const casualReply = getCasualReply(text);
  if (casualReply) {
    await ctx.reply(casualReply);
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
    `Gerar artigo sobre: <b>${escapeHtml(text)}</b>?${areaHint}\n\n(Geracao leva ate 60 segundos)`,
    { parse_mode: "HTML", reply_markup: keyboard }
  );
});

// ============================================
// Article generation with DB lock
// ============================================
// Escape HTML special characters for Telegram HTML parse mode
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function handleGeneration(
  ctx: { reply: (text: string, options?: object) => Promise<unknown> },
  tgId: number,
  topic: string
) {
  try {
    // Set generation lock
    console.log(`[GENERATE] Starting for tgId=${tgId}, topic="${topic}"`);
    await updateSession(tgId, {
      generatingAt: new Date(),
      botStep: "idle",
    });

    const area = detectArea(topic);
    console.log(`[GENERATE] Calling LLM, area=${area || "auto"}`);
    const article = await generateArticle({ topic, area, length: "medium", tone: "technical" });
    console.log(`[GENERATE] LLM returned: title="${article.title}", body=${article.body.length} chars`);

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

    console.log(`[GENERATE] Saved to DB: id=${saved.id}, slug=${saved.slug}`);

    // Update session: clear lock, store pending article reference
    await updateSession(tgId, {
      generatingAt: null,
      pendingTopic: topic,
      pendingArticleId: saved.id,
      botStep: "idle",
    });

    const areaLabel = area ? `\nArea detectada: ${escapeHtml(area)}` : "";

    // Count article stats
    const wordCount = article.body.split(/\s+/).length;
    const sectionCount = (article.body.match(/^##\s/gm) || []).length;

    // Show beginning of actual article body (truncated to fit Telegram 4096 char limit)
    const bodyLines = article.body.split("\n").filter((l) => l.trim());
    let bodyPreview = "";
    for (const line of bodyLines) {
      if (bodyPreview.length + line.length > 2500) break;
      bodyPreview += line + "\n";
    }
    bodyPreview = escapeHtml(bodyPreview.trim());

    const preview =
      `<b>${escapeHtml(article.title)}</b>\n\n` +
      `<i>${escapeHtml(article.summary)}</i>\n` +
      `${areaLabel}\n` +
      `Tags: ${article.tags.map((t) => `#${escapeHtml(t)}`).join(" ")}\n\n` +
      `--- Preview do artigo ---\n\n` +
      `${bodyPreview}\n\n` +
      `--- Fim do preview ---\n` +
      `Palavras: ${wordCount} | Secoes: ${sectionCount}`;

    const keyboard = new InlineKeyboard()
      .text("Aprovar", "approve")
      .text("Rejeitar", "reject")
      .row()
      .text("Regenerar", "regenerate");

    // Telegram max message length is 4096 chars
    const finalPreview =
      preview.length > 4000
        ? preview.substring(0, 3950) + "\n\n... (preview truncado)"
        : preview;

    console.log(`[GENERATE] Sending preview to Telegram (${finalPreview.length} chars)`);
    await ctx.reply(finalPreview, {
      parse_mode: "HTML",
      reply_markup: keyboard,
    });
    console.log(`[GENERATE] Complete for tgId=${tgId}`);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[GENERATE] ERROR:", errorMsg, err);
    // Clear lock on error
    try {
      await updateSession(tgId, {
        generatingAt: null,
        botStep: "idle",
      });
    } catch {
      // DB cleanup failed, continue anyway
    }
    // Send as plain text (no Markdown) to avoid double failure
    await ctx.reply(`Falha ao gerar artigo: ${errorMsg.substring(0, 200)}`);
  }
}

// Global error handler — prevents grammy from propagating errors to the webhook route
bot.catch((err) => {
  const ctx = err.ctx;
  const e = err.error;
  const errorMsg = e instanceof Error ? e.message : String(e);
  console.error(`[BOT ERROR] Update ${ctx.update.update_id}: ${errorMsg}`, e);
  // Try to notify user, but don't throw if it fails
  ctx.reply(`Erro interno: ${errorMsg.substring(0, 200)}\n\nTente novamente.`).catch(() => {});
});

export { bot };
