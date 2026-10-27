import { useContent } from "../../content/useContent";
import { SkillIcon } from "../components/BrandIcon";

// A slow technology strip between the stats and the sections: every skill on the CV
// as a logo and a name, moving at a constant pace (it doesn't stop under the cursor).
// Decorative: the Skills section lists them properly. Still under reduced motion.
export function Marquee() {
  const { skills } = useContent();
  const run = (copy: number) => (
    <ul className="flex shrink-0 items-center gap-10 pr-10" key={copy}>
      {skills.map((s) => (
        <li key={`${copy}-${s.id}`} className="flex items-center gap-2.5 whitespace-nowrap text-[length:var(--step-0)] font-medium text-ink-dim">
          <SkillIcon id={s.id} name={s.name} size={20} className="text-ink" />
          {s.name}
        </li>
      ))}
    </ul>
  );
  return (
    <div aria-hidden className="marquee relative mt-14 overflow-hidden border-y border-line py-5 [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
      <div className="marquee-track flex w-max">
        {run(0)}
        {run(1)}
      </div>
    </div>
  );
}
