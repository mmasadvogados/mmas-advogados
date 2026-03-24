"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    const result = await signIn("credentials", {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Email ou senha incorretos");
    } else {
      router.push("/admin/dashboard");
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-background)] px-6">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-[var(--color-accent)] shadow-[var(--shadow-glow-gold)]">
            <Scale className="h-8 w-8 text-[var(--color-accent)]" />
          </div>
          <h1 className="mt-6 font-[family-name:var(--font-heading)] text-2xl font-bold text-[var(--color-foreground)]">
            Painel Administrativo
          </h1>
          <p className="mt-2 text-sm text-[var(--color-foreground-muted)]">
            MMAS Advogados
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            name="email"
            type="email"
            label="Email"
            placeholder="seu@email.com"
            required
            autoComplete="email"
          />
          <Input
            name="password"
            type="password"
            label="Senha"
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />

          {error && (
            <p className="text-sm text-[var(--color-error)] text-center">
              {error}
            </p>
          )}

          <Button type="submit" loading={loading} className="w-full">
            Entrar
          </Button>
        </form>

        <p className="text-center text-xs text-[var(--color-foreground-muted)]">
          Acesso restrito a advogados e colaboradores autorizados
        </p>
      </div>
    </main>
  );
}
