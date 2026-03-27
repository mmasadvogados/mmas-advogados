"""Casual message detection and practice area detection.

Port of the detection logic from src/lib/telegram.ts.
Same 11 practice areas, same keywords, same casual reply patterns.
"""

import random
import re
from typing import Optional

# ---------------------------------------------------------------------------
# Casual message categories -- same regex patterns and replies as TypeScript
# ---------------------------------------------------------------------------

CASUAL_CATEGORIES: list[dict] = [
    {
        # Greetings
        "patterns": [
            re.compile(r"^(oi|ol[aá]|hey|hello|hi|e a[ií]|eai|fala|salve|opa)\b", re.IGNORECASE),
            re.compile(r"^(bom dia|boa tarde|boa noite)\b", re.IGNORECASE),
        ],
        "replies": [
            "Ola! Tudo bem? Qual tema voce gostaria de transformar em artigo?\n\nVoce pode digitar o tema ou enviar um audio!",
            "Oi! Que bom falar com voce! Sobre qual assunto juridico deseja gerar um artigo?\n\nPode enviar por texto ou audio!",
            "Ola! Estou pronto para ajudar! Me diga o tema do artigo que deseja gerar.\n\nAceito texto ou audio!",
        ],
    },
    {
        # How are you / small talk
        "patterns": [
            re.compile(
                r"^(tudo bem|tudo certo|como vai|beleza|blz|td bem|como voce esta|como vc esta)",
                re.IGNORECASE,
            ),
        ],
        "replies": [
            "Tudo otimo! Pronto para gerar artigos. Qual tema voce tem em mente?\n\nPode enviar por texto ou audio!",
            "Tudo bem sim! Em que posso ajudar? Me envie o tema do artigo por texto ou audio.",
        ],
    },
    {
        # Thanks
        "patterns": [
            re.compile(r"^(obrigad[oa]|valeu|brigad[oa]|vlw|thanks|tks)\b", re.IGNORECASE),
        ],
        "replies": [
            "De nada! Se precisar de outro artigo, e so enviar o tema por texto ou audio.",
            "Por nada! Estou aqui quando precisar. Envie um tema ou audio para gerar outro artigo.",
        ],
    },
    {
        # Goodbye
        "patterns": [
            re.compile(r"^(tchau|at[eé] mais|at[eé] logo|flw|falou)\b", re.IGNORECASE),
        ],
        "replies": [
            "Ate mais! Quando precisar de um artigo, e so me chamar.",
            "Ate logo! Estarei aqui quando precisar. Envie um tema ou audio a qualquer momento.",
        ],
    },
    {
        # Short affirmatives/negatives (prevent accidental generation)
        "patterns": [
            re.compile(r"^(ok|sim|n[aã]o|s|n|yes|no)\s*[.!?]*$", re.IGNORECASE),
        ],
        "replies": [
            'Se quiser gerar um artigo, envie o tema completo por texto ou audio.\n\nExemplo: "Direitos do consumidor em compras online"',
        ],
    },
]


def get_casual_reply(text: str) -> Optional[str]:
    """Check if text is a casual message and return a friendly reply, or None.

    Same logic as getCasualReply() in telegram.ts.
    """
    trimmed = text.strip()
    if len(trimmed) < 3:
        return (
            'Se quiser gerar um artigo, envie o tema completo por texto ou audio.\n\n'
            'Exemplo: "Direitos do consumidor em compras online"'
        )
    for category in CASUAL_CATEGORIES:
        if any(p.search(trimmed) for p in category["patterns"]):
            return random.choice(category["replies"])
    return None


# ---------------------------------------------------------------------------
# Practice area detection -- same 11 areas with same keywords as TypeScript
# ---------------------------------------------------------------------------

AREA_KEYWORDS: dict[str, list[str]] = {
    "Internet": [
        "internet", "digital", "lgpd", "dados", "cibernetico",
        "online", "rede social", "privacidade", "tecnologia",
    ],
    "Civil": [
        "civil", "contrato", "familia", "heranca",
        "consumidor", "compra", "indenizacao", "dano moral",
        "divorcio", "pensao", "guarda", "inventario",
        "usucapiao",
    ],
    "Empresarial": [
        "empresa", "societario", "falencia",
        "recuperacao judicial", "compliance", "socio", "cnpj",
        "contrato social",
    ],
    "Tributario": [
        "tribut", "imposto", "icms", "issqn", "irpf", "irpj", "fiscal",
        "contribuicao", "simples nacional", "taxa",
    ],
    "Agrario e Ambiental": [
        "agrario", "rural", "ambiental", "terra", "fazenda", "posse",
        "propriedade rural", "desmatamento", "app", "reserva legal", "divisa",
    ],
    "Cooperativas": [
        "cooperativa", "cooperado", "assembleia", "associacao",
    ],
    "Administrativo": [
        "administrativo", "licitacao", "concurso",
        "servidor publico", "improbidade", "pregao",
    ],
    "Trabalho": [
        "trabalho", "trabalhista", "clt", "empregado", "empregador", "demissao",
        "rescisao", "fgts", "ferias",
        "hora extra", "assedio",
    ],
    "Previdenciario": [
        "previdencia", "aposentadoria", "inss", "beneficio",
        "incapacidade", "auxilio", "pensao por morte",
    ],
    "Direito Medico e Hospitalar": [
        "medico", "hospital", "saude", "erro medico",
        "plano de saude", "sus", "anvisa",
    ],
    "Direito Eleitoral": [
        "eleitor", "eleitoral", "candidat", "voto", "urna", "campanha",
        "partido", "propaganda eleitoral",
    ],
}


def detect_area(topic: str) -> Optional[str]:
    """Auto-detect practice area from topic keywords.

    Uses Unicode NFD normalization to strip accents before matching,
    so both accented and unaccented keywords match.
    """
    import unicodedata

    lower = unicodedata.normalize("NFD", topic.lower())
    # Remove combining diacritical marks for accent-insensitive matching
    lower = re.sub(r"[\u0300-\u036f]", "", lower)

    for area, keywords in AREA_KEYWORDS.items():
        for kw in keywords:
            kw_normalized = unicodedata.normalize("NFD", kw.lower())
            kw_normalized = re.sub(r"[\u0300-\u036f]", "", kw_normalized)
            if kw_normalized in lower:
                return area
    return None
