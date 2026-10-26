import { useRef, type ReactNode } from "react";
import { useReducedMotion, useScroll } from "motion/react";
import * as m from "motion/react-m";

// Date-column rows on a hairline rail; a beam traces how far the reader has scrolled.
// Desktop grid matches <Section>'s header (200px label column + 32px gap) so row
// content aligns with the section heading; the rail sits in that gap.
export function Timeline({ children, label }: { children: ReactNode; label: string }) {
  const ref = useRef<HTMLOListElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 85%", "end 55%"] });
  return (
    <div className="relative">
      <div aria-hidden className="absolute bottom-3 left-[5px] top-3 w-px bg-line md:left-[215px]" />
      <m.div
        aria-hidden
        className="absolute bottom-3 left-[5px] top-3 w-px origin-top bg-gradient-to-b from-primary via-primary to-transparent md:left-[215px]"
        style={{ scaleY: reduce ? 1 : scrollYProgress }}
      />
      <ol ref={ref} aria-label={label} className="relative">
        {children}
      </ol>
    </div>
  );
}

export function TimelineRow({ date, title, subtitle, aside, children }: { date: string; title: ReactNode; subtitle: ReactNode; aside?: ReactNode; children?: ReactNode }) {
  return (
    <li className="group relative grid gap-2 py-7 pl-8 md:grid-cols-[200px_1fr] md:gap-8 md:pl-0">
      <span aria-hidden className="absolute left-0 top-[2.15rem] size-[11px] rounded-full border-2 border-bg bg-line-strong transition-ui group-hover:bg-primary md:left-[210px]" />
      <p className="tabular whitespace-nowrap pt-1.5 font-mono text-[length:var(--step--1)] uppercase tracking-[0.06em] text-ink-dim md:text-right">{date}</p>
      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
          <h3 className="text-[length:var(--step-2)] font-medium tracking-tight text-ink">{title}</h3>
          {aside}
        </div>
        <p className="mt-1 text-ink-dim">{subtitle}</p>
        {children && <div className="mt-4">{children}</div>}
      </div>
    </li>
  );
}
