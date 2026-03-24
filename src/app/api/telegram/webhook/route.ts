import { NextResponse } from "next/server";
import { webhookCallback } from "grammy";
import { bot } from "@/lib/telegram";

const handler = webhookCallback(bot, "std/http");

export async function POST(request: Request) {
  // Validate webhook secret
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret");

  if (secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    return await handler(request);
  } catch (err) {
    console.error("Telegram webhook error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
