"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";

const stats = [
  { value: 15, suffix: "+", label: "Anos de\nExperiência" },
  { value: 11, suffix: "", label: "Áreas de\nAtuação" },
  { value: 3, suffix: "", label: "Advogados\nEspecialistas" },
  { value: 1000, suffix: "+", label: "Clientes\nAtendidos" },
];

function CountUp({ target, duration = 2, inView }: { target: number; duration?: number; inView: boolean }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const increment = target / (duration * 60);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [inView, target, duration]);

  return <span>{count}</span>;
}

export function Stats() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <section ref={ref} className="py-20 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[var(--color-surface)]" />
      <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, var(--color-olive) 0%, var(--color-surface) 50%, var(--color-slate) 100%)", opacity: 0.3 }} />
      <div className="absolute inset-0 noise-overlay" />

      {/* Gold lines top and bottom */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--color-accent)]/30 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--color-accent)]/30 to-transparent" />

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 min-[400px]:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-0">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className={`text-center py-6 ${
                i < stats.length - 1
                  ? "lg:border-r lg:border-[var(--color-accent)]/15"
                  : ""
              }`}
            >
              <p className="font-[family-name:var(--font-heading)] font-bold text-[var(--color-accent)]" style={{ fontSize: "var(--text-h1)" }}>
                <CountUp target={stat.value} inView={inView} />
                {stat.suffix}
              </p>
              <p className="text-sm text-[var(--color-foreground-muted)] mt-2 whitespace-pre-line">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
