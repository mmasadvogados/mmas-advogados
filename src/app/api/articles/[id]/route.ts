import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { articles, articleStatusHistory } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { onArticlePublished } from "@/lib/article-utils";

type Props = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Props) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const article = await db.query.articles.findFirst({
    where: eq(articles.id, id),
  });

  if (!article) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(article);
}

export async function PUT(request: Request, { params }: Props) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  const existing = await db.query.articles.findFirst({
    where: eq(articles.id, id),
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updateData: Record<string, unknown> = { updatedAt: new Date() };

  if (body.title !== undefined) updateData.title = body.title;
  if (body.body !== undefined) updateData.body = body.body;
  if (body.summary !== undefined) updateData.summary = body.summary;
  if (body.tags !== undefined) updateData.tags = body.tags;
  if (body.seoDescription !== undefined)
    updateData.seoDescription = body.seoDescription;

  if (body.status !== undefined && body.status !== existing.status) {
    updateData.status = body.status;
    if (body.status === "published") updateData.publishedAt = new Date();

    await db.insert(articleStatusHistory).values({
      articleId: id,
      fromStatus: existing.status,
      toStatus: body.status,
      changedBy: session.user.id,
    });
  }

  const [updated] = await db
    .update(articles)
    .set(updateData)
    .where(eq(articles.id, id))
    .returning();

  revalidatePath("/blog");
  revalidatePath(`/blog/${existing.slug}`);

  if (body.status === "published" && body.status !== existing.status) {
    void onArticlePublished(updated).catch(console.error);
  }

  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: Props) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  await db.delete(articles).where(eq(articles.id, id));

  revalidatePath("/blog");

  return NextResponse.json({ ok: true });
}
