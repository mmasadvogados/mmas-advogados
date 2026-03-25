"use client";

import { useRef } from "react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import Image from "next/image";

const values = [
  "Ética",
  "Respeito",
  "Responsabilidade Social",
  "Aprimoramento Profissional",
  "Organização",
];

export function About() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const imageRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: imageRef,
    offset: ["start end", "end start"],
  });
  const imageY = useTransform(scrollYProgress, [0, 1], ["-5%", "5%"]);

  return (
    <section id="sobre" className="py-32 relative" ref={ref}>
      <div className="mx-auto max-w-7xl px-6">
        {/* Section Label */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="section-label mb-4"
        >
          Sobre o Escritório
        </motion.p>

        <motion.div
          initial={{ scaleX: 0 }}
          animate={inView ? { scaleX: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="w-20 h-px bg-[var(--color-accent)] mb-16 origin-left"
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          {/* Image Column (7/12) */}
          <motion.div
            ref={imageRef}
            initial={{ opacity: 0, x: -40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="lg:col-span-7 relative"
          >
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden">
              <motion.div style={{ y: imageY }} className="absolute inset-[-10%]">
                <Image
                  src="/images/office-facade.jpg"
                  alt="Sede MMAS Advogados - Frutal-MG"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 60vw"
                  priority
                />
              </motion.div>
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-background)]/40 to-transparent" />
            </div>

            {/* Gold accent frame */}
            <div className="absolute -bottom-4 -right-4 w-32 h-32 border-b-2 border-r-2 border-[var(--color-accent)]/30 rounded-br-2xl pointer-events-none" />
            <div className="absolute -top-4 -left-4 w-32 h-32 border-t-2 border-l-2 border-[var(--color-accent)]/30 rounded-tl-2xl pointer-events-none" />
          </motion.div>

          {/* Text Column (5/12) */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="lg:col-span-5 space-y-8"
          >
            <h2
              className="font-[family-name:var(--font-heading)] font-bold text-[var(--color-cream)] leading-tight"
              style={{ fontSize: "var(--text-h2)" }}
            >
              Anos de Tradição<br />
              <span className="text-[var(--color-accent)]">e Dedicação</span>
            </h2>

            <p className="text-[var(--color-foreground-muted)] text-lg leading-relaxed">
              O escritório Márcio Marano & André Silva Advogados Associados
              oferece assessoria e consultoria jurídica ampla, atuando nos mais
              variados ramos do direito com excelência reconhecida.
            </p>

            {/* Pull quote */}
            <blockquote className="border-l-2 border-[var(--color-accent)] pl-6 py-2">
              <p className="font-[family-name:var(--font-accent)] italic text-[var(--color-cream)] text-xl leading-relaxed">
                &ldquo;Uma atuação norteada por princípios, em prol dos clientes e da comunidade.&rdquo;
              </p>
            </blockquote>

            <p className="text-[var(--color-foreground-muted)] leading-relaxed">
              Nossa nova sede reflete nosso compromisso com a excelência — um
              espaço moderno e acolhedor, projetado para proporcionar a melhor
              experiência.
            </p>

            {/* Values */}
            <div className="space-y-3 pt-4">
              <p className="text-xs tracking-[var(--tracking-widest)] text-[var(--color-accent)] uppercase mb-4">
                Nossos Valores
              </p>
              {values.map((value, i) => (
                <motion.div
                  key={value}
                  initial={{ opacity: 0, x: 20 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.4, delay: 0.7 + i * 0.1 }}
                  className="flex items-center gap-4"
                >
                  <div className="w-2 h-2 rounded-full bg-[var(--color-accent)]" />
                  <span className="text-[var(--color-cream)] text-sm font-medium">
                    {value}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
