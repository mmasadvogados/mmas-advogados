import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { WhatsAppFAB } from "@/components/layout/whatsapp-fab";
import { CheckCircle } from "lucide-react";

export default function NewsletterConfirmadoPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-[var(--color-background)] pt-28 pb-16 flex items-center justify-center">
        <div className="mx-auto max-w-md px-6 text-center">
          <Image
            src="/images/logo-scales.svg"
            alt="MMAS Advogados"
            width={60}
            height={66}
            className="mx-auto mb-6"
          />
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-6" />
          <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-[var(--color-foreground)] mb-4">
            Inscrição confirmada com sucesso!
          </h1>
          <p className="text-[var(--color-foreground-muted)] mb-8">
            Obrigado por se inscrever na nossa newsletter. Você receberá nossos
            artigos jurídicos diretamente no seu email.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/blog"
              className="px-6 py-3 rounded-lg bg-[var(--color-accent)] text-[var(--color-primary)] font-semibold hover:bg-[var(--color-accent-light)] transition-colors"
            >
              Ver Artigos
            </Link>
            <Link
              href="/"
              className="px-6 py-3 rounded-lg border border-[var(--color-border)] text-[var(--color-foreground-muted)] hover:text-[var(--color-foreground)] hover:bg-white/5 transition-colors"
            >
              Voltar ao Site
            </Link>
          </div>
        </div>
      </main>
      <Footer />
      <WhatsAppFAB />
    </>
  );
}
