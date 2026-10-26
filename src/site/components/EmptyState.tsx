import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({ icon: Icon, title, why, action }: { icon: LucideIcon; title: string; why: string; action?: ReactNode }) {
  return (
    <div role="status" className="flex flex-col items-start gap-3 rounded-[var(--radius-card)] border border-dashed border-line-strong px-6 py-8">
      <Icon size={20} aria-hidden className="text-ink-faint" />
      <p className="font-medium text-ink">{title}</p>
      <p className="max-w-[60ch] text-sm text-ink-dim">{why}</p>
      {action}
    </div>
  );
}
