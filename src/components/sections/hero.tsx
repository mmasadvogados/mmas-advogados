"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });
  const videoY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex items-center overflow-hidden"
    >
      {/* Video Background with Parallax */}
      <motion.div className="absolute inset-0" style={{ y: videoY }}>
        <video
          autoPlay
          muted
          loop
          playsInline
          poster="/images/office-facade.jpg"
          className="w-full h-[120%] object-cover"
        >
          <source src="/videos/hero-desktop.mp4" type="video/mp4" />
        </video>
      </motion.div>

      {/* Layered Overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-background)]/40 via-[var(--color-background)]/60 to-[var(--color-background)]" />
      <div className="absolute inset-0 noise-overlay" />
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 70% 50%, rgba(201,162,39,0.04) 0%, transparent 70%)" }} />

      {/* Gold Top Accent Line */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-px bg-[var(--color-accent)]"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1.2, delay: 0.2, ease: "easeInOut" }}
        style={{ transformOrigin: "left" }}
      />

      {/* Content */}
      <motion.div
        className="relative z-10 mx-auto max-w-7xl px-6 w-full pt-32 pb-24"
        style={{ opacity: contentOpacity }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-center">
          {/* Left Content (3/5) */}
          <div className="lg:col-span-3 space-y-8">
            {/* Section Label */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="section-label"
            >
              Escritório de Advocacia
            </motion.p>

            {/* Main Heading */}
            <div className="overflow-hidden">
              <motion.h1
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                transition={{ duration: 0.8, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="font-[family-name:var(--font-heading)] font-bold leading-[0.95] tracking-[var(--tracking-display)]"
                style={{ fontSize: "var(--text-display)" }}
              >
                <span className="text-[var(--color-cream)]">Márcio</span>
                <br />
                <span className="text-[var(--color-cream)]">Marano</span>
              </motion.h1>
            </div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 1.1 }}
              className="flex items-center gap-4"
            >
              <div className="w-16 h-px bg-[var(--color-accent)]" />
              <span className="font-[family-name:var(--font-accent)] italic text-[var(--color-accent)] text-2xl md:text-3xl">
                &amp; André Silva
              </span>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.3 }}
              className="tracking-[var(--tracking-widest)] text-[var(--color-accent-muted)] text-xs md:text-sm uppercase"
            >
              Advogados Associados
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.5 }}
              className="text-[var(--color-foreground-muted)] text-lg max-w-xl leading-relaxed"
            >
              Mais de 15 anos de excelência em assessoria e consultoria jurídica,
              atuando com ética, competência e resultados consistentes.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.7 }}
              className="flex flex-col sm:flex-row gap-4 pt-4"
            >
              <Button
                size="lg"
                onClick={() =>
                  window.open("https://wa.me/553434233063", "_blank")
                }
                className="bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-light)] text-[var(--color-background)] font-semibold hover:shadow-[var(--shadow-glow-gold-strong)] transition-shadow duration-500"
              >
                Fale Conosco
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={() =>
                  document
                    .getElementById("areas")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className="border-[var(--color-accent-muted)]/30 text-[var(--color-cream)]"
              >
                Conheça Nossas Áreas
              </Button>
            </motion.div>
          </div>

          {/* Right Glass Card (2/5) */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 1.9 }}
            className="lg:col-span-2 hidden lg:block"
          >
            <div className="glass rounded-2xl p-8 space-y-6">
              {/* Office signage image */}
              <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden">
                <Image
                  src="/images/signage-closeup.jpg"
                  alt="Fachada MMAS Advogados"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 40vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: "15+", label: "Anos de\nExperiência" },
                  { value: "11", label: "Áreas de\nAtuação" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="text-center p-3 rounded-lg bg-[var(--color-background)]/40"
                  >
                    <p className="font-[family-name:var(--font-heading)] text-3xl font-bold text-[var(--color-accent)]">
                      {stat.value}
                    </p>
                    <p className="text-xs text-[var(--color-foreground-muted)] whitespace-pre-line mt-1">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>

              <div className="text-center">
                <p className="text-xs text-[var(--color-foreground-muted)]">
                  Rua Silvio Romero, 500 — Frutal-MG
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.2 }}
      >
        <span className="text-[10px] tracking-[var(--tracking-widest)] text-[var(--color-foreground-muted)] uppercase">
          Scroll
        </span>
        <motion.div
          className="w-px h-8 bg-[var(--color-accent)]"
          animate={{ scaleY: [0, 1, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          style={{ transformOrigin: "top" }}
        />
      </motion.div>
    </section>
  );
}
