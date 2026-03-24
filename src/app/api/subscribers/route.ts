import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { subscribers } from "@/lib/db/schema";
import { subscribeSchema } from "@/lib/validators";
import { sendConfirmationEmail } from "@/lib/resend";
import { desc, eq } from "drizzle-orm";
import crypto from "crypto";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allSubs = await db
    .select()
    .from(subscribers)
    .orderBy(desc(subscribers.subscribedAt));

  return NextResponse.json(allSubs);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = subscribeSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Email inválido" }, { status: 400 });
  }

  const existing = await db.query.subscribers.findFirst({
    where: eq(subscribers.email, parsed.data.email),
  });

  if (existing) {
    if (existing.confirmed && !existing.unsubscribedAt) {
      return NextResponse.json({ message: "Já inscrito" });
    }
    if (existing.unsubscribedAt) {
      await db
        .update(subscribers)
        .set({ unsubscribedAt: null, confirmed: false, confirmationToken: crypto.randomUUID() })
        .where(eq(subscribers.id, existing.id));
    }
    return NextResponse.json({ message: "Verifique seu email" });
  }

  const token = crypto.randomUUID();

  await db.insert(subscribers).values({
    email: parsed.data.email,
    name: parsed.data.name || null,
    confirmationToken: token,
  });

  await sendConfirmationEmail(parsed.data.email, token);

  return NextResponse.json({ message: "Verifique seu email para confirmar" }, { status: 201 });
}
