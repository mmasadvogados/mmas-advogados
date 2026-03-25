import { NextResponse } from "next/server";
import { webhookCallback } from "grammy";
import { bot } from "@/lib/telegram";

const handler = webhookCallback(bot, "std/http", {
  secretToken: process.env.TELEGRAM_WEBHOOK_SECRET,
});

export async function POST(request: Request) {
  try {
    return await handler(request);
  } catch (err) {
    console.error("Telegram webhook error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
