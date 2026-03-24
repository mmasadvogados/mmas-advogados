"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Image from "next/image";

const attorneys = [
  {
    name: "Márcio Martins Marano",
    oab: "OAB/MG n. 99.816",
    bio: "Mestre em Direito pela Universidade de Ribeirão Preto. Especialista em Recuperação de Empresas e Direito Empresarial. Mais de 15 anos de experiência em consultoria jurídica empresarial.",
    specialties: ["Empresarial", "Recuperação Judicial", "Tributário"],
  },
  {
    name: "André Silva de Souza",
    oab: "OAB/GO 37.243 | OAB/MG 146.322",
    bio: "Pós-Graduado em Advocacia Contenciosa Cível e em Direito Público. Pós-Graduado em Direito Notarial e Registral. Atuação destacada em Direito Civil e Administrativo.",
    specialties: ["Civil", "Direito Público", "Notarial"],
  },
  {
    name: "Ítalo B. F. de Paula",
    oab: "OAB/MG n. 168.542",
    bio: "Pós-Graduado em Direito Civil e Processual Civil pela UEMG. Atuação focada em contencioso cível e direito do consumidor.",
    specialties: ["Civil", "Processual Civil", "Consumidor"],
  },
];

export function Team() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="equipe" className="py-32 relative overflow-hidden" ref={ref}>
      {/* Background Image Parallax */}
      <div className="absolute inset-0">
        <Image
          src="/images/office-facade.jpg"
          alt=""
          fill
          className="object-cover opacity-[0.06]"
          aria-hidden="true"
        />
      </div>
      <div className="absolute inset-0 bg-[var(--color-background)]/90" />

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        {/* Header */}
        <div className="text-center mb-20">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            className="section-label mb-4"
          >
            Nossa Equipe
          </motion.p>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={inView ? { scaleX: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="w-20 h-px bg-[var(--color-accent)] mx-auto mb-8"
          />
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3 }}
            className="font-[family-name:var(--font-heading)] font-bold text-[var(--color-cream)] leading-tight"
            style={{ fontSize: "var(--text-h1)" }}
          >
            Profissionais de{" "}
            <span className="text-[var(--color-accent)]">Excelência</span>
          </motion.h2>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {attorneys.map((attorney, i) => (
            <motion.div
              key={attorney.name}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.4 + i * 0.15 }}
              className="group glass rounded-2xl overflow-hidden gold-border-animated"
            >
              {/* Photo placeholder — geometric gold pattern */}
              <div className="relative h-72 bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-primary)] flex items-center justify-center overflow-hidden">
                {/* Decorative geometric lines */}
                <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 400 300">
                  <line x1="0" y1="150" x2="400" y2="150" stroke="#C9A227" strokeWidth="0.5" />
                  <line x1="200" y1="0" x2="200" y2="300" stroke="#C9A227" strokeWidth="0.5" />
                  <circle cx="200" cy="150" r="60" stroke="#C9A227" strokeWidth="0.5" fill="none" />
                  <circle cx="200" cy="150" r="100" stroke="#C9A227" strokeWidth="0.3" fill="none" />
                  <rect x="120" y="70" width="160" height="160" stroke="#C9A227" strokeWidth="0.3" fill="none" transform="rotate(45 200 150)" />
                </svg>

                {/* Initials */}
                <span className="font-[family-name:var(--font-heading)] text-6xl font-bold text-[var(--color-accent)]/20 group-hover:text-[var(--color-accent)]/30 transition-colors duration-500">
                  {attorney.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </span>

                <div className="absolute bottom-4 left-0 right-0 text-center">
                  <span className="text-[10px] tracking-[var(--tracking-widest)] text-[var(--color-foreground-muted)]/50 uppercase">
                    Foto em breve
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="p-7 space-y-4">
                <div>
                  <h3 className="font-[family-name:var(--font-heading)] text-xl font-semibold text-[var(--color-cream)]">
                    {attorney.name}
                  </h3>
                  <span className="inline-block mt-2 px-3 py-1 text-xs rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)] border border-[var(--color-accent)]/20">
                    {attorney.oab}
                  </span>
                </div>

                <p className="text-sm text-[var(--color-foreground-muted)] leading-relaxed">
                  {attorney.bio}
                </p>

                <div className="flex flex-wrap gap-2 pt-1">
                  {attorney.specialties.map((s) => (
                    <span
                      key={s}
                      className="px-3 py-1 text-xs rounded-full border border-[var(--color-border)] text-[var(--color-foreground-muted)] hover:border-[var(--color-accent)]/30 hover:text-[var(--color-cream)] transition-colors"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
