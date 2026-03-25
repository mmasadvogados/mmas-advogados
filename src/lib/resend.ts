import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

const logoUrl = `${process.env.NEXT_PUBLIC_APP_URL}/images/logo-scales.svg`;
const emailLogo = `<img src="${logoUrl}" alt="MMAS Advogados" width="40" height="44" style="display: block;" />`;

export async function sendNewsletter(
  to: string[],
  subject: string,
  articleTitle: string,
  articleSummary: string,
  articleUrl: string
) {
  const batches = [];
  for (let i = 0; i < to.length; i += 50) {
    batches.push(to.slice(i, i + 50));
  }

  let totalSent = 0;
  let totalError = 0;

  for (const batch of batches) {
    try {
      await resend.batch.send(
        batch.map((email) => ({
          from: "MMAS Advogados <onboarding@resend.dev>",
          to: email,
          subject,
          html: getNewsletterHtml(articleTitle, articleSummary, articleUrl, email),
        }))
      );
      totalSent += batch.length;
    } catch (err) {
      console.error("Newsletter batch failed:", err);
      totalError += batch.length;
    }
  }

  return { totalSent, totalError };
}

export async function sendConfirmationEmail(to: string, token: string) {
  const confirmUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/newsletter/confirm?token=${token}`;

  await resend.emails.send({
    from: "MMAS Advogados <onboarding@resend.dev>",
    to,
    subject: "Confirme sua inscrição na newsletter",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1A1A1A; color: #FAFAFA; padding: 40px;">
        ${emailLogo}
        <h1 style="color: #C8A03B; font-size: 24px; margin-top: 16px;">MMAS Advogados</h1>
        <p>Obrigado por se inscrever em nossa newsletter!</p>
        <p>Clique no botão abaixo para confirmar sua inscrição:</p>
        <a href="${confirmUrl}" style="display: inline-block; background: #C8A03B; color: #1A1A1A; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 20px 0;">
          Confirmar Inscrição
        </a>
        <p style="color: #888; font-size: 12px; margin-top: 40px;">
          Se você não solicitou esta inscrição, ignore este email.
        </p>
      </div>
    `,
  });
}

function getNewsletterHtml(
  title: string,
  summary: string,
  url: string,
  _email: string
): string {
  const unsubUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/newsletter/unsubscribe?email=${encodeURIComponent(_email)}`;

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1A1A1A; color: #FAFAFA; padding: 40px;">
      <div style="border-bottom: 2px solid #C8A03B; padding-bottom: 20px; margin-bottom: 30px;">
        ${emailLogo}
        <h1 style="color: #C8A03B; font-size: 20px; margin: 12px 0 0;">MMAS Advogados</h1>
        <p style="color: #888; font-size: 12px; margin: 5px 0 0;">Newsletter Jurídica</p>
      </div>
      <h2 style="color: #FAFAFA; font-size: 22px; line-height: 1.3;">${title}</h2>
      <p style="color: #AAAAAA; line-height: 1.6;">${summary}</p>
      <a href="${url}" style="display: inline-block; background: #C8A03B; color: #1A1A1A; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 20px 0;">
        Ler Artigo Completo
      </a>
      <div style="border-top: 1px solid #333; margin-top: 40px; padding-top: 20px;">
        <p style="color: #666; font-size: 11px;">
          Márcio Marano & André Silva Advogados Associados<br/>
          Rua Silvio Romero, 500 - Centro, Frutal-MG<br/>
          (34) 3423-3063
        </p>
        <a href="${unsubUrl}" style="color: #666; font-size: 11px;">Cancelar inscrição</a>
      </div>
    </div>
  `;
}
