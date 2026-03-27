"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Article } from "@/types";
import { Eye, FileText, Search, Sparkles, Trash2, Share2 } from "lucide-react";
import { CopyInstagramButton } from "@/components/ui/copy-instagram-button";
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
  const [search, setSearch] = useState("");

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
    // Auto-refresh every 10s to catch Telegram-published articles
    const interval = setInterval(() => {
      if (!cancelled) load();
    }, 10_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
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

  const buildShareText = (article: Article, includeLink = true) => {
    const summary = (article.summary || article.body?.substring(0, 120) || "").trim().substring(0, 120);
    const blogUrl = `${window.location.origin}/blog/${article.slug}`;
    if (includeLink) {
      return `\u2696\ufe0f ${article.title}\n\n${summary}...\n\n\ud83d\udc49 Leia na integra: ${blogUrl}\n\nMMAS Advogados | Assessoria Juridica`;
    }
    return `\u2696\ufe0f ${article.title}\n\n${summary}...\n\nMMAS Advogados | Assessoria Juridica`;
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
    if (selected.size === filteredArticles.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filteredArticles.map((a) => a.id)));
    }
  };

  const publishedCount = articles.filter((a) => a.status === "published").length;
  const filteredArticles = articles.filter((a) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      a.title.toLowerCase().includes(term) ||
      a.tags?.some((t) => t.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-[var(--color-foreground)]">
            Artigos
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-sm text-[var(--color-foreground-muted)]">
              Gerencie os artigos do blog
            </p>
            {!loading && (
              <span className="px-2.5 py-0.5 text-xs rounded-full bg-green-500/10 text-green-400">
                {publishedCount} publicado{publishedCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-foreground-muted)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar artigos..."
              className="pl-9 pr-3 py-2 text-sm rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-foreground)] placeholder:text-[var(--color-foreground-muted)]/50 focus:outline-none focus:border-[var(--color-accent)]/50 w-48"
            />
          </div>
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
      ) : filteredArticles.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="w-12 h-12 mx-auto text-[var(--color-foreground-muted)]/30 mb-4" />
          <p className="text-[var(--color-foreground-muted)]">
            {search.trim() ? "Nenhum artigo encontrado" : "Nenhum artigo criado ainda"}
          </p>
          {!search.trim() && (
            <Link href="/admin/artigos/gerar" className="mt-4 inline-block">
              <Button>Gerar Primeiro Artigo</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--color-border)] overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="bg-[var(--color-surface)] border-b border-[var(--color-border)]">
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={
                      filteredArticles.length > 0 &&
                      selected.size === filteredArticles.length
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
              {filteredArticles.map((article) => (
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
                    <p className="text-sm font-medium text-[var(--color-foreground)] truncate max-w-md">
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
                    <div className="flex items-center justify-end gap-2 whitespace-nowrap">
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
                        <>
                          <button
                            onClick={() => updateStatus(article.id, "draft")}
                            className="text-xs px-3 py-1 rounded bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20"
                          >
                            Despublicar
                          </button>
                          <a
                            href={`https://api.whatsapp.com/send?text=${encodeURIComponent(buildShareText(article))}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs px-3 py-1 rounded bg-green-500/10 text-green-400 hover:bg-green-500/20"
                            title="Compartilhar no WhatsApp"
                          >
                            <Share2 className="w-3 h-3 inline mr-1" />
                            WhatsApp
                          </a>
                          <CopyInstagramButton
                            text={buildShareText(article, false)}
                            className="text-xs px-3 py-1 rounded bg-pink-500/10 text-pink-400 hover:bg-pink-500/20"
                          />
                        </>
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
