import { db } from "@/lib/db";
import { articles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Calendar, Clock, ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";

export const dynamic = "force-dynamic";

const statusColors: Record<string, string> = {
  draft: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  review: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  published: "bg-green-500/10 text-green-400 border-green-500/20",
  rejected: "bg-red-500/10 text-red-400 border-red-500/20",
};

const statusLabels: Record<string, string> = {
  draft: "Rascunho",
  review: "Revisão",
  published: "Publicado",
  rejected: "Rejeitado",
};

type Props = { params: Promise<{ slug: string }> };

export default async function ArticlePreviewPage({ params }: Props) {
  const { slug } = await params;
  const article = await db.query.articles.findFirst({
    where: eq(articles.slug, slug),
  });

  if (!article) notFound();

  const readingTime = Math.ceil((article.body?.length || 0) / 1000);

  return (
    <div className="space-y-6">
      {/* Status banner */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/artigos"
          className="inline-flex items-center gap-2 text-sm text-[var(--color-foreground-muted)] hover:text-[var(--color-accent)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar aos Artigos
        </Link>
        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1 text-xs rounded-full border ${statusColors[article.status]}`}
          >
            {statusLabels[article.status]}
          </span>
          {article.status === "published" && (
            <a
              href={`/blog/${article.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded bg-[var(--color-accent)]/10 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/20 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Ver no Blog
            </a>
          )}
        </div>
      </div>

      {/* Article content */}
      <article className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8">
        <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold text-[var(--color-foreground)] leading-tight">
          {article.title}
        </h1>

        {/* Meta */}
        <div className="flex items-center gap-4 mt-4 text-sm text-[var(--color-foreground-muted)]">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            {new Date(article.createdAt).toLocaleDateString("pt-BR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
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
      </article>
    </div>
  );
}
