"use client";

import { useState } from "react";

export function CopyInstagramButton({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <button
      onClick={handleCopy}
      className={className || "px-4 py-2 text-sm rounded-lg bg-pink-500/10 text-pink-400 hover:bg-pink-500/20 transition-colors"}
    >
      {copied ? "Copiado!" : "Instagram"}
    </button>
  );
}
