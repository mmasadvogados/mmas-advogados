"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Mail, Send } from "lucide-react";
import type { Article } from "@/types";

export default function NewsletterPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [sending, setSending] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/articles")
      .then((r) => r.json())
      .then((data: Article[]) =>
        setArticles(data.filter((a) => a.status === "published"))
      );
  }, []);

  const sendNewsletter = async (articleId: string) => {
    setSending(articleId);
    setResult(null);
    try {
      const res = await fetch("/api/newsletter/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId }),
      });
      const data = await res.json();
      setResult(`Enviado para ${data.totalSent} assinantes${data.totalError ? ` (${data.totalError} erros)` : ""}`);
    } catch {
      setResult("Erro ao enviar newsletter");
    } finally {
      setSending(null);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-[var(--color-foreground)]">
          Newsletter
        </h1>
        <p className="text-sm text-[var(--color-foreground-muted)] mt-1">
          Envie artigos publicados para os assinantes
        </p>
      </div>

      {result && (
        <div className="p-4 rounded-lg bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 text-[var(--color-accent)]">
          {result}
        </div>
      )}

      {articles.length === 0 ? (
        <div className="text-center py-16">
          <Mail className="w-12 h-12 mx-auto text-[var(--color-foreground-muted)]/30 mb-4" />
          <p className="text-[var(--color-foreground-muted)]">
            Publique um artigo para poder enviar na newsletter
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {articles.map((article) => (
            <div
              key={article.id}
              className="flex items-center justify-between p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]"
            >
              <div>
                <h3 className="font-medium text-[var(--color-foreground)]">
                  {article.title}
                </h3>
                <p className="text-sm text-[var(--color-foreground-muted)]">
                  Publicado em{" "}
                  {article.publishedAt
                    ? new Date(article.publishedAt).toLocaleDateString("pt-BR")
                    : "—"}
                </p>
              </div>
              <Button
                size="sm"
                loading={sending === article.id}
                onClick={() => sendNewsletter(article.id)}
              >
                <Send className="w-4 h-4" />
                Enviar
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
