import { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = "", id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-[var(--color-foreground-muted)]"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full rounded-lg border bg-[var(--color-surface)] px-4 py-3 text-[var(--color-foreground)] placeholder:text-[var(--color-foreground-muted)]/50 transition-colors focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] ${
            error
              ? "border-[var(--color-error)]"
              : "border-[var(--color-border)]"
          } ${className}`}
          {...props}
        />
        {error && (
          <p className="text-sm text-[var(--color-error)]">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-sm text-[var(--color-foreground-muted)]">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = "", id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-[var(--color-foreground-muted)]"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={`w-full rounded-lg border bg-[var(--color-surface)] px-4 py-3 text-[var(--color-foreground)] placeholder:text-[var(--color-foreground-muted)]/50 transition-colors focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] min-h-[120px] resize-y ${
            error
              ? "border-[var(--color-error)]"
              : "border-[var(--color-border)]"
          } ${className}`}
          {...props}
        />
        {error && (
          <p className="text-sm text-[var(--color-error)]">{error}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
