"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import type { Article } from "@/types";
import { ArrowLeft, Save, Check, Eye, Pencil } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function EditArticlePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(true);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [summary, setSummary] = useState("");
  const [tags, setTags] = useState("");
  const [seoDescription, setSeoDescription] = useState("");

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/articles/${id}`);
      if (!res.ok) {
        router.push("/admin/artigos");
        return;
      }
      const data: Article = await res.json();
      setArticle(data);
      setTitle(data.title);
      setBody(data.body);
      setSummary(data.summary || "");
      setTags(data.tags?.join(", ") || "");
      setSeoDescription(data.seoDescription || "");
      setLoading(false);
    }
    load();
  }, [id, router]);

  const save = async (publish?: boolean) => {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        title,
        body,
        summary: summary || null,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        seoDescription: seoDescription || null,
      };
      if (publish && article?.status !== "published") {
        payload.status = "published";
      }
      const res = await fetch(`/api/articles/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed");
      router.push("/admin/artigos");
    } catch {
      alert("Falha ao salvar artigo.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-[var(--color-foreground-muted)]">Carregando...</div>
    );
  }

  if (!article) return null;

  return (
    <div className="max-w-4xl space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin/artigos"
            className="inline-flex items-center gap-2 text-sm text-[var(--color-foreground-muted)] hover:text-[var(--color-accent)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar aos Artigos
          </Link>
          <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-[var(--color-foreground)] mt-2">
            Editar Artigo
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-[var(--color-foreground-muted)]">
              Origem: {article.source === "telegram" ? "Telegram" : "Web"}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
              {article.status}
            </span>
          </div>
        </div>
        <Button variant="ghost" onClick={() => setEditMode(!editMode)}>
          {editMode ? (
            <>
              <Eye className="w-4 h-4" />
              Preview
            </>
          ) : (
            <>
              <Pencil className="w-4 h-4" />
              Editar
            </>
          )}
        </Button>
      </div>

      {/* Content */}
      <div className="p-6 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
        {editMode ? (
          <div className="space-y-4">
            <Input
              label="Titulo"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Textarea
              label="Corpo (Markdown)"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="min-h-[400px] font-mono text-sm"
            />
            <Textarea
              label="Resumo"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="min-h-[80px]"
            />
            <Input
              label="Tags (separadas por virgula)"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
            <Textarea
              label="SEO Description"
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
        ) : (
          <>
            <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-[var(--color-foreground)]">
              {title}
            </h2>
            {tags && (
              <div className="flex flex-wrap gap-2 mt-3">
                {tags
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean)
                  .map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 text-xs rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                    >
                      {tag}
                    </span>
                  ))}
              </div>
            )}
            <div className="mt-6 prose prose-invert prose-gold max-w-none text-[var(--color-foreground-muted)] leading-relaxed [&_h2]:font-[family-name:var(--font-heading)] [&_h2]:text-[var(--color-foreground)] [&_h2]:text-2xl [&_h2]:mt-10 [&_h2]:mb-4 [&_h3]:text-[var(--color-foreground)] [&_h3]:text-xl [&_h3]:mt-8 [&_h3]:mb-3 [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:mb-2 [&_strong]:text-[var(--color-foreground)] [&_strong]:font-semibold [&_a]:text-[var(--color-accent)] [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-[var(--color-accent)] [&_blockquote]:pl-4 [&_blockquote]:italic [&_img]:w-full [&_img]:rounded-2xl [&_img]:shadow-lg [&_img]:mb-8">
              <ReactMarkdown
                components={{
                  img: ({ src, alt, ...props }) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={src}
                      alt={alt || ""}
                      loading="lazy"
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.style.display = "none";
                      }}
                      {...props}
                    />
                  ),
                }}
              >
                {body}
              </ReactMarkdown>
            </div>
            {summary && (
              <div className="mt-6 p-4 rounded-lg bg-[var(--color-accent)]/5 border border-[var(--color-accent)]/20">
                <p className="text-sm font-medium text-[var(--color-accent)]">
                  Resumo
                </p>
                <p className="text-sm text-[var(--color-foreground-muted)] mt-1">
                  {summary}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => save(false)} loading={saving}>
          <Save className="w-4 h-4" />
          Salvar
        </Button>
        {article.status !== "published" && (
          <Button
            variant="secondary"
            onClick={() => save(true)}
            loading={saving}
          >
            <Check className="w-4 h-4" />
            Salvar e Publicar
          </Button>
        )}
        <Link href="/admin/artigos">
          <Button variant="ghost">Cancelar</Button>
        </Link>
      </div>
    </div>
  );
}
