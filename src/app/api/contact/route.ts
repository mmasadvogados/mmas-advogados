import { NextResponse } from "next/server";
import { contactSchema } from "@/lib/validators";
import { resend } from "@/lib/resend";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = contactSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { name, email, phone, subject, message } = parsed.data;

  try {
    await resend.emails.send({
      from: "MMAS Site <onboarding@resend.dev>",
      to: "escritorio@mmasadvogados.adv.br",
      replyTo: email,
      subject: `[Site] ${subject} - ${name}`,
      html: `
        <h2>Nova mensagem do site</h2>
        <p><strong>Nome:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        ${phone ? `<p><strong>Telefone:</strong> ${phone}</p>` : ""}
        <p><strong>Assunto:</strong> ${subject}</p>
        <hr />
        <p>${message.replace(/\n/g, "<br>")}</p>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Contact form error:", err);
    return NextResponse.json(
      { error: "Falha ao enviar mensagem" },
      { status: 500 }
    );
  }
}
