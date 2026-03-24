"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";

interface Sub {
  id: string;
  email: string;
  name: string | null;
  confirmed: boolean;
  subscribedAt: string;
  unsubscribedAt: string | null;
}

export default function SubscribersPage() {
  const [subs, setSubs] = useState<Sub[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/subscribers")
      .then((r) => r.json())
      .then(setSubs)
      .finally(() => setLoading(false));
  }, []);

  const confirmed = subs.filter((s) => s.confirmed && !s.unsubscribedAt);
  const pending = subs.filter((s) => !s.confirmed);
  const unsub = subs.filter((s) => s.unsubscribedAt);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-[var(--color-foreground)]">
          Assinantes
        </h1>
        <p className="text-sm text-[var(--color-foreground-muted)] mt-1">
          Gestão da lista de newsletter
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
          <p className="text-2xl font-bold text-green-400">{confirmed.length}</p>
          <p className="text-sm text-[var(--color-foreground-muted)]">Confirmados</p>
        </div>
        <div className="p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
          <p className="text-2xl font-bold text-yellow-400">{pending.length}</p>
          <p className="text-sm text-[var(--color-foreground-muted)]">Pendentes</p>
        </div>
        <div className="p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
          <p className="text-2xl font-bold text-red-400">{unsub.length}</p>
          <p className="text-sm text-[var(--color-foreground-muted)]">Descadastrados</p>
        </div>
      </div>

      {loading ? (
        <p className="text-[var(--color-foreground-muted)]">Carregando...</p>
      ) : subs.length === 0 ? (
        <div className="text-center py-16">
          <Users className="w-12 h-12 mx-auto text-[var(--color-foreground-muted)]/30 mb-4" />
          <p className="text-[var(--color-foreground-muted)]">Nenhum assinante ainda</p>
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--color-border)] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-[var(--color-surface)] border-b border-[var(--color-border)]">
                <th className="text-left px-6 py-3 text-xs font-medium text-[var(--color-foreground-muted)] uppercase">Email</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-[var(--color-foreground-muted)] uppercase">Status</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-[var(--color-foreground-muted)] uppercase">Inscrito em</th>
              </tr>
            </thead>
            <tbody>
              {subs.map((sub) => (
                <tr key={sub.id} className="border-b border-[var(--color-border)]">
                  <td className="px-6 py-4 text-sm text-[var(--color-foreground)]">{sub.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 text-xs rounded-full ${
                      sub.unsubscribedAt
                        ? "bg-red-500/10 text-red-400"
                        : sub.confirmed
                          ? "bg-green-500/10 text-green-400"
                          : "bg-yellow-500/10 text-yellow-400"
                    }`}>
                      {sub.unsubscribedAt ? "Descadastrado" : sub.confirmed ? "Confirmado" : "Pendente"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-[var(--color-foreground-muted)]">
                    {new Date(sub.subscribedAt).toLocaleDateString("pt-BR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
