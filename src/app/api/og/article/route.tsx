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
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "8px",
                background: "linear-gradient(135deg, #C8A03B, #E8C547)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                fontWeight: 700,
                color: "#1A1A1A",
              }}
            >
              M
            </div>
            <span style={{ color: "#999999", fontSize: "18px" }}>
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
