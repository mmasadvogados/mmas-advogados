import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { articles, articleStatusHistory } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { onArticlePublished } from "@/lib/article-utils";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allArticles = await db
    .select()
    .from(articles)
    .orderBy(desc(articles.createdAt))
    .limit(100);

  return NextResponse.json(allArticles);
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 100);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const slug = slugify(body.title) + "-" + Date.now().toString(36);

  const [article] = await db
    .insert(articles)
    .values({
      title: body.title,
      slug,
      body: body.body,
      summary: body.summary || null,
      tags: body.tags || [],
      status: body.status || "draft",
      seoDescription: body.seoDescription || null,
      authorId: session.user.id,
      source: body.source || "web",
      publishedAt: body.status === "published" ? new Date() : null,
    })
    .returning();

  await db.insert(articleStatusHistory).values({
    articleId: article.id,
    fromStatus: null,
    toStatus: article.status,
    changedBy: session.user.id,
  });

  if (article.status === "published") {
    onArticlePublished(article);
  }

  return NextResponse.json(article, { status: 201 });
}
