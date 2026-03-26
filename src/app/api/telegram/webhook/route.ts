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
    console.error("[WEBHOOK FATAL]", message, stack);
    // ALWAYS return 200 to Telegram to prevent infinite retries
    // The error is logged — returning 500 causes Telegram to retry the same update forever
    return NextResponse.json({ ok: true, error_logged: message });
  }
}
