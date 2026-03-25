import { Bot, InlineKeyboard } from "grammy";
import { db } from "@/lib/db";
import { telegramSessions, users, articles, articleStatusHistory } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { generateArticle } from "@/lib/openrouter";
import { transcribeAudio } from "@/lib/groq";
import { onArticlePublished } from "@/lib/article-utils";


const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN || "dummy");

// State management (in-memory for few users)
const userState = new Map<
  number,
  {
    step: "idle" | "awaiting_password" | "awaiting_confirmation";
    pendingArticle?: { title: string; body: string; summary: string; tags: string[]; seoDescription: string };
    pendingTopic?: string;
  }
>();

function getState(userId: number) {
  return userState.get(userId) || { step: "idle" as const };
}

// /start command
bot.command("start", async (ctx) => {
  const tgId = ctx.from?.id;
  if (!tgId) return;

  const session = await db.query.telegramSessions.findFirst({
    where: eq(telegramSessions.telegramUserId, tgId),
  });

  if (session?.authenticated) {
    await ctx.reply("Você já está autenticado! Envie um tema ou áudio para gerar artigo.");
    return;
  }

  userState.set(tgId, { step: "awaiting_password" });
  await ctx.reply("Bem-vindo ao MMAS Artigos Bot!\n\nDigite sua senha para autenticar:");
});

// /logout command
bot.command("logout", async (ctx) => {
  const tgId = ctx.from?.id;
  if (!tgId) return;

  await db
    .update(telegramSessions)
    .set({ authenticated: false })
    .where(eq(telegramSessions.telegramUserId, tgId));

  userState.delete(tgId);
  await ctx.reply("Sessão encerrada. Use /start para autenticar novamente.");
});

// Handle callback queries (inline buttons)
bot.on("callback_query:data", async (ctx) => {
  const tgId = ctx.from.id;
  const data = ctx.callbackQuery.data;
  const state = getState(tgId);

  if (data === "approve" && state.pendingArticle) {
    const article = state.pendingArticle;
    const session = await db.query.telegramSessions.findFirst({
      where: eq(telegramSessions.telegramUserId, tgId),
    });

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
        status: "published",
        authorId: session?.userId || null,
        source: "telegram",
        publishedAt: new Date(),
      })
      .returning();

    if (session?.userId) {
      await db.insert(articleStatusHistory).values({
        articleId: saved.id,
        fromStatus: null,
        toStatus: "published",
        changedBy: session.userId,
      });
    }

    onArticlePublished(saved);

    const blogUrl = `${process.env.NEXT_PUBLIC_APP_URL}/blog/${slug}`;
    const shareKeyboard = new InlineKeyboard()
      .url("Ver no Blog", blogUrl)
      .row()
      .url(
        "Compartilhar WhatsApp",
        `https://wa.me/?text=${encodeURIComponent(article.title + " " + blogUrl)}`
      );

    userState.set(tgId, { step: "idle" });
    await ctx.editMessageText(`Artigo publicado!\n\n${blogUrl}`, {
      reply_markup: shareKeyboard,
    });
  } else if (data === "confirm_topic" && state.pendingTopic) {
    await ctx.editMessageText(`Gerando artigo sobre: "${state.pendingTopic}"...`);
    await handleGeneration(ctx, tgId, state.pendingTopic);
  } else if (data === "reject_topic") {
    userState.set(tgId, { step: "idle" });
    await ctx.editMessageText("Ok, envie o tema correto por texto.");
  } else if (data === "reject") {
    userState.set(tgId, { step: "idle" });
    await ctx.editMessageText("Artigo descartado. Envie novo tema quando quiser.");
  } else if (data === "regenerate" && state.pendingTopic) {
    await ctx.editMessageText("Regenerando artigo...");
    await handleGeneration(ctx, tgId, state.pendingTopic);
  }

  await ctx.answerCallbackQuery();
});

// Handle voice messages
bot.on("message:voice", async (ctx) => {
  const tgId = ctx.from.id;
  const session = await db.query.telegramSessions.findFirst({
    where: eq(telegramSessions.telegramUserId, tgId),
  });

  if (!session?.authenticated) {
    await ctx.reply("Use /start para autenticar primeiro.");
    return;
  }

  await ctx.reply("Transcrevendo áudio...");

  try {
    const file = await ctx.getFile();
    const url = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${file.file_path}`;
    const response = await fetch(url);
    const buffer = Buffer.from(await response.arrayBuffer());

    const transcription = await transcribeAudio(buffer);

    if (!transcription || transcription.length < 3) {
      await ctx.reply("Não consegui transcrever o áudio. Tente novamente ou digite o tema.");
      return;
    }

    userState.set(tgId, { ...getState(tgId), pendingTopic: transcription });

    const keyboard = new InlineKeyboard()
      .text("Sim, gerar artigo", "confirm_topic")
      .text("Não, corrigir", "reject_topic");

    await ctx.reply(`Transcrição: *${transcription}*\n\nGerar artigo sobre este tema?`, {
      parse_mode: "Markdown",
      reply_markup: keyboard,
    });
  } catch (err) {
    console.error("STT error:", err);
    await ctx.reply("Erro ao transcrever áudio. Tente digitar o tema.");
  }
});

// Handle text messages
bot.on("message:text", async (ctx) => {
  const tgId = ctx.from.id;
  const text = ctx.message.text;
  const state = getState(tgId);

  // Password auth
  if (state.step === "awaiting_password") {
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

    const existing = await db.query.telegramSessions.findFirst({
      where: eq(telegramSessions.telegramUserId, tgId),
    });

    if (existing) {
      await db
        .update(telegramSessions)
        .set({ authenticated: true, userId: authenticatedUser.id })
        .where(eq(telegramSessions.telegramUserId, tgId));
    } else {
      await db.insert(telegramSessions).values({
        telegramUserId: tgId,
        userId: authenticatedUser.id,
        authenticated: true,
      });
    }

    userState.set(tgId, { step: "idle" });
    await ctx.reply("Autenticado! Envie um tema ou áudio para gerar artigo.");
    return;
  }

  // Check auth
  const session = await db.query.telegramSessions.findFirst({
    where: eq(telegramSessions.telegramUserId, tgId),
  });

  if (!session?.authenticated) {
    await ctx.reply("Use /start para autenticar primeiro.");
    return;
  }

  // Generate article from text topic
  await ctx.reply(`Gerando artigo sobre: "${text}"...`);
  await handleGeneration(ctx, tgId, text);
});

async function handleGeneration(ctx: { reply: (text: string, options?: object) => Promise<unknown> }, tgId: number, topic: string) {
  try {
    const article = await generateArticle({ topic });

    userState.set(tgId, {
      step: "idle",
      pendingArticle: article,
      pendingTopic: topic,
    });

    const preview =
      `*${article.title}*\n\n` +
      `${article.summary}\n\n` +
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
    await ctx.reply("Falha ao gerar artigo. Tente novamente.");
    userState.set(tgId, { step: "idle" });
  }
}

export { bot };
