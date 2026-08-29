import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: "primary" | "secondary" | "ghost" | "surface" | "danger";
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
};

export function Button({
  className,
  tone = "primary",
  iconLeft,
  iconRight,
  children,
  ...props
}: ButtonProps) {
  const tones = {
    primary: "bg-[var(--primary-strong)] text-white shadow-sm hover:bg-[var(--primary)] hover:text-[var(--ink-900)]",
    secondary: "bg-[var(--secondary)] text-white hover:brightness-95",
    ghost: "bg-transparent text-[var(--text)] hover:bg-[var(--primary-soft)]",
    surface: "bg-white text-[var(--text)] border border-[var(--border)] hover:border-[var(--gold-300)] hover:bg-[var(--surface-soft)]",
    danger: "bg-[var(--error-soft)] text-[var(--error)] hover:brightness-95"
  };

  return (
    <button
      className={cn(
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-bold tracking-normal transition-all disabled:cursor-not-allowed disabled:opacity-55",
        tones[tone],
        className
      )}
      {...props}
    >
      {iconLeft}
      {children}
      {iconRight}
    </button>
  );
}
