"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function WhatsAppFAB() {
  const [hovered, setHovered] = useState(false);

  return (
    <div className="fixed bottom-5 right-5 sm:bottom-8 sm:right-8 z-50">
      {/* Tooltip */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap px-4 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-sm text-[var(--color-cream)] shadow-[var(--shadow-elevation-2)]"
          >
            Fale conosco
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pulse ring */}
      <div className="absolute inset-0 rounded-full bg-green-500/20 animate-[pulse-ring_2s_ease-out_infinite]" />

      {/* Button */}
      <motion.a
        href="https://wa.me/553434233063"
        target="_blank"
        rel="noopener noreferrer"
        className="relative flex items-center justify-center w-16 h-16 rounded-full bg-green-500 text-white shadow-lg hover:bg-green-600 hover:shadow-[0_0_30px_rgba(34,197,94,0.3)] transition-all duration-300"
        aria-label="Fale conosco pelo WhatsApp"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2 }}
      >
        <MessageCircle className="w-7 h-7" />
      </motion.a>
    </div>
  );
}
