import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function Badge({
  className,
  tone = "neutral",
  ...props
}: HTMLAttributes<HTMLSpanElement> & {
  tone?: "primary" | "secondary" | "tertiary" | "error" | "neutral";
}) {
  const styles = {
    primary: "bg-[var(--primary-soft)] text-[var(--primary)]",
    secondary: "bg-[var(--secondary-soft)] text-[var(--secondary)]",
    tertiary: "bg-[var(--tertiary-soft)] text-[var(--tertiary)]",
    error: "bg-[var(--error-soft)] text-[var(--error)]",
    neutral: "bg-[var(--surface-soft)] text-[var(--text-muted)]"
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold tracking-normal",
        styles[tone],
        className
      )}
      {...props}
    />
  );
}
