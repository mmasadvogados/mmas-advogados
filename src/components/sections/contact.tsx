"use client";

import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import Image from "next/image";
import { MapPin, Phone, Mail, Clock, MessageCircle } from "lucide-react";

const practiceAreas = [
  "Internet", "Civil", "Empresarial", "Tributário", "Agrário e Ambiental",
  "Cooperativas", "Administrativo", "Trabalho", "Previdenciário",
  "Direito Médico e Hospitalar", "Direito Eleitoral",
];

export function Contact() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSending(true);
    await new Promise((r) => setTimeout(r, 1500));
    setSending(false);
    setSent(true);
    setTimeout(() => setSent(false), 3000);
  };

  return (
    <section id="contato" className="py-32 relative" ref={ref}>
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <div className="max-w-2xl mb-20">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            className="section-label mb-4"
          >
            Contato
          </motion.p>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={inView ? { scaleX: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="w-20 h-px bg-[var(--color-accent)] mb-8 origin-left"
          />
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3 }}
            className="font-[family-name:var(--font-heading)] font-bold text-[var(--color-cream)] leading-tight"
            style={{ fontSize: "var(--text-h1)" }}
          >
            Fale com nosso{" "}
            <span className="text-[var(--color-accent)]">escritório</span>
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Form in Glass Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.4 }}
            className="glass rounded-2xl p-8"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs tracking-[var(--tracking-wide)] text-[var(--color-foreground-muted)] uppercase mb-2 block">Nome</label>
                  <input name="name" required placeholder="Seu nome completo" className="w-full bg-transparent border-b border-[var(--color-border)] pb-3 text-[var(--color-cream)] placeholder:text-[var(--color-foreground-muted)]/40 focus:border-[var(--color-accent)] focus:outline-none transition-colors" />
                </div>
                <div>
                  <label className="text-xs tracking-[var(--tracking-wide)] text-[var(--color-foreground-muted)] uppercase mb-2 block">Email</label>
                  <input name="email" type="email" required placeholder="seu@email.com" className="w-full bg-transparent border-b border-[var(--color-border)] pb-3 text-[var(--color-cream)] placeholder:text-[var(--color-foreground-muted)]/40 focus:border-[var(--color-accent)] focus:outline-none transition-colors" />
                </div>
              </div>
              <div>
                <label className="text-xs tracking-[var(--tracking-wide)] text-[var(--color-foreground-muted)] uppercase mb-2 block">Telefone</label>
                <input name="phone" type="tel" placeholder="(34) 99999-9999" className="w-full bg-transparent border-b border-[var(--color-border)] pb-3 text-[var(--color-cream)] placeholder:text-[var(--color-foreground-muted)]/40 focus:border-[var(--color-accent)] focus:outline-none transition-colors" />
              </div>
              <div>
                <label className="text-xs tracking-[var(--tracking-wide)] text-[var(--color-foreground-muted)] uppercase mb-2 block">Área de Interesse</label>
                <select name="subject" required className="w-full bg-transparent border-b border-[var(--color-border)] pb-3 text-[var(--color-cream)] focus:border-[var(--color-accent)] focus:outline-none transition-colors [&>option]:bg-[var(--color-surface)] [&>option]:text-[var(--color-cream)]">
                  <option value="">Selecione</option>
                  {practiceAreas.map((a) => (<option key={a} value={a}>{a}</option>))}
                  <option value="Outros">Outros</option>
                </select>
              </div>
              <div>
                <label className="text-xs tracking-[var(--tracking-wide)] text-[var(--color-foreground-muted)] uppercase mb-2 block">Mensagem</label>
                <textarea name="message" required rows={4} placeholder="Como podemos ajudá-lo?" className="w-full bg-transparent border-b border-[var(--color-border)] pb-3 text-[var(--color-cream)] placeholder:text-[var(--color-foreground-muted)]/40 focus:border-[var(--color-accent)] focus:outline-none transition-colors resize-none" />
              </div>
              <button
                type="submit"
                disabled={sending}
                className="w-full sm:w-auto px-10 py-4 rounded-xl bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-light)] text-[var(--color-background)] font-semibold text-sm hover:shadow-[var(--shadow-glow-gold-strong)] disabled:opacity-50 transition-all duration-500"
              >
                {sending ? "Enviando..." : sent ? "Mensagem Enviada!" : "Enviar Mensagem"}
              </button>
            </form>
          </motion.div>

          {/* Info Side */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.6 }}
            className="space-y-8"
          >
            {/* Signage photo */}
            <div className="relative aspect-[16/9] rounded-2xl overflow-hidden">
              <Image
                src="/images/signage-closeup.jpg"
                alt="Placa MMAS Advogados"
                fill
                className="object-cover object-top"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-background)]/60 to-transparent" />
            </div>

            {/* Contact details */}
            <div className="space-y-5">
              {[
                { icon: MapPin, label: "Endereço", value: "Rua Silvio Romero, 500\nCentro, Frutal-MG\nCEP 38200-014", href: "https://www.google.com/maps/search/?api=1&query=Rua+Silvio+Romero,+500+-+Centro,+Frutal+-+MG,+38200-014" },
                { icon: Phone, label: "Telefone", value: "(34) 3423-3063", href: "tel:+553434233063" },
                { icon: Mail, label: "Email", value: "escritorio@mmasadvogados.adv.br", href: "mailto:escritorio@mmasadvogados.adv.br" },
                { icon: Clock, label: "Horário", value: "Segunda a Sexta: 8h às 17h30" },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg border border-[var(--color-accent)]/20 flex items-center justify-center shrink-0">
                    <item.icon className="w-4 h-4 text-[var(--color-accent)]" />
                  </div>
                  <div>
                    <p className="text-xs tracking-[var(--tracking-wide)] text-[var(--color-foreground-muted)] uppercase">{item.label}</p>
                    {item.href ? (
                      <a 
                        href={item.href} 
                        target={item.href.startsWith("http") ? "_blank" : undefined}
                        rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                        className="text-sm text-[var(--color-cream)] hover:text-[var(--color-accent)] transition-colors whitespace-pre-line"
                      >
                        {item.value}
                      </a>
                    ) : (
                      <p className="text-sm text-[var(--color-cream)] whitespace-pre-line">{item.value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* WhatsApp CTA */}
            <a
              href="https://wa.me/553434233063"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 font-semibold hover:bg-green-500/20 hover:shadow-[0_0_20px_rgba(34,197,94,0.1)] transition-all duration-300"
            >
              <MessageCircle className="w-5 h-5" />
              Fale pelo WhatsApp
            </a>
          </motion.div>
        </div>

        {/* Interactive Map */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.8 }}
          className="mt-16 w-full h-[400px] rounded-2xl overflow-hidden glass relative group"
        >
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1136.2570086815777!2d-48.9392823!3d-20.0267713!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94bb4b06b6e4e5cf%3A0xe9628ed46fcfbd10!2sR.%20S%C3%ADlvio%20Romero%2C%20500%20-%20Centro%2C%20Frutal%20-%20MG%2C%2038200-000!5e0!3m2!1sen!2sbr!4v1711234567890!5m2!1sen!2sbr"
            width="100%"
            height="100%"
            style={{ border: 0, filter: "grayscale(1) contrast(1.2) opacity(0.8)" }}
            allowFullScreen={false}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="group-hover:filter-none transition-all duration-700"
          ></iframe>
        </motion.div>
      </div>
    </section>
  );
}
