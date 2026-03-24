import { Scale } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-background)] px-6">
      <Scale className="w-12 h-12 text-[var(--color-accent)] mb-6" />
      <h1 className="font-[family-name:var(--font-heading)] text-6xl font-bold text-[var(--color-accent)]">
        404
      </h1>
      <p className="mt-4 text-lg text-[var(--color-foreground-muted)]">
        Página não encontrada
      </p>
      <Link
        href="/"
        className="mt-8 px-6 py-3 rounded-full bg-[var(--color-accent)] text-[var(--color-primary)] font-semibold hover:bg-[var(--color-accent-light)] transition-colors"
      >
        Voltar ao início
      </Link>
    </main>
  );
}
