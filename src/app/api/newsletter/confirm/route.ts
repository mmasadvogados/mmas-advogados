import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subscribers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/?error=invalid-token", request.url));
  }

  const subscriber = await db.query.subscribers.findFirst({
    where: eq(subscribers.confirmationToken, token),
  });

  if (!subscriber) {
    return NextResponse.redirect(new URL("/?error=invalid-token", request.url));
  }

  await db
    .update(subscribers)
    .set({ confirmed: true, confirmationToken: null })
    .where(eq(subscribers.id, subscriber.id));

  return NextResponse.redirect(
    new URL("/newsletter/confirmado", request.url)
  );
}
