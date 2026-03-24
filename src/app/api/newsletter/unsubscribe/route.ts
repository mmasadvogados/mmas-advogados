import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subscribers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.redirect(new URL("/?error=invalid", request.url));
  }

  await db
    .update(subscribers)
    .set({ unsubscribedAt: new Date() })
    .where(eq(subscribers.email, email));

  return NextResponse.redirect(
    new URL("/?newsletter=unsubscribed", request.url)
  );
}
