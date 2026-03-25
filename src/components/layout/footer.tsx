"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Phone, Mail, MapPin, Clock } from "lucide-react";

export function Footer() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/subscribers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ text: data.message || "Verifique seu email para confirmar!", type: "success" });
        setEmail("");
      } else {
        setMessage({ text: data.error || "Erro ao inscrever.", type: "error" });
      }
    } catch {
      setMessage({ text: "Erro de conexão. Tente novamente.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

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
                  width={34}
                  height={38}
                />
                <div className="flex flex-col self-start">
                  <span className="font-[family-name:var(--font-accent)] italic text-[var(--color-cream)] text-xl leading-none tracking-wide">
                    Márcio Marano
                  </span>
                  <span className="font-[family-name:var(--font-accent)] italic text-[var(--color-cream)] text-xl leading-tight tracking-wide ml-3">
                    e André Silva
                  </span>
                  <span className="font-sans font-bold text-[var(--color-accent)] text-[0.65rem] leading-none tracking-[0.1em] mt-1">
                    ADVOGADOS ASSOCIADOS S/S
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
                className="inline-flex items-center gap-2 text-sm text-[var(--color-foreground-muted)] hover:text-[var(--color-accent)] transition-colors mt-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4"
                >
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
                <span>@mmasadvogados</span>
              </a>
            </div>

            {/* Contact */}
            <div className="space-y-5">
              <h3 className="text-xs tracking-[var(--tracking-widest)] text-[var(--color-accent)] uppercase">
                Contato & Atendimento
              </h3>
              <div className="space-y-4 text-sm text-[var(--color-foreground-muted)]">
                <a 
                  href="https://www.google.com/maps/search/?api=1&query=Rua+Silvio+Romero,+500+-+Centro,+Frutal+-+MG,+38200-014" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-start gap-3 hover:text-[var(--color-accent)] transition-colors group"
                >
                  <MapPin className="w-4 h-4 mt-0.5 text-[var(--color-accent-muted)] shrink-0 group-hover:scale-110 transition-transform" />
                  <span>Rua Silvio Romero, 500<br />Centro, Frutal-MG<br />CEP 38200-014</span>
                </a>
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-[var(--color-accent-muted)]" />
                  <span>Seg a Sex: 8h às 17h30</span>
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
              <form className="flex gap-2" onSubmit={handleSubscribe}>
                <input
                  type="email"
                  placeholder="Seu email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex-1 bg-transparent border-b border-[var(--color-border)] pb-2 text-sm text-[var(--color-cream)] placeholder:text-[var(--color-foreground-muted)]/40 focus:border-[var(--color-accent)] focus:outline-none transition-colors"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 text-sm rounded-lg bg-[var(--color-accent)]/10 text-[var(--color-accent)] border border-[var(--color-accent)]/20 hover:bg-[var(--color-accent)]/20 disabled:opacity-50 transition-colors"
                >
                  {loading ? "Enviando..." : "Me inscrever"}
                </button>
              </form>
              {message && (
                <p className={`text-xs mt-2 ${message.type === "success" ? "text-green-400" : "text-red-400"}`}>
                  {message.text}
                </p>
              )}
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
