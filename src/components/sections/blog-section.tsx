"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { Calendar, Clock, ArrowRight, BookOpen } from "lucide-react";

interface BlogArticlePreview {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  tags: string[] | null;
  readingTime: number;
  publishedAt: string | null;
  ogImageUrl: string;
}

interface BlogSectionProps {
  articles: BlogArticlePreview[];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function FeaturedCard({
  article,
  inView,
  index,
}: {
  article: BlogArticlePreview;
  inView: boolean;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: 0.4 + index * 0.15 }}
      className="lg:row-span-2"
    >
      <Link
        href={`/blog/${article.slug}`}
        className="group glass rounded-2xl overflow-hidden gold-border-animated flex flex-col h-full hover:shadow-[var(--shadow-glow-gold)] hover:-translate-y-1 transition-all duration-500"
      >
        <div className="h-56 lg:h-64 overflow-hidden bg-[var(--color-surface-light)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={article.ogImageUrl}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        </div>

        <div className="p-6 lg:p-7 space-y-3 flex-1 flex flex-col">
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {article.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-0.5 text-xs rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)] border border-[var(--color-accent)]/20"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <h3 className="font-[family-name:var(--font-heading)] text-xl lg:text-2xl font-semibold text-[var(--color-cream)] group-hover:text-[var(--color-accent)] transition-colors duration-300 line-clamp-2">
            {article.title}
          </h3>

          {article.summary && (
            <p className="text-sm text-[var(--color-foreground-muted)] line-clamp-3 flex-1">
              {article.summary}
            </p>
          )}

          <div className="flex items-center gap-4 text-xs text-[var(--color-foreground-muted)] pt-2">
            {article.publishedAt && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(article.publishedAt)}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {article.readingTime} min de leitura
            </span>
          </div>

          <div className="pt-3 border-t border-[var(--color-border)]">
            <span className="inline-flex items-center gap-1.5 text-sm text-[var(--color-accent)] group-hover:gap-2.5 transition-all duration-300">
              Leia o artigo
              <ArrowRight className="w-4 h-4" />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function SupportingCard({
  article,
  inView,
  index,
}: {
  article: BlogArticlePreview;
  inView: boolean;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: 0.4 + index * 0.15 }}
    >
      <Link
        href={`/blog/${article.slug}`}
        className="group glass rounded-2xl overflow-hidden gold-border-animated flex flex-row h-full hover:shadow-[var(--shadow-glow-gold)] hover:-translate-y-1 transition-all duration-500"
      >
        <div className="w-36 sm:w-44 shrink-0 overflow-hidden bg-[var(--color-surface-light)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={article.ogImageUrl}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        </div>

        <div className="p-5 space-y-2 flex-1 flex flex-col justify-center">
          {article.tags && article.tags.length > 0 && (
            <span className="px-2.5 py-0.5 text-xs rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)] border border-[var(--color-accent)]/20 self-start">
              {article.tags[0]}
            </span>
          )}

          <h3 className="font-[family-name:var(--font-heading)] text-base lg:text-lg font-semibold text-[var(--color-cream)] group-hover:text-[var(--color-accent)] transition-colors duration-300 line-clamp-2">
            {article.title}
          </h3>

          <div className="flex items-center gap-3 text-xs text-[var(--color-foreground-muted)]">
            {article.publishedAt && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(article.publishedAt)}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {article.readingTime} min
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-20">
      <div className="w-16 h-16 mx-auto mb-6 rounded-full border border-[var(--color-accent)]/20 flex items-center justify-center">
        <BookOpen className="w-7 h-7 text-[var(--color-accent)]/40" />
      </div>
      <p className="text-[var(--color-foreground-muted)] text-lg font-[family-name:var(--font-heading)]">
        Em breve, conteúdos jurídicos exclusivos
      </p>
      <p className="text-sm text-[var(--color-foreground-muted)]/60 mt-2">
        Nossos especialistas estão preparando artigos para você.
      </p>
    </div>
  );
}

export function BlogSection({ articles }: BlogSectionProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="blog" className="py-32 relative overflow-hidden" ref={ref}>
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <div className="mb-16">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            className="section-label mb-4"
          >
            Insights Jurídicos
          </motion.p>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={inView ? { scaleX: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="w-20 h-px bg-[var(--color-accent)] mb-8 origin-left"
          />
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3 }}
            className="font-[family-name:var(--font-heading)] font-bold text-[var(--color-cream)] leading-tight"
            style={{ fontSize: "var(--text-h1)" }}
          >
            Conhecimento que{" "}
            <span className="text-[var(--color-accent)]">Transforma</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.4 }}
            className="mt-4 text-[var(--color-foreground-muted)] max-w-2xl"
          >
            Artigos, análises e atualizações sobre as diversas áreas do direito,
            escritos pelos nossos especialistas.
          </motion.p>
        </div>

        {/* Content */}
        {articles.length === 0 && <EmptyState />}

        {articles.length === 1 && (
          <div className="max-w-2xl mx-auto">
            <FeaturedCard article={articles[0]} inView={inView} index={0} />
          </div>
        )}

        {articles.length === 2 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-8">
            <FeaturedCard article={articles[0]} inView={inView} index={0} />
            <FeaturedCard article={articles[1]} inView={inView} index={1} />
          </div>
        )}

        {articles.length >= 3 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-8">
            <FeaturedCard article={articles[0]} inView={inView} index={0} />
            <div className="flex flex-col gap-5 sm:gap-8">
              <SupportingCard
                article={articles[1]}
                inView={inView}
                index={1}
              />
              <SupportingCard
                article={articles[2]}
                inView={inView}
                index={2}
              />
            </div>
          </div>
        )}

        {/* CTA */}
        {articles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.8 }}
            className="mt-12 text-center"
          >
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl border border-[var(--color-accent)]/30 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10 hover:border-[var(--color-accent)]/50 transition-all duration-300 font-medium text-sm group"
            >
              Explorar todos os artigos
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  );
}
