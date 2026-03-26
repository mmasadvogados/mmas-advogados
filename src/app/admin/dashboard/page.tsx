import { db } from "@/lib/db";
import { articles, subscribers } from "@/lib/db/schema";
import { eq, count, isNull, and } from "drizzle-orm";
import { FileText, Users, Eye, PenTool } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [publishedCount] = await db
    .select({ count: count() })
    .from(articles)
    .where(eq(articles.status, "published"));

  const [draftCount] = await db
    .select({ count: count() })
    .from(articles)
    .where(eq(articles.status, "draft"));

  const [subscriberCount] = await db
    .select({ count: count() })
    .from(subscribers)
    .where(and(eq(subscribers.confirmed, true), isNull(subscribers.unsubscribedAt)));

  const metrics = [
    {
      label: "Artigos Publicados",
      value: publishedCount?.count || 0,
      icon: FileText,
      color: "text-green-400",
      href: "/admin/artigos",
    },
    {
      label: "Rascunhos",
      value: draftCount?.count || 0,
      icon: PenTool,
      color: "text-yellow-400",
      href: "/admin/artigos",
    },
    {
      label: "Assinantes",
      value: subscriberCount?.count || 0,
      icon: Users,
      color: "text-blue-400",
      href: "/admin/assinantes",
    },
    {
      label: "Visualizações",
      value: "—",
      icon: Eye,
      color: "text-[var(--color-accent)]",
      href: null,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-[var(--color-foreground)]">
          Dashboard
        </h1>
        <p className="text-sm text-[var(--color-foreground-muted)] mt-1">
          Visão geral da plataforma
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => {
          const content = (
            <>
              <div className="flex items-center justify-between">
                <m.icon className={`w-5 h-5 ${m.color}`} />
              </div>
              <p className="mt-4 text-3xl font-bold text-[var(--color-foreground)]">
                {m.value}
              </p>
              <p className="text-sm text-[var(--color-foreground-muted)]">
                {m.label}
              </p>
            </>
          );

          return m.href ? (
            <Link
              key={m.label}
              href={m.href}
              className="p-6 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-accent)]/50 hover:bg-white/[0.02] transition-colors"
            >
              {content}
            </Link>
          ) : (
            <div
              key={m.label}
              className="p-6 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]"
            >
              {content}
            </div>
          );
        })}
      </div>

      {/* Quick actions */}
      <div className="flex gap-4">
        <Link
          href="/admin/artigos/gerar"
          className="px-6 py-3 rounded-lg bg-[var(--color-accent)] text-[var(--color-primary)] font-semibold hover:bg-[var(--color-accent-light)] transition-colors"
        >
          Gerar Novo Artigo
        </Link>
        <Link
          href="/admin/artigos"
          className="px-6 py-3 rounded-lg border border-[var(--color-border)] text-[var(--color-foreground-muted)] hover:text-[var(--color-foreground)] hover:bg-white/5 transition-colors"
        >
          Ver Artigos
        </Link>
      </div>
    </div>
  );
}
