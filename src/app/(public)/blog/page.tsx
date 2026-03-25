import { db } from "@/lib/db";
import { articles } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { Calendar, Clock } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { WhatsAppFAB } from "@/components/layout/whatsapp-fab";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Blog",
  description:
    "Artigos jurídicos e atualizações do escritório MMAS Advogados.",
};

export default async function BlogPage() {
  const posts = await db
    .select()
    .from(articles)
    .where(eq(articles.status, "published"))
    .orderBy(desc(articles.publishedAt))
    .limit(20);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[var(--color-background)] pt-28 pb-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12">
            <h1 className="font-[family-name:var(--font-heading)] text-4xl font-bold text-[var(--color-foreground)]">
              Blog <span className="text-[var(--color-accent)]">Jurídico</span>
            </h1>
            <div className="mt-4 w-16 h-px bg-[var(--color-accent)]" />
            <p className="mt-4 text-[var(--color-foreground-muted)]">
              Artigos, análises e atualizações sobre as diversas áreas do
              direito.
            </p>
          </div>

          {posts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-[var(--color-foreground-muted)] text-lg">
                Nenhum artigo publicado ainda.
              </p>
              <p className="text-sm text-[var(--color-foreground-muted)] mt-2">
                Em breve, novos conteúdos jurídicos serão publicados aqui.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="group rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-accent)]/40 hover:shadow-[var(--shadow-glow-gold)] overflow-hidden transition-all duration-300"
                >
                  {/* Cover image */}
                  <div className="h-48 overflow-hidden bg-[var(--color-surface-light)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/og/article?title=${encodeURIComponent(post.title)}${post.tags?.[0] ? `&area=${encodeURIComponent(post.tags[0])}` : ""}`}
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="p-6 space-y-3">
                    <h2 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-[var(--color-foreground)] group-hover:text-[var(--color-accent)] transition-colors line-clamp-2">
                      {post.title}
                    </h2>

                    {post.summary && (
                      <p className="text-sm text-[var(--color-foreground-muted)] line-clamp-3">
                        {post.summary}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-[var(--color-foreground-muted)]">
                      {post.publishedAt && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(post.publishedAt).toLocaleDateString(
                            "pt-BR"
                          )}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {Math.ceil((post.body?.length || 0) / 1000)} min
                      </span>
                    </div>

                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {post.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 text-xs rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
      <WhatsAppFAB />
    </>
  );
}
