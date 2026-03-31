import { db } from "@/lib/db";
import { subscribers, newsletterLogs } from "@/lib/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { sendNewsletter } from "@/lib/resend";

export async function onArticlePublished(article: {
  id: string;
  title: string;
  slug: string;
  body: string;
  summary: string | null;
}) {
  try {
    const { revalidatePath } = await import("next/cache");
    revalidatePath("/blog", "page");
    revalidatePath(`/blog/${article.slug}`, "page");
    revalidatePath("/", "layout");
  } catch {
    // revalidatePath unavailable in this context
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const articleUrl = `${appUrl}/blog/${article.slug}`;

  const subs = await db
    .select({ email: subscribers.email })
    .from(subscribers)
    .where(and(eq(subscribers.confirmed, true), isNull(subscribers.unsubscribedAt)));

  if (subs.length === 0) return;

  let totalSent = 0;
  let totalError = 0;

  try {
    const result = await sendNewsletter(
      subs.map((s) => s.email),
      `Novo artigo: ${article.title}`,
      article.title,
      article.summary || article.body.substring(0, 200),
      articleUrl
    );
    totalSent = result.totalSent;
    totalError = result.totalError;
  } catch (err) {
    console.error("Newsletter send failed:", err);
    totalError = subs.length;
  }

  await db.insert(newsletterLogs).values({
    articleId: article.id,
    totalSent,
    totalError,
  });
}
