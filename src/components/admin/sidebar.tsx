"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  FileText,
  Sparkles,
  Mail,
  Users,
  LogOut,
  Scale,
  Menu,
  X,
} from "lucide-react";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/artigos", label: "Artigos", icon: FileText },
  { href: "/admin/artigos/gerar", label: "Gerar Artigo", icon: Sparkles },
  { href: "/admin/newsletter", label: "Newsletter", icon: Mail },
  { href: "/admin/assinantes", label: "Assinantes", icon: Users },
];

interface SidebarProps {
  user: { name?: string | null; email?: string | null };
}

export function AdminSidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)]"
      >
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-full w-64 bg-[var(--color-primary)] border-r border-[var(--color-border)] flex flex-col transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-[var(--color-border)]">
          <Link href="/admin/dashboard" className="flex items-center gap-3">
            <Scale className="w-6 h-6 text-[var(--color-accent)]" />
            <span className="font-[family-name:var(--font-heading)] text-lg font-bold">
              MMAS <span className="text-[var(--color-accent)]">Admin</span>
            </span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                    : "text-[var(--color-foreground-muted)] hover:text-[var(--color-foreground)] hover:bg-white/5"
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-[var(--color-border)]">
          <div className="flex items-center gap-3 px-4 py-2">
            <div className="w-8 h-8 rounded-full bg-[var(--color-accent)]/20 flex items-center justify-center text-sm font-bold text-[var(--color-accent)]">
              {user.name?.charAt(0) || "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--color-foreground)] truncate">
                {user.name}
              </p>
              <p className="text-xs text-[var(--color-foreground-muted)] truncate">
                {user.email}
              </p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-3 w-full px-4 py-2.5 mt-2 rounded-lg text-sm text-[var(--color-foreground-muted)] hover:text-[var(--color-error)] hover:bg-[var(--color-error)]/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sair
          </button>
        </div>
      </aside>
    </>
  );
}
