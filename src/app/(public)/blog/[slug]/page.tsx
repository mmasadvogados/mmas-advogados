import { db } from "@/lib/db";
import { articles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Calendar, Clock, ArrowLeft, Share2 } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { WhatsAppFAB } from "@/components/layout/whatsapp-fab";
import type { Metadata } from "next";
import ReactMarkdown from "react-markdown";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await db.query.articles.findFirst({
    where: eq(articles.slug, slug),
  });

  if (!article) return { title: "Artigo não encontrado" };

  return {
    title: article.title,
    description: article.seoDescription || article.summary || "",
    openGraph: {
      title: article.title,
      description: article.seoDescription || article.summary || "",
      type: "article",
      publishedTime: article.publishedAt?.toISOString(),
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await db.query.articles.findFirst({
    where: eq(articles.slug, slug),
  });

  if (!article || article.status !== "published") notFound();

  const readingTime = Math.ceil((article.body?.length || 0) / 1000);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[var(--color-background)] pt-28 pb-16">
        <article className="mx-auto max-w-3xl px-6">
          {/* Back link */}
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm text-[var(--color-foreground-muted)] hover:text-[var(--color-accent)] transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Blog
          </Link>

          {/* Title */}
          <h1 className="font-[family-name:var(--font-heading)] text-3xl md:text-4xl font-bold text-[var(--color-foreground)] leading-tight">
            {article.title}
          </h1>

          {/* Meta */}
          <div className="flex items-center gap-4 mt-4 text-sm text-[var(--color-foreground-muted)]">
            {article.publishedAt && (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {new Date(article.publishedAt).toLocaleDateString("pt-BR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {readingTime} min de leitura
            </span>
          </div>

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 text-xs rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)] border border-[var(--color-accent)]/20"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="mt-6 w-full h-px bg-[var(--color-border)]" />

          {/* Body */}
          <div className="mt-8 prose prose-invert prose-gold max-w-none text-[var(--color-foreground-muted)] leading-relaxed [&_h2]:font-[family-name:var(--font-heading)] [&_h2]:text-[var(--color-foreground)] [&_h2]:text-2xl [&_h2]:mt-10 [&_h2]:mb-4 [&_h3]:text-[var(--color-foreground)] [&_h3]:text-xl [&_h3]:mt-8 [&_h3]:mb-3 [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:mb-2 [&_strong]:text-[var(--color-foreground)] [&_strong]:font-semibold [&_a]:text-[var(--color-accent)] [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-[var(--color-accent)] [&_blockquote]:pl-4 [&_blockquote]:italic [&_img]:w-full [&_img]:rounded-2xl [&_img]:shadow-[var(--shadow-glow-gold-muted)] [&_img]:mb-8">
            <ReactMarkdown>{article.body}</ReactMarkdown>
          </div>

          {/* Share */}
          <div className="mt-12 pt-8 border-t border-[var(--color-border)]">
            <div className="flex items-center gap-4">
              <Share2 className="w-5 h-5 text-[var(--color-accent)]" />
              <span className="text-sm text-[var(--color-foreground-muted)]">
                Compartilhar:
              </span>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(article.title + " " + process.env.NEXT_PUBLIC_APP_URL + "/blog/" + article.slug)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 text-sm rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors"
              >
                WhatsApp
              </a>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(process.env.NEXT_PUBLIC_APP_URL + "/blog/" + article.slug)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 text-sm rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
              >
                LinkedIn
              </a>
            </div>
          </div>
        </article>
      </main>
      <Footer />
      <WhatsAppFAB />
    </>
  );
}
