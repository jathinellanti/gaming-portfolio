import type { ReactNode } from "react";
import clsx from "clsx";

export function Chip({ children, tone = "accent", className }: { children: ReactNode; tone?: "accent" | "neutral"; className?: string }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[0.8rem] font-medium leading-6",
        tone === "accent" ? "[background:linear-gradient(var(--primary-soft),var(--primary-soft)),var(--bg)] text-primary-text" : "border border-line bg-surface-1 text-ink-dim",
        className,
      )}
    >
      {children}
    </span>
  );
}
