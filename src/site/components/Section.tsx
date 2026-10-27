import { useEffect, useRef, type ReactNode } from "react";
import clsx from "clsx";
import { sectionLabel, sectionNumber, type SectionId } from "../nav-items";
import { setSectionActive } from "../moods";
import { Reveal } from "./Reveal";

export function Section({
  id,
  title,
  lead,
  action,
  children,
  className,
}: {
  id: SectionId;
  title: ReactNode;
  lead?: ReactNode;
  /** Right end of the label row, e.g. "All on GitHub ↗". */
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const headingId = `${id}-heading`;
  const ref = useRef<HTMLElement>(null);

  // Report when this section holds the middle of the viewport, so the page
  // background takes on its tones.
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setSectionActive(id, e.isIntersecting), { rootMargin: "-45% 0px -45% 0px" });
    io.observe(el);
    return () => {
      io.disconnect();
      setSectionActive(id, false);
    };
  }, [id]);

  return (
    <section ref={ref} id={id} aria-labelledby={headingId} className="relative isolate">
      <div className={clsx("relative mx-auto w-full max-w-[1200px] px-4 pb-[var(--space-8)] pt-[var(--space-9)] sm:px-6 lg:px-8", className)}>
        <Reveal>
          <header className="mb-10 lg:mb-14">
            <div className="flex items-center gap-4">
              <p className="eyebrow shrink-0">
                <span className="tabular bg-gradient-to-r from-primary-text to-secondary-text bg-clip-text text-transparent">{sectionNumber(id)}</span>
                <span aria-hidden> / </span>
                {sectionLabel(id)}
              </p>
              <span aria-hidden className="h-px flex-1 bg-line" />
              {action && <div className="shrink-0 text-sm">{action}</div>}
            </div>
            <h2 id={headingId} className="text-lux text-chrome mt-5 max-w-[22ch] pb-[0.08em] text-[clamp(2.4rem,5.2vw,4.4rem)]">
              {title}
            </h2>
            {lead && <p className="mt-5 max-w-[62ch] text-[length:var(--step-1)] text-ink-dim">{lead}</p>}
          </header>
        </Reveal>
        <Reveal delay={80}>{children}</Reveal>
      </div>
    </section>
  );
}
