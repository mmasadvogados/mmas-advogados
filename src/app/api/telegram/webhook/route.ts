import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { webhookCallback } = await import("grammy");
    const { bot } = await import("@/lib/telegram");
    const handler = webhookCallback(bot, "std/http");
    return await handler(request);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : "";
    console.error("Telegram webhook error:", message, stack);
    return NextResponse.json({ error: "Internal error", detail: message }, { status: 500 });
  }
}
