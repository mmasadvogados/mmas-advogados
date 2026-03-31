import { db } from "@/lib/db";
import { articles } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { BlogSection } from "./blog-section";

export async function BlogSectionWrapper() {
  const posts = await db
    .select({
      id: articles.id,
      title: articles.title,
      slug: articles.slug,
      summary: articles.summary,
      tags: articles.tags,
      body: articles.body,
      publishedAt: articles.publishedAt,
    })
    .from(articles)
    .where(eq(articles.status, "published"))
    .orderBy(desc(articles.publishedAt))
    .limit(3);

  const previews = posts.map((post) => ({
    id: post.id,
    title: post.title,
    slug: post.slug,
    summary: post.summary,
    tags: post.tags,
    readingTime: Math.ceil((post.body?.length || 0) / 1000),
    publishedAt: post.publishedAt?.toISOString() ?? null,
    ogImageUrl: `/api/og/article?title=${encodeURIComponent(post.title)}${post.tags?.[0] ? `&area=${encodeURIComponent(post.tags[0])}` : ""}`,
  }));

  return <BlogSection articles={previews} />;
}
