import { NextResponse } from "next/server";
import { contactSchema } from "@/lib/validators";
import { resend, SENDER } from "@/lib/resend";

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
      from: SENDER,
      to: "escritorio@mmasadvogados.adv.br",
      replyTo: email,
      subject: `[Site] ${subject} - ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1A1A1A; color: #FAFAFA; padding: 40px;">
          <img src="${process.env.NEXT_PUBLIC_APP_URL}/images/logo-scales.svg" alt="MMAS Advogados" width="40" height="44" style="display: block;" />
          <h1 style="color: #C8A03B; font-size: 20px; margin-top: 16px;">Novo Contato via Site</h1>
          <table style="width: 100%; margin-top: 20px; border-collapse: collapse;">
            <tr><td style="color: #888; padding: 8px 0;">Nome:</td><td style="color: #FAFAFA; padding: 8px 0;">${name}</td></tr>
            <tr><td style="color: #888; padding: 8px 0;">Email:</td><td style="color: #FAFAFA; padding: 8px 0;">${email}</td></tr>
            ${phone ? `<tr><td style="color: #888; padding: 8px 0;">Telefone:</td><td style="color: #FAFAFA; padding: 8px 0;">${phone}</td></tr>` : ""}
            <tr><td style="color: #888; padding: 8px 0;">Área:</td><td style="color: #FAFAFA; padding: 8px 0;">${subject}</td></tr>
          </table>
          <div style="margin-top: 20px; padding: 20px; background: #222; border-radius: 8px;">
            <p style="color: #888; font-size: 12px; margin: 0 0 8px;">Mensagem:</p>
            <p style="color: #FAFAFA; line-height: 1.6; margin: 0;">${message.replace(/\n/g, "<br>")}</p>
          </div>
        </div>
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
