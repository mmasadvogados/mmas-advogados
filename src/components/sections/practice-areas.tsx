"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  Globe,
  Scale,
  Building2,
  Receipt,
  Trees,
  Handshake,
  Landmark,
  HardHat,
  Heart,
  Stethoscope,
  Vote,
} from "lucide-react";

const areas = [
  { icon: Globe, title: "Internet", desc: "Direito Digital, proteção de dados, crimes cibernéticos e relações jurídicas no ambiente virtual.", featured: true },
  { icon: Scale, title: "Civil", desc: "Contratos, responsabilidade civil, família, sucessões, direito do consumidor e obrigações.", featured: true },
  { icon: Building2, title: "Empresarial", desc: "Societário, recuperação judicial, falência, contratos empresariais e compliance corporativo.", featured: true },
  { icon: Receipt, title: "Tributário", desc: "Planejamento tributário, contencioso fiscal, defesas administrativas e consultoria em tributos." },
  { icon: Trees, title: "Agrário e Ambiental", desc: "Questões fundiárias, regularização de propriedades rurais e direito ambiental." },
  { icon: Handshake, title: "Cooperativas", desc: "Constituição, governança, assembleias e assessoria jurídica para cooperativas." },
  { icon: Landmark, title: "Administrativo", desc: "Licitações, contratos públicos, improbidade administrativa e direito regulatório." },
  { icon: HardHat, title: "Trabalho", desc: "Reclamações trabalhistas, consultoria preventiva, compliance trabalhista e negociações sindicais." },
  { icon: Heart, title: "Previdenciário", desc: "Aposentadorias, benefícios por incapacidade, pensão por morte e revisões previdenciárias." },
  { icon: Stethoscope, title: "Direito Médico e Hospitalar", desc: "Erro médico, responsabilidade hospitalar, regulamentação sanitária e bioética." },
  { icon: Vote, title: "Direito Eleitoral", desc: "Registro de candidaturas, prestação de contas, propaganda eleitoral e representações." },
];

export function PracticeAreas() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="areas" className="py-32 relative" ref={ref}>
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <div className="max-w-2xl mb-20">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            className="section-label mb-4"
          >
            Áreas de Atuação
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
            Excelência em{" "}
            <span className="text-[var(--color-accent)]">11 áreas</span> do
            direito
          </motion.h2>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {areas.map((area, i) => (
            <motion.div
              key={area.title}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.3 + i * 0.06 }}
              className={`group relative glass rounded-2xl p-7 gold-border-animated hover:shadow-[var(--shadow-glow-gold)] transition-all duration-500 ${
                area.featured ? "sm:col-span-1 lg:row-span-1" : ""
              }`}
            >
              {/* Icon */}
              <div className="w-12 h-12 rounded-xl border border-[var(--color-accent)]/20 flex items-center justify-center mb-5 group-hover:border-[var(--color-accent)]/50 group-hover:shadow-[var(--shadow-glow-gold)] transition-all duration-500">
                <area.icon className="w-5 h-5 text-[var(--color-accent)]" />
              </div>

              {/* Content */}
              <h3 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-[var(--color-cream)] mb-2">
                {area.title}
              </h3>
              <p className="text-sm text-[var(--color-foreground-muted)] leading-relaxed">
                {area.desc}
              </p>

              {/* Bottom gold line on hover */}
              <div className="absolute bottom-0 left-6 right-6 h-px bg-[var(--color-accent)] scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
