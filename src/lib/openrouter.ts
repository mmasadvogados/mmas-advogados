import type { GeneratedArticle, GenerateArticleOptions } from "@/types";
import { getArticleSystemPrompt } from "@/prompts/article-system-prompt";

/**
 * Gera URL da imagem de capa do artigo via Vercel OG.
 * Usa path relativo para funcionar em qualquer ambiente (dev, preview, prod).
 */
function generateArticleImageUrl(title: string, area?: string): string {
  const params = new URLSearchParams({ title });
  if (area) params.set("area", area);
  return `/api/og/article?${params.toString()}`;
}

// OpenRouter as primary (better models for long-form legal content)
// Groq as fallback (free, fast but lower quality)
const LLM_PROVIDERS = [
  {
    name: "openrouter",
    url: "https://openrouter.ai/api/v1/chat/completions",
    model: "google/gemini-2.0-flash-001",
    apiKeyEnv: "OPENROUTER_API_KEY",
  },
  {
    name: "groq",
    url: "https://api.groq.com/openai/v1/chat/completions",
    model: "llama-3.3-70b-versatile",
    apiKeyEnv: "GROQ_API_KEY",
  },
];

export async function generateArticle(
  options: GenerateArticleOptions
): Promise<GeneratedArticle> {
  const systemPrompt = getArticleSystemPrompt(options);

  const userPrompt = `Escreva um artigo jurídico COMPLETO e APROFUNDADO sobre: "${options.topic}"${
    options.area ? ` (área: ${options.area})` : ""
  }.

REQUISITOS OBRIGATÓRIOS:
- Mínimo 6 seções com ## (Introdução, Fundamentação Legal, Jurisprudência, Análise Prática, Orientação ao Leitor, Conclusão)
- Cada seção deve ter no MÍNIMO 2-3 parágrafos completos
- Cite pelo menos 3 referências legais reais (artigos de lei, súmulas, entendimentos)
- Inclua exemplos práticos de situações reais
- O artigo deve ter entre 1500-2500 palavras

Responda SOMENTE com JSON válido:
{
  "title": "Título claro e informativo",
  "body": "Artigo COMPLETO em Markdown (sem o título). DEVE ter todas as seções obrigatórias com profundidade.",
  "summary": "Resumo de 2-3 frases para newsletter",
  "tags": ["tag1", "tag2", "tag3"],
  "seoDescription": "Meta description para SEO (máximo 160 caracteres)"
}`;

  let lastError: Error | null = null;

  for (const provider of LLM_PROVIDERS) {
    const apiKey = process.env[provider.apiKeyEnv];
    if (!apiKey) continue;

    try {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      };

      if (provider.name === "openrouter") {
        headers["HTTP-Referer"] = process.env.NEXT_PUBLIC_APP_URL || "";
        headers["X-Title"] = "MMAS Advogados";
      }

      const response = await fetch(provider.url, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: provider.model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.5,
          max_tokens: 8000,
        }),
        signal: AbortSignal.timeout(90000),
      });

      if (!response.ok) {
        throw new Error(
          `${provider.name} ${response.status}: ${await response.text()}`
        );
      }

      const data = await response.json();
      const msg = data.choices?.[0]?.message;
      const content =
        msg?.content || msg?.reasoning || msg?.reasoning_details?.[0]?.text;

      if (!content) throw new Error("Empty response from LLM");

      // Parse JSON from response (handle markdown code blocks and reasoning blocks)
      let jsonStr = content
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
         jsonStr = jsonMatch[0];
      }

      // Fix unescaped newlines/tabs inside JSON string values
      // (very common mistake for LLMs generating markdown within JSON)
      jsonStr = jsonStr.replace(/"([^"\\]*(?:\\.[^"\\]*)*)"/g, (match: string) => {
        return match.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t');
      });

      const article = JSON.parse(jsonStr) as GeneratedArticle;

      if (!article.title || !article.body) {
        throw new Error("Missing required fields in LLM response");
      }

      // Generate contextual article cover image via Vercel OG
      const imageUrl = generateArticleImageUrl(article.title, options.area);
      article.body = `![${article.title}](${imageUrl})\n\n${article.body}`;

      return article;
    } catch (err) {
      lastError = err as Error;
      console.error(`Provider ${provider.name} failed:`, err);
      continue;
    }
  }

  throw new Error(
    `All providers failed. Last error: ${lastError?.message || "Unknown"}`
  );
}
