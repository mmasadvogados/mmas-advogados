interface CardProps {
  children: React.ReactNode;
  glass?: boolean;
  goldBorder?: boolean;
  className?: string;
}

export function Card({
  children,
  glass = false,
  goldBorder = false,
  className = "",
}: CardProps) {
  return (
    <div
      className={`rounded-xl p-6 ${
        glass
          ? "bg-white/5 backdrop-blur-md"
          : "bg-[var(--color-surface)]"
      } ${
        goldBorder
          ? "border border-[var(--color-accent)]/30 hover:border-[var(--color-accent)]/60"
          : "border border-[var(--color-border)]"
      } transition-all duration-300 ${className}`}
    >
      {children}
    </div>
  );
}
