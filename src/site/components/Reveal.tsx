import { useEffect, useRef, useState, type ReactNode } from "react";
import clsx from "clsx";

// Fade-and-rise on first scroll into view. Content is visible by default if
// IntersectionObserver is missing; reduced motion shows it instantly (CSS).
export function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(typeof IntersectionObserver === "undefined");
  useEffect(() => {
    const el = ref.current;
    if (!el || shown) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [shown]);
  return (
    <div ref={ref} className={clsx("reveal", shown && "is-shown", className)} style={{ transitionDelay: shown ? `${delay}ms` : undefined }}>
      {children}
    </div>
  );
}
