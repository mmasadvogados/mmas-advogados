"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { PRACTICE_AREAS } from "@/types";
import type { GeneratedArticle } from "@/types";
import { Sparkles, Check, RotateCcw, Save, X } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function GenerateArticlePage() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [area, setArea] = useState("");
  const [loading, setLoading] = useState(false);
  const [article, setArticle] = useState<GeneratedArticle | null>(null);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");

  const generate = async () => {
    setLoading(true);
    setArticle(null);
    try {
      const res = await fetch("/api/llm/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, area: area || undefined }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setArticle(data);
      setEditTitle(data.title);
      setEditBody(data.body);
    } catch {
      alert("Falha ao gerar artigo. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const saveArticle = async (status: "draft" | "published") => {
    if (!article) return;
    setSaving(true);
    try {
      const res = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editMode ? editTitle : article.title,
          body: editMode ? editBody : article.body,
          summary: article.summary,
          tags: article.tags,
          seoDescription: article.seoDescription,
          status,
          source: "web",
        }),
      });
      if (!res.ok) throw new Error("Failed");
      router.push("/admin/artigos");
    } catch {
      alert("Falha ao salvar artigo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-[var(--color-foreground)]">
          Gerar Artigo com IA
        </h1>
        <p className="text-sm text-[var(--color-foreground-muted)] mt-1">
          Informe o tema e a IA criará um artigo jurídico completo
        </p>
      </div>

      {/* Input */}
      {!article && (
        <div className="space-y-4 p-6 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
          <Input
            label="Tema do Artigo"
            placeholder="Ex: Holding Familiar e Planejamento Sucessório"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[var(--color-foreground-muted)]">
              Área de Atuação (opcional)
            </label>
            <select
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-foreground)] focus:border-[var(--color-accent)] focus:outline-none"
            >
              <option value="">Todas as áreas</option>
              {PRACTICE_AREAS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          <Button
            onClick={generate}
            loading={loading}
            disabled={!topic.trim()}
            className="w-full sm:w-auto"
          >
            <Sparkles className="w-4 h-4" />
            {loading ? "Gerando artigo..." : "Gerar Artigo"}
          </Button>
        </div>
      )}

      {/* Preview */}
      {article && (
        <div className="space-y-6">
          <div className="p-6 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
            {editMode ? (
              <div className="space-y-4">
                <Input
                  label="Título"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
                <Textarea
                  label="Corpo (Markdown)"
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  className="min-h-[400px] font-mono text-sm"
                />
              </div>
            ) : (
              <>
                <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-[var(--color-foreground)]">
                  {article.title}
                </h2>
                <div className="flex flex-wrap gap-2 mt-3">
                  {article.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 text-xs rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
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
                    {article.body}
                  </ReactMarkdown>
                </div>
              </>
            )}
          </div>

          {/* Summary */}
          <div className="p-4 rounded-lg bg-[var(--color-accent)]/5 border border-[var(--color-accent)]/20">
            <p className="text-sm font-medium text-[var(--color-accent)]">
              Resumo para Newsletter
            </p>
            <p className="text-sm text-[var(--color-foreground-muted)] mt-1">
              {article.summary}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => saveArticle("published")} loading={saving}>
              <Check className="w-4 h-4" />
              Aprovar e Publicar
            </Button>
            <Button
              variant="secondary"
              onClick={() => saveArticle("draft")}
              loading={saving}
            >
              <Save className="w-4 h-4" />
              Salvar Rascunho
            </Button>
            <Button
              variant="ghost"
              onClick={() => setEditMode(!editMode)}
            >
              {editMode ? "Ver Preview" : "Editar"}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setArticle(null);
                generate();
              }}
            >
              <RotateCcw className="w-4 h-4" />
              Regenerar
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setArticle(null);
                setTopic("");
              }}
            >
              <X className="w-4 h-4" />
              Descartar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
