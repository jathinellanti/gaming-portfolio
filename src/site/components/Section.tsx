import type { ReactNode } from "react";
import clsx from "clsx";
import { sectionLabel, sectionNumber, type SectionId } from "../nav-items";

export function Section({ id, title, lead, children, className }: { id: SectionId; title: ReactNode; lead?: ReactNode; children: ReactNode; className?: string }) {
  const headingId = `${id}-heading`;
  return (
    <section id={id} aria-labelledby={headingId} className={clsx("relative mx-auto w-full max-w-[1200px] px-4 pb-[var(--space-8)] pt-[var(--space-9)] sm:px-6 lg:px-8", className)}>
      <header className="mb-[var(--space-7)] grid gap-3 md:grid-cols-[200px_1fr] md:gap-8">
        <p className="eyebrow pt-2">
          <span className="tabular text-primary-text">{sectionNumber(id)}</span>
          <span aria-hidden> / </span>
          {sectionLabel(id)}
        </p>
        <div className="max-w-[var(--measure)]">
          <h2 id={headingId} className="text-display text-[length:var(--step-4)] text-ink">
            {title}
          </h2>
          {lead && <p className="mt-4 text-[length:var(--step-1)] text-ink-dim">{lead}</p>}
        </div>
      </header>
      {children}
    </section>
  );
}
