"use client";

import { useState } from "react";
import { Copy, Share2, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/toast";

const btnClass =
  "flex items-center gap-2 px-3 py-2.5 sm:px-4 rounded-xl bg-[var(--color-surface)]/80 backdrop-blur-md border border-[var(--color-border-gold)] text-[var(--color-cream)] text-sm hover:border-[var(--color-accent)]/60 transition-all duration-300 min-h-11 min-w-11";

export function MapActions({
  address,
  mapsUrl,
}: {
  address: string;
  mapsUrl: string;
}) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      return true;
    }
  }

  async function handleCopy() {
    await copyToClipboard(address);
    toast("Endereço copiado!", "success");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "MMAS Advogados",
          text: address,
          url: mapsUrl,
        });
        return;
      } catch {
        // share cancelled or failed, fall through to copy
      }
    }
    await copyToClipboard(mapsUrl);
    toast("Link copiado!", "success");
  }

  return (
    <div className="absolute bottom-4 right-4 z-10 flex gap-2">
      <button onClick={handleCopy} className={btnClass}>
        <AnimatePresence mode="wait" initial={false}>
          {copied ? (
            <motion.div
              key="check"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
            >
              <Check className="w-4 h-4" />
            </motion.div>
          ) : (
            <motion.div
              key="copy"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
            >
              <Copy className="w-4 h-4" />
            </motion.div>
          )}
        </AnimatePresence>
        <span className="hidden sm:inline">Copiar</span>
      </button>
      <button onClick={handleShare} className={btnClass}>
        <Share2 className="w-4 h-4" />
        <span className="hidden sm:inline">Compartilhar</span>
      </button>
    </div>
  );
}
