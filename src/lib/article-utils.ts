import { db } from "@/lib/db";
import { subscribers, newsletterLogs } from "@/lib/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { sendNewsletter } from "@/lib/resend";
import { revalidatePath } from "next/cache";

export function onArticlePublished(article: {
  id: string;
  title: string;
  slug: string;
  body: string;
  summary: string | null;
}) {
  // Revalidar cache do blog
  try {
    revalidatePath("/blog", "page");
    revalidatePath(`/blog/${article.slug}`, "page");
    revalidatePath("/", "layout");
  } catch {
    // revalidatePath pode falhar fora do contexto Next.js (ex: webhook Telegram)
  }

  // Newsletter em background (não bloqueia a resposta)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const articleUrl = `${appUrl}/blog/${article.slug}`;

  db.select({ email: subscribers.email })
    .from(subscribers)
    .where(and(eq(subscribers.confirmed, true), isNull(subscribers.unsubscribedAt)))
    .then(async (subs) => {
      if (subs.length === 0) return;
      const { totalSent, totalError } = await sendNewsletter(
        subs.map((s) => s.email),
        `Novo artigo: ${article.title}`,
        article.title,
        article.summary || article.body.substring(0, 200),
        articleUrl
      );
      await db.insert(newsletterLogs).values({
        articleId: article.id,
        totalSent,
        totalError,
      });
    })
    .catch((err) => console.error("Auto newsletter failed:", err));
}
