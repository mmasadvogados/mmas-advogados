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
}): Promise<{ revalidated: boolean; newsletterSent: number; newsletterError: number }> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const articleUrl = `${appUrl}/blog/${article.slug}`;

  // --- 1. Revalidar cache do blog ---
  let revalidated = false;

  // Tentar revalidatePath nativo primeiro
  try {
    const { revalidatePath } = await import("next/cache");
    revalidatePath("/blog", "page");
    revalidatePath(`/blog/${article.slug}`, "page");
    revalidatePath("/", "layout");
    revalidated = true;
  } catch {
    // revalidatePath indisponível neste contexto (webhook) — usar fallback HTTP
  }

  // Fallback: chamar API de revalidação via fetch (funciona em qualquer contexto)
  if (!revalidated && appUrl) {
    try {
      const res = await fetch(`${appUrl}/api/revalidate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.REVALIDATE_SECRET || ""}`,
        },
        body: JSON.stringify({
          paths: ["/blog", `/blog/${article.slug}`, "/"],
        }),
        signal: AbortSignal.timeout(10000),
      });
      revalidated = res.ok;
      if (!res.ok) {
        console.error("Revalidate API failed:", res.status, await res.text().catch(() => ""));
      }
    } catch (err) {
      console.error("Revalidate fetch failed:", err);
    }
  }

  // --- 2. Disparar newsletter (awaited, não fire-and-forget) ---
  let totalSent = 0;
  let totalError = 0;

  try {
    const subs = await db
      .select({ email: subscribers.email })
      .from(subscribers)
      .where(and(eq(subscribers.confirmed, true), isNull(subscribers.unsubscribedAt)));

    if (subs.length > 0) {
      const result = await sendNewsletter(
        subs.map((s) => s.email),
        `Novo artigo: ${article.title}`,
        article.title,
        article.summary || article.body.substring(0, 200),
        articleUrl
      );
      totalSent = result.totalSent;
      totalError = result.totalError;

      await db.insert(newsletterLogs).values({
        articleId: article.id,
        totalSent,
        totalError,
      });
    }
  } catch (err) {
    console.error("Auto newsletter failed:", err);
  }

  return { revalidated, newsletterSent: totalSent, newsletterError: totalError };
}
