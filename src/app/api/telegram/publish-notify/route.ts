import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { articles, subscribers, newsletterLogs } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { sendNewsletter } from "@/lib/resend";

export async function POST(request: Request) {
  // Verify internal secret
  const secret = process.env.REVALIDATE_SECRET;
  if (secret) {
    const auth = request.headers.get("Authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const { articleId } = await request.json();

    if (!articleId) {
      return NextResponse.json({ error: "articleId required" }, { status: 400 });
    }

    // Read article
    const article = await db.query.articles.findFirst({
      where: eq(articles.id, articleId),
    });

    if (!article || article.status !== "published") {
      return NextResponse.json({ error: "Article not found or not published" }, { status: 404 });
    }

    // Get confirmed subscribers
    const confirmedSubs = await db
      .select({ email: subscribers.email })
      .from(subscribers)
      .where(and(eq(subscribers.confirmed, true), isNull(subscribers.unsubscribedAt)));

    if (confirmedSubs.length === 0) {
      return NextResponse.json({ message: "No subscribers", totalSent: 0, totalError: 0 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
    const articleUrl = `${appUrl}/blog/${article.slug}`;

    const { totalSent, totalError } = await sendNewsletter(
      confirmedSubs.map((s) => s.email),
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

    console.log(`[publish-notify] Article ${articleId}: sent=${totalSent}, errors=${totalError}`);

    return NextResponse.json({ totalSent, totalError });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("publish-notify error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
