import { useEffect, useRef, useState } from "react";
import { Cpu, FolderGit2, GraduationCap, PlaneTakeoff, type LucideIcon } from "lucide-react";
import { useContent } from "../../content/useContent";
import { prefersReducedMotion } from "../../platform/webgl";

// The stat row under the hero. Every figure is counted from content, never typed in.
interface Stat {
  value: number;
  decimals: number;
  label: string;
  detail: string;
  Icon: LucideIcon;
}

function useStats(): Stat[] {
  const { education, projects, experience, skills } = useContent();
  const degree = education.find((e) => e.result && /cgpa/i.test(e.result.label));
  const cgpa = degree?.result ? Number.parseFloat(degree.result.value) : NaN;
  const internship = experience[0];
  return [
    ...(Number.isFinite(cgpa) && degree ? [{ value: cgpa, decimals: 2, label: "CGPA", detail: `${degree.programme.split(",")[0]} · ${degree.institution}`, Icon: GraduationCap }] : []),
    { value: projects.length, decimals: 0, label: projects.length === 1 ? "Project built" : "Projects built", detail: "Public repositories", Icon: FolderGit2 },
    ...(internship ? [{ value: experience.length, decimals: 0, label: experience.length === 1 ? "Internship" : "Internships", detail: `${internship.organisation} · ${internship.location}`, Icon: PlaneTakeoff }] : []),
    { value: skills.length, decimals: 0, label: "Technologies", detail: "Languages, frameworks, engines", Icon: Cpu },
  ];
}

/** Counts up to `value` once the element scrolls into view (instantly under reduced motion). */
function CountUp({ value, decimals }: { value: number; decimals: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(value);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined" || prefersReducedMotion()) return;
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / 1200);
        setShown(value * (1 - Math.pow(1 - t, 3)));
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      setShown(0);
      raf = requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value]);
  return (
    <span ref={ref} className="tabular">
      {shown.toFixed(decimals)}
    </span>
  );
}

export function StatsStrip() {
  const stats = useStats();
  return (
    <div className="relative z-10 mx-auto -mt-16 w-full max-w-[1200px] px-4 sm:px-6 lg:px-8">
      <ul aria-label="At a glance" className="panel grid grid-cols-2 overflow-hidden lg:grid-cols-4">
        {stats.map(({ value, decimals, label, detail, Icon }, i) => (
          <li key={label} className={`flex flex-col items-center gap-1 px-4 py-6 text-center sm:py-7 ${i % 2 === 1 ? "border-l border-line" : ""} ${i >= 2 ? "border-t border-line lg:border-t-0" : ""} ${i === 2 ? "lg:border-l" : ""}`}>
            <Icon size={20} aria-hidden className="text-primary-text" strokeWidth={1.6} />
            <p className="text-lux text-chrome mt-2 text-[clamp(2.4rem,5vw,3.4rem)] leading-[1.05]">
              <CountUp value={value} decimals={decimals} />
            </p>
            <p className="eyebrow text-ink">{label}</p>
            <p className="mt-0.5 text-xs text-ink-faint">{detail}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
