import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { articles, subscribers, newsletterLogs } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { sendNewsletter } from "@/lib/resend";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { articleId } = await request.json();

  const article = await db.query.articles.findFirst({
    where: eq(articles.id, articleId),
  });

  if (!article) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  const confirmedSubs = await db
    .select({ email: subscribers.email })
    .from(subscribers)
    .where(
      and(eq(subscribers.confirmed, true), isNull(subscribers.unsubscribedAt))
    );

  if (confirmedSubs.length === 0) {
    return NextResponse.json({ message: "No subscribers", totalSent: 0 });
  }

  const emails = confirmedSubs.map((s) => s.email);
  const articleUrl = `${process.env.NEXT_PUBLIC_APP_URL}/blog/${article.slug}`;

  const { totalSent, totalError } = await sendNewsletter(
    emails,
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

  return NextResponse.json({ totalSent, totalError });
}
