"use client";

import { useSyncExternalStore, useCallback } from "react";
import { Sun, Moon } from "lucide-react";

function getTheme() {
  if (typeof window === "undefined") return "dark";
  return localStorage.getItem("theme") || "dark";
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getTheme, () => "dark");
  const dark = theme === "dark";

  const toggle = useCallback(() => {
    const next = dark ? "light" : "dark";
    localStorage.setItem("theme", next);
    document.documentElement.classList.remove("dark", "light");
    document.documentElement.classList.add(next);
    window.dispatchEvent(new StorageEvent("storage"));
  }, [dark]);

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-md text-[var(--color-foreground-muted)] hover:text-[var(--color-accent)] transition-colors"
      aria-label={dark ? "Ativar modo claro" : "Ativar modo escuro"}
    >
      {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
}
