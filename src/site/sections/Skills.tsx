import { Link } from "react-router";
import clsx from "clsx";
import { BadgeCheck, Code2, Database, Gamepad2, Layers, Wrench, type LucideIcon } from "lucide-react";
import { useContent } from "../../content/useContent";
import { SKILL_CATEGORIES, SKILL_CATEGORY_LABELS } from "../../content/model";
import type { Skill, SkillCategory } from "../../content/schema";
import { Section } from "../components/Section";
import { SkillIcon } from "../components/BrandIcon";
import { evidenceLink } from "../evidence";

// Capabilities (one line per category: what it covers and where it's shown) beside
// a technology grid of logo tiles. A dot marks a skill with evidence and links to it.
const ORDER: SkillCategory[] = ["frameworks", "languages", "engines", "databases", "tools"];
const ICON: Record<SkillCategory, LucideIcon> = { frameworks: Layers, languages: Code2, engines: Gamepad2, databases: Database, tools: Wrench };

function SkillTile({ skill }: { skill: Skill }) {
  const content = useContent();
  const first = skill.evidence[0];
  const inner = (
    <>
      <SkillIcon id={skill.id} name={skill.name} size={20} className="text-ink-dim transition-ui group-hover:text-ink" />
      <span className="min-w-0 truncate text-sm text-ink">{skill.name}</span>
      {first && <span aria-hidden className="absolute right-2.5 top-2.5 size-1.5 rounded-full bg-primary" />}
    </>
  );
  const cls = "group relative flex h-full min-h-[84px] flex-col items-start justify-between gap-3 rounded-[12px] border border-line bg-surface-2 p-3 transition-ui";
  if (!first) return <span className={cls}>{inner}</span>;
  const link = evidenceLink(content, first);
  const all = skill.evidence.map((e) => evidenceLink(content, e).label).join(", ");
  return (
    <Link to={link.href} className={clsx(cls, "hover:-translate-y-0.5 hover:border-primary")} aria-label={`${skill.name}, evidence: ${all}`} title={`Evidence: ${all}`}>
      {inner}
    </Link>
  );
}

export function Skills() {
  const content = useContent();
  const { skills, achievements } = content;
  const groups = ORDER.filter((c) => SKILL_CATEGORIES.includes(c))
    .map((c) => ({ category: c, items: skills.filter((s) => s.category === c) }))
    .filter((g) => g.items.length > 0);
  const unityCert = achievements.find((a) => a.id === "unity-certified-user-programmer");
  const shownIn = (items: Skill[]) => [...new Set(items.flatMap((s) => s.evidence.map((e) => evidenceLink(content, e).label)))];

  return (
    <Section
      id="skills"
      title="Skills & tools"
      lead={
        <>
          From my CV and my public repositories. A <span className="inline-block size-1.5 translate-y-[-2px] rounded-full bg-primary" aria-hidden /> dot links a skill to the project or certificate that shows it.
        </>
      }
    >
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="panel p-6 sm:p-7 lg:col-span-4">
          <p className="eyebrow">Core capabilities</p>
          <ul className="mt-2 divide-y divide-line">
            {groups.map((g) => {
              const Icon = ICON[g.category];
              const proof = shownIn(g.items);
              return (
                <li key={g.category} className="flex gap-4 py-4">
                  <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-[12px] border border-line-strong bg-surface-2 text-primary-text">
                    <Icon size={18} strokeWidth={1.7} />
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="font-medium text-ink">{SKILL_CATEGORY_LABELS[g.category]}</span>
                      <span className="tabular font-mono text-xs text-ink-faint">{String(g.items.length).padStart(2, "0")}</span>
                    </span>
                    <span className="mt-0.5 block text-sm text-ink-dim">{g.items.map((s) => s.name).join(" · ")}</span>
                    {proof.length > 0 && <span className="mt-1 block text-xs text-ink-faint">Shown in: {proof.join(", ")}</span>}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-8">
          {groups.map((g) => (
            <article key={g.category} aria-labelledby={`skills-${g.category}`} className={clsx("panel flex flex-col gap-4 p-5", g.category === "frameworks" && "sm:col-span-2")}>
              <header className="flex items-baseline justify-between gap-4">
                <h3 id={`skills-${g.category}`} className="eyebrow text-ink">
                  {SKILL_CATEGORY_LABELS[g.category]}
                </h3>
                {g.category === "engines" && unityCert && (
                  <Link to="/#certifications" className="flex items-center gap-1.5 text-xs text-primary-text underline-offset-4 hover:underline">
                    <BadgeCheck size={14} aria-hidden />
                    Certified
                  </Link>
                )}
              </header>
              <ul className={clsx("grid gap-2", g.category === "frameworks" ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5" : "grid-cols-2 sm:grid-cols-3")}>
                {g.items.map((s) => (
                  <li key={s.id}>
                    <SkillTile skill={s} />
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </Section>
  );
}
