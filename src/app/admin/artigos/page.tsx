"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Article } from "@/types";
import { Eye, FileText, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const statusColors: Record<string, string> = {
  draft: "bg-yellow-500/10 text-yellow-400",
  review: "bg-blue-500/10 text-blue-400",
  published: "bg-green-500/10 text-green-400",
  rejected: "bg-red-500/10 text-red-400",
};

const statusLabels: Record<string, string> = {
  draft: "Rascunho",
  review: "Revisao",
  published: "Publicado",
  rejected: "Rejeitado",
};

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const res = await fetch("/api/articles");
      if (res.ok && !cancelled) {
        const data = await res.json();
        setArticles(data);
      }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const fetchArticles = async () => {
    const res = await fetch("/api/articles");
    if (res.ok) {
      const data = await res.json();
      setArticles(data);
    }
  };

  const deleteArticle = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este artigo?")) return;
    await fetch(`/api/articles/${id}`, { method: "DELETE" });
    setArticles((prev) => prev.filter((a) => a.id !== id));
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const deleteSelected = async () => {
    if (selected.size === 0) return;
    if (
      !confirm(
        `Tem certeza que deseja excluir ${selected.size} artigo(s)? Esta acao nao pode ser desfeita.`
      )
    )
      return;

    setDeleting(true);
    try {
      await Promise.all(
        Array.from(selected).map((id) =>
          fetch(`/api/articles/${id}`, { method: "DELETE" })
        )
      );
      setArticles((prev) => prev.filter((a) => !selected.has(a.id)));
      setSelected(new Set());
    } finally {
      setDeleting(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/articles/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchArticles();
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === articles.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(articles.map((a) => a.id)));
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-[var(--color-foreground)]">
            Artigos
          </h1>
          <p className="text-sm text-[var(--color-foreground-muted)] mt-1">
            Gerencie os artigos do blog
          </p>
        </div>
        <div className="flex items-center gap-3">
          {selected.size > 0 && (
            <Button
              onClick={deleteSelected}
              disabled={deleting}
              className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20"
            >
              <Trash2 className="w-4 h-4" />
              {deleting
                ? "Excluindo..."
                : `Excluir ${selected.size} selecionado(s)`}
            </Button>
          )}
          <Link href="/admin/artigos/gerar">
            <Button>
              <Sparkles className="w-4 h-4" />
              Gerar Novo
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="text-[var(--color-foreground-muted)]">
          Carregando...
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="w-12 h-12 mx-auto text-[var(--color-foreground-muted)]/30 mb-4" />
          <p className="text-[var(--color-foreground-muted)]">
            Nenhum artigo criado ainda
          </p>
          <Link href="/admin/artigos/gerar" className="mt-4 inline-block">
            <Button>Gerar Primeiro Artigo</Button>
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--color-border)] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-[var(--color-surface)] border-b border-[var(--color-border)]">
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={
                      articles.length > 0 &&
                      selected.size === articles.length
                    }
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-[var(--color-border)] accent-[var(--color-accent)] cursor-pointer"
                  />
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-[var(--color-foreground-muted)] uppercase">
                  Titulo
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-[var(--color-foreground-muted)] uppercase">
                  Status
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-[var(--color-foreground-muted)] uppercase">
                  Origem
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-[var(--color-foreground-muted)] uppercase">
                  Data
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-[var(--color-foreground-muted)] uppercase">
                  Acoes
                </th>
              </tr>
            </thead>
            <tbody>
              {articles.map((article) => (
                <tr
                  key={article.id}
                  className={`border-b border-[var(--color-border)] hover:bg-white/[0.02] ${
                    selected.has(article.id) ? "bg-[var(--color-accent)]/5" : ""
                  }`}
                >
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selected.has(article.id)}
                      onChange={() => toggleSelect(article.id)}
                      className="w-4 h-4 rounded border-[var(--color-border)] accent-[var(--color-accent)] cursor-pointer"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-[var(--color-foreground)] truncate max-w-xs">
                      {article.title}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 text-xs rounded-full ${statusColors[article.status]}`}
                    >
                      {statusLabels[article.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-[var(--color-foreground-muted)]">
                      {article.source === "telegram" ? "Telegram" : "Web"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-[var(--color-foreground-muted)]">
                    {new Date(article.createdAt).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/artigos/preview/${article.slug}`}
                        target="_blank"
                        className="p-1.5 rounded text-[var(--color-foreground-muted)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10"
                        title="Ver artigo"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      {article.status === "draft" && (
                        <button
                          onClick={() =>
                            updateStatus(article.id, "published")
                          }
                          className="text-xs px-3 py-1 rounded bg-green-500/10 text-green-400 hover:bg-green-500/20"
                        >
                          Publicar
                        </button>
                      )}
                      {article.status === "published" && (
                        <button
                          onClick={() => updateStatus(article.id, "draft")}
                          className="text-xs px-3 py-1 rounded bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20"
                        >
                          Despublicar
                        </button>
                      )}
                      <button
                        onClick={() => deleteArticle(article.id)}
                        className="p-1.5 rounded text-[var(--color-foreground-muted)] hover:text-[var(--color-error)] hover:bg-[var(--color-error)]/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
