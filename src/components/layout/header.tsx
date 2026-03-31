"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";

const navLinks = [
  { href: "/#sobre", label: "Sobre" },
  { href: "/#areas", label: "Áreas de Atuação" },
  { href: "/#equipe", label: "Equipe" },
  { href: "/#blog", label: "Blog" },
  { href: "/#contato", label: "Contato" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${
          scrolled
            ? "py-3 glass"
            : "py-6 bg-transparent"
        }`}
      >
        <div className="mx-auto max-w-7xl px-6 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-4 group">
            <Image
              src="/images/logo-scales.svg"
              alt="MMAS Advogados"
              width={36}
              height={40}
              className="group-hover:drop-shadow-[0_0_8px_rgba(201,162,39,0.4)] transition-all duration-300"
            />
            <div className="hidden sm:flex flex-col justify-center">
              <div className="flex flex-col self-start">
                <span className="font-[family-name:var(--font-accent)] italic text-[var(--color-cream)] text-[1.35rem] leading-none tracking-wide">
                  Márcio Marano
                </span>
                <span className="font-[family-name:var(--font-accent)] italic text-[var(--color-cream)] text-[1.35rem] leading-tight tracking-wide ml-3">
                  e André Silva
                </span>
              </div>
              <span className="font-sans font-bold text-[var(--color-accent)] text-[0.60rem] leading-none tracking-[0.1em] mt-1">
                ADVOGADOS ASSOCIADOS S/S
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onMouseEnter={() => setHoveredLink(link.href)}
                onMouseLeave={() => setHoveredLink(null)}
                className="relative px-5 py-2 text-sm font-medium text-[var(--color-cream)]/80 hover:text-[var(--color-accent)] transition-colors duration-300"
              >
                {link.label}
                {hoveredLink === link.href && (
                  <motion.div
                    layoutId="nav-underline"
                    className="absolute bottom-0 left-2 right-2 h-px bg-[var(--color-accent)]"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            ))}
          </nav>

          {/* Login Button (Desktop) */}
          <div className="hidden lg:flex items-center">
            <Link
              href="/login"
              className="ml-4 px-5 py-2 text-sm font-medium rounded-lg border border-[var(--color-accent)]/30 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10 transition-all duration-300"
            >
              Login
            </Link>
          </div>

          {/* Mobile Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 text-[var(--color-foreground-muted)] hover:text-[var(--color-cream)] transition-colors"
            aria-label="Menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 lg:hidden"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />

            {/* Panel */}
            <motion.nav
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="absolute right-0 top-0 bottom-0 w-72 min-[400px]:w-80 glass flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-[var(--color-border-gold)]">
                <Image
                  src="/images/logo-scales.svg"
                  alt="MMAS"
                  width={32}
                  height={36}
                />
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-2 text-[var(--color-foreground-muted)]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 flex flex-col justify-center px-8 gap-2">
                {navLinks.map((link, i) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.08 }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className="block py-4 font-[family-name:var(--font-heading)] text-2xl text-[var(--color-cream)] hover:text-[var(--color-accent)] border-b border-[var(--color-border)] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
              </div>

              <div className="p-8 border-t border-[var(--color-border-gold)]">
                <Link
                  href="https://wa.me/553434233063"
                  target="_blank"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[var(--color-accent)] text-[var(--color-background)] font-semibold text-sm"
                >
                  Fale Conosco
                </Link>
              </div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
