import type { GeneratedArticle, GenerateArticleOptions } from "@/types";
import { getArticleSystemPrompt } from "@/prompts/article-system-prompt";

// Using Groq as primary LLM (free, fast, reliable content output)
// OpenRouter free models currently return reasoning-only responses
const LLM_PROVIDERS = [
  {
    name: "groq",
    url: "https://api.groq.com/openai/v1/chat/completions",
    model: "llama-3.3-70b-versatile",
    apiKeyEnv: "GROQ_API_KEY",
  },
  {
    name: "openrouter",
    url: "https://openrouter.ai/api/v1/chat/completions",
    model: "openrouter/free",
    apiKeyEnv: "OPENROUTER_API_KEY",
  },
];

export async function generateArticle(
  options: GenerateArticleOptions
): Promise<GeneratedArticle> {
  const systemPrompt = getArticleSystemPrompt(options);

  const userPrompt = `Gere um artigo jurídico completo sobre o tema: "${options.topic}"${
    options.area ? ` na área de ${options.area}` : ""
  }.

Responda SOMENTE com JSON válido no formato:
{
  "title": "Título do artigo",
  "body": "Corpo completo do artigo em Markdown",
  "summary": "Resumo de 2-3 frases para newsletter",
  "tags": ["tag1", "tag2"],
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
          temperature: 0.7,
          max_tokens: 4000,
        }),
        signal: AbortSignal.timeout(55000),
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

      // Parse JSON from response (handle markdown code blocks)
      const jsonStr = content
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      const article = JSON.parse(jsonStr) as GeneratedArticle;

      if (!article.title || !article.body) {
        throw new Error("Missing required fields in LLM response");
      }

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
