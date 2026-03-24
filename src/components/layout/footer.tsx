"use client";

import Image from "next/image";
import Link from "next/link";
import { Phone, Mail, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative">
      {/* Pre-footer CTA Bar */}
      <div className="relative py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-accent)]/10 via-[var(--color-accent)]/5 to-[var(--color-accent)]/10" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--color-accent)]/40 to-transparent" />
        <div className="relative z-10 mx-auto max-w-7xl px-6 text-center">
          <p className="font-[family-name:var(--font-accent)] italic text-[var(--color-accent)] text-2xl md:text-3xl mb-6">
            Pronto para uma assessoria jurídica de excelência?
          </p>
          <a
            href="https://wa.me/553434233063"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex px-10 py-4 rounded-xl bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-light)] text-[var(--color-background)] font-semibold hover:shadow-[var(--shadow-glow-gold-strong)] transition-shadow duration-500"
          >
            Agende sua Consulta
          </a>
        </div>
      </div>

      {/* Main Footer */}
      <div className="bg-[var(--color-primary)] border-t border-[var(--color-border)]">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Brand */}
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <Image
                  src="/images/logo-scales.svg"
                  alt="MMAS Advogados"
                  width={32}
                  height={36}
                />
                <div>
                  <span className="font-[family-name:var(--font-accent)] italic text-[var(--color-cream)] text-lg">
                    Márcio Marano
                  </span>
                  <span className="font-[family-name:var(--font-accent)] italic text-[var(--color-accent-muted)] text-xs block -mt-0.5 tracking-[0.15em]">
                    & André Silva Advogados
                  </span>
                </div>
              </div>
              <p className="text-sm text-[var(--color-foreground-muted)] leading-relaxed">
                Assessoria e consultoria jurídica ampla, com mais de 15 anos de
                experiência em 11 áreas do direito.
              </p>
              <a
                href="https://instagram.com/mmasadvogados"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-[var(--color-foreground-muted)] hover:text-[var(--color-accent)] transition-colors"
              >
                @mmasadvogados
              </a>
            </div>

            {/* Contact */}
            <div className="space-y-5">
              <h3 className="text-xs tracking-[var(--tracking-widest)] text-[var(--color-accent)] uppercase">
                Contato
              </h3>
              <div className="space-y-4 text-sm text-[var(--color-foreground-muted)]">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 mt-0.5 text-[var(--color-accent-muted)] shrink-0" />
                  <span>Rua Silvio Romero, 500<br />Centro, Frutal-MG<br />CEP 38200-014</span>
                </div>
                <a href="tel:+553434233063" className="flex items-center gap-3 hover:text-[var(--color-accent)] transition-colors">
                  <Phone className="w-4 h-4 text-[var(--color-accent-muted)]" />
                  (34) 3423-3063
                </a>
                <a href="mailto:escritorio@mmasadvogados.adv.br" className="flex items-center gap-3 hover:text-[var(--color-accent)] transition-colors">
                  <Mail className="w-4 h-4 text-[var(--color-accent-muted)]" />
                  escritorio@mmasadvogados.adv.br
                </a>
              </div>
            </div>

            {/* Newsletter */}
            <div className="space-y-5">
              <h3 className="text-xs tracking-[var(--tracking-widest)] text-[var(--color-accent)] uppercase">
                Newsletter
              </h3>
              <p className="text-sm text-[var(--color-foreground-muted)]">
                Receba artigos jurídicos diretamente no seu email.
              </p>
              <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
                <input
                  type="email"
                  placeholder="Seu email"
                  className="flex-1 bg-transparent border-b border-[var(--color-border)] pb-2 text-sm text-[var(--color-cream)] placeholder:text-[var(--color-foreground-muted)]/40 focus:border-[var(--color-accent)] focus:outline-none transition-colors"
                />
                <button
                  type="submit"
                  className="px-5 py-2 text-sm rounded-lg bg-[var(--color-accent)]/10 text-[var(--color-accent)] border border-[var(--color-accent)]/20 hover:bg-[var(--color-accent)]/20 transition-colors"
                >
                  Assinar
                </button>
              </form>
              <div className="pt-4">
                <Link href="/blog" className="text-sm text-[var(--color-foreground-muted)] hover:text-[var(--color-accent)] transition-colors">
                  Acesse nosso Blog →
                </Link>
              </div>
            </div>
          </div>

          {/* Bottom */}
          <div className="mt-16 pt-8 border-t border-[var(--color-border)] flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-[var(--color-foreground-muted)]">
              &copy; {new Date().getFullYear()}{" "}Márcio Marano &amp; André Silva Advogados Associados S/S
            </p>
            <p className="text-xs text-[var(--color-foreground-muted)]">
              CNPJ: 34.746.829/0001-50
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
