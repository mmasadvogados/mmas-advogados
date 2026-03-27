"""LLM article generation service.

Primary: OpenRouter (google/gemini-2.0-flash-001)
Fallback: Groq (llama-3.3-70b-versatile)

Port of src/lib/openrouter.ts.
"""

import json
import logging
from dataclasses import dataclass
from typing import Optional
from urllib.parse import urlencode

import httpx

from bot.config import settings
from bot.prompts.article_system import get_article_system_prompt

logger = logging.getLogger(__name__)


@dataclass
class GeneratedArticle:
    title: str
    body: str
    summary: str
    tags: list[str]
    seo_description: str


LLM_PROVIDERS = [
    {
        "name": "openrouter",
        "url": "https://openrouter.ai/api/v1/chat/completions",
        "model": "google/gemini-2.0-flash-001",
        "api_key_attr": "OPENROUTER_API_KEY",
    },
    {
        "name": "groq",
        "url": "https://api.groq.com/openai/v1/chat/completions",
        "model": "llama-3.3-70b-versatile",
        "api_key_attr": "GROQ_API_KEY",
    },
]


def _generate_article_image_url(title: str, area: Optional[str] = None) -> str:
    """Generate OG image URL for article cover (relative path)."""
    params = {"title": title}
    if area:
        params["area"] = area
    return f"/api/og/article?{urlencode(params)}"


def _fix_json_newlines(json_str: str) -> str:
    """Fix unescaped newlines inside JSON string values.

    Process character by character to handle nested quotes correctly.
    Exact port of the TypeScript character-by-character fixer.
    """
    fixed = []
    in_string = False
    escaped = False

    for ch in json_str:
        if escaped:
            fixed.append(ch)
            escaped = False
            continue
        if ch == "\\":
            fixed.append(ch)
            escaped = True
            continue
        if ch == '"':
            in_string = not in_string
            fixed.append(ch)
            continue
        if in_string and ch == "\n":
            fixed.append("\\n")
            continue
        if in_string and ch == "\r":
            fixed.append("\\r")
            continue
        if in_string and ch == "\t":
            fixed.append("\\t")
            continue
        fixed.append(ch)

    return "".join(fixed)


async def generate_article(
    topic: str,
    area: Optional[str] = None,
    length: str = "medium",
    tone: str = "technical",
) -> GeneratedArticle:
    """Generate a legal article using LLM providers with fallback.

    Args:
        topic: The article topic.
        area: Detected practice area (optional).
        length: Article length - "short", "medium", or "long".
        tone: Article tone - "technical" or "accessible".

    Returns:
        GeneratedArticle with title, body, summary, tags, seo_description.

    Raises:
        RuntimeError: If all providers fail.
    """
    system_prompt = get_article_system_prompt(topic, area, length, tone)

    area_hint = f" (area: {area})" if area else ""
    user_prompt = (
        f'Escreva um artigo juridico COMPLETO e APROFUNDADO sobre: "{topic}"{area_hint}.\n\n'
        "REQUISITOS OBRIGATORIOS:\n"
        "- Minimo 6 secoes com ## (Introducao, Fundamentacao Legal, Jurisprudencia, Analise Pratica, Orientacao ao Leitor, Conclusao)\n"
        "- Cada secao deve ter no MINIMO 2-3 paragrafos completos\n"
        "- Cite pelo menos 3 referencias legais reais (artigos de lei, sumulas, entendimentos)\n"
        "- Inclua exemplos praticos de situacoes reais\n"
        "- O artigo deve ter entre 1500-2500 palavras\n\n"
        "Responda SOMENTE com JSON valido:\n"
        "{\n"
        '  "title": "Titulo claro e informativo",\n'
        '  "body": "Artigo COMPLETO em Markdown (sem o titulo). DEVE ter todas as secoes obrigatorias com profundidade.",\n'
        '  "summary": "Resumo de 2-3 frases para newsletter",\n'
        '  "tags": ["tag1", "tag2", "tag3"],\n'
        '  "seoDescription": "Meta description para SEO (maximo 160 caracteres)"\n'
        "}"
    )

    last_error: Optional[Exception] = None

    async with httpx.AsyncClient(timeout=httpx.Timeout(90.0)) as client:
        for provider in LLM_PROVIDERS:
            api_key = getattr(settings, provider["api_key_attr"], "")
            if not api_key:
                logger.warning("[LLM] Skipping %s: %s not set", provider["name"], provider["api_key_attr"])
                continue

            logger.info("[LLM] Trying %s (%s)...", provider["name"], provider["model"])

            try:
                headers = {
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                }

                if provider["name"] == "openrouter":
                    headers["HTTP-Referer"] = settings.NEXT_PUBLIC_APP_URL
                    headers["X-Title"] = "MMAS Advogados"

                payload = {
                    "model": provider["model"],
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    "temperature": 0.5,
                    "max_tokens": 8000,
                }

                response = await client.post(provider["url"], headers=headers, json=payload)

                if response.status_code != 200:
                    raise RuntimeError(
                        f"{provider['name']} {response.status_code}: {response.text}"
                    )

                data = response.json()
                msg = data.get("choices", [{}])[0].get("message", {})
                content = (
                    msg.get("content")
                    or msg.get("reasoning")
                    or (msg.get("reasoning_details") or [{}])[0].get("text")
                )

                if not content:
                    raise RuntimeError("Empty response from LLM")

                logger.info("[%s] Response length: %d chars", provider["name"], len(content))

                # Parse JSON from response
                import re

                json_str = re.sub(r"```json\n?", "", content)
                json_str = re.sub(r"```\n?", "", json_str).strip()

                # Extract JSON object
                json_match = re.search(r"\{[\s\S]*\}", json_str)
                if json_match:
                    json_str = json_match.group(0)

                # Try direct parse, then fix newlines
                try:
                    article_data = json.loads(json_str)
                except json.JSONDecodeError:
                    fixed = _fix_json_newlines(json_str)
                    article_data = json.loads(fixed)

                if not article_data.get("title") or not article_data.get("body"):
                    raise RuntimeError("Missing required fields in LLM response")

                # Generate contextual article cover image via Vercel OG
                image_url = _generate_article_image_url(article_data["title"], area)
                article_data["body"] = f"![{article_data['title']}]({image_url})\n\n{article_data['body']}"

                return GeneratedArticle(
                    title=article_data["title"],
                    body=article_data["body"],
                    summary=article_data.get("summary", ""),
                    tags=article_data.get("tags", []),
                    seo_description=article_data.get("seoDescription", ""),
                )

            except Exception as err:
                last_error = err
                logger.error("Provider %s failed: %s", provider["name"], err)
                continue

    raise RuntimeError(
        f"All providers failed. Last error: {last_error or 'Unknown'}"
    )
