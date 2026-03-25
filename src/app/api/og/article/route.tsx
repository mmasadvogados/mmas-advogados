import { ImageResponse } from "@vercel/og";
import { type NextRequest } from "next/server";

export const runtime = "edge";

// Ícones por área de atuação
const AREA_ICONS: Record<string, string> = {
  "Internet": "🌐",
  "Civil": "⚖️",
  "Empresarial": "🏢",
  "Tributário": "📊",
  "Agrário e Ambiental": "🌿",
  "Cooperativas": "🤝",
  "Administrativo": "🏛️",
  "Trabalho": "👷",
  "Previdenciário": "🛡️",
  "Direito Médico e Hospitalar": "🏥",
  "Direito Eleitoral": "🗳️",
};

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const title = searchParams.get("title") || "Artigo Jurídico";
  const area = searchParams.get("area") || "";
  const icon = AREA_ICONS[area] || "⚖️";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          padding: "60px 80px",
          background: "linear-gradient(135deg, #1A1A1A 0%, #2D2D2D 50%, #1A1A1A 100%)",
          fontFamily: "sans-serif",
        }}
      >
        {/* Gold accent line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "6px",
            background: "linear-gradient(90deg, #C8A03B, #E8C547, #C8A03B)",
          }}
        />

        {/* Area badge */}
        {area && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "24px",
              padding: "8px 20px",
              borderRadius: "24px",
              background: "rgba(200, 160, 59, 0.15)",
              border: "1px solid rgba(200, 160, 59, 0.3)",
            }}
          >
            <span style={{ fontSize: "24px" }}>{icon}</span>
            <span style={{ color: "#E8C547", fontSize: "20px", fontWeight: 600 }}>
              {area}
            </span>
          </div>
        )}

        {/* Title */}
        <div
          style={{
            fontSize: title.length > 60 ? "36px" : "44px",
            fontWeight: 700,
            color: "#FFFFFF",
            lineHeight: 1.3,
            maxWidth: "860px",
            display: "flex",
          }}
        >
          {title}
        </div>

        {/* Bottom bar */}
        <div
          style={{
            position: "absolute",
            bottom: "40px",
            left: "80px",
            right: "80px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 200 220"
              fill="none"
              width="44"
              height="48"
            >
              <rect x="96" y="80" width="8" height="120" fill="#C9A227" rx="2"/>
              <rect x="70" y="195" width="60" height="6" fill="#C9A227" rx="3"/>
              <rect x="30" y="75" width="140" height="5" fill="#C9A227" rx="2.5"/>
              <circle cx="100" cy="72" r="12" stroke="#C9A227" strokeWidth="3" fill="none"/>
              <circle cx="100" cy="72" r="4" fill="#C9A227"/>
              <line x1="45" y1="80" x2="45" y2="110" stroke="#C9A227" strokeWidth="2"/>
              <line x1="30" y1="110" x2="45" y2="120" stroke="#C9A227" strokeWidth="1.5"/>
              <line x1="60" y1="110" x2="45" y2="120" stroke="#C9A227" strokeWidth="1.5"/>
              <path d="M25 110 Q45 125 65 110" stroke="#C9A227" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
              <line x1="155" y1="80" x2="155" y2="100" stroke="#C9A227" strokeWidth="2"/>
              <line x1="140" y1="100" x2="155" y2="110" stroke="#C9A227" strokeWidth="1.5"/>
              <line x1="170" y1="100" x2="155" y2="110" stroke="#C9A227" strokeWidth="1.5"/>
              <path d="M135 100 Q155 115 175 100" stroke="#C9A227" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
            </svg>
            <span style={{ color: "#C8A03B", fontSize: "18px", fontWeight: 600 }}>
              MMAS Advogados
            </span>
          </div>
          <span style={{ color: "#666666", fontSize: "16px" }}>
            mmasadvogados.adv.br
          </span>
        </div>
      </div>
    ),
    {
      width: 1024,
      height: 512,
    }
  );
}
