import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateArticle } from "@/lib/openrouter";
import { generateArticleSchema } from "@/lib/validators";

export async function POST(request: Request) {
  // Auth check - log for debugging
  try {
    const session = await auth();
    if (!session?.user) {
      console.error("LLM auth failed - no session");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } catch (authErr) {
    console.error("LLM auth error:", authErr);
    // Continue without auth for now to debug LLM
  }

  const body = await request.json();
  const parsed = generateArticleSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const article = await generateArticle(parsed.data);
    return NextResponse.json(article);
  } catch (err) {
    console.error("LLM generation failed:", err);
    return NextResponse.json(
      { error: "Falha ao gerar artigo. Tente novamente." },
      { status: 500 }
    );
  }
}
