import { Link } from "react-router";
import clsx from "clsx";
import { BadgeCheck } from "lucide-react";
import { useContent } from "../../content/useContent";
import { SKILL_CATEGORIES, SKILL_CATEGORY_LABELS } from "../../content/model";
import type { Skill, SkillCategory } from "../../content/schema";
import { Section } from "../components/Section";
import { SkillIcon } from "../components/BrandIcon";
import { evidenceLink } from "../evidence";

// Bento layout: the two biggest groups take the wide tiles; the rest share a row.
const SPAN: Record<SkillCategory, string> = {
  frameworks: "lg:col-span-2",
  languages: "lg:col-span-1",
  engines: "lg:col-span-1",
  databases: "lg:col-span-1",
  tools: "lg:col-span-1",
};
const ORDER: SkillCategory[] = ["frameworks", "languages", "engines", "databases", "tools"];

function SkillPill({ skill }: { skill: Skill }) {
  const content = useContent();
  const first = skill.evidence[0];
  const inner = (
    <>
      <SkillIcon id={skill.id} name={skill.name} size={15} className="text-ink-dim transition-ui group-hover:text-ink" />
      <span>{skill.name}</span>
      {first && <span aria-hidden className="size-1.5 rounded-full bg-primary" />}
    </>
  );
  const cls = "group inline-flex h-9 items-center gap-2 rounded-full border border-line bg-surface-1 px-3 text-sm text-ink transition-ui";
  if (!first) return <span className={cls}>{inner}</span>;
  const link = evidenceLink(content, first);
  const all = skill.evidence.map((e) => evidenceLink(content, e).label).join(", ");
  return (
    <Link to={link.href} className={clsx(cls, "hover:border-primary hover:bg-surface-2")} aria-label={`${skill.name}, evidence: ${all}`} title={`Evidence: ${all}`}>
      {inner}
    </Link>
  );
}

export function Skills() {
  const { skills, achievements } = useContent();
  const groups = ORDER.filter((c) => SKILL_CATEGORIES.includes(c))
    .map((c) => ({ category: c, items: skills.filter((s) => s.category === c) }))
    .filter((g) => g.items.length > 0);
  const unityCert = achievements.find((a) => a.id === "unity-certified-user-programmer");

  return (
    <Section
      id="skills"
      title="Skills"
      lead={
        <>
          From my CV and my public repositories. A <span className="inline-block size-1.5 translate-y-[-2px] rounded-full bg-primary" aria-hidden /> dot links a skill to the project or certificate that shows it.
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((g) => (
          <article
            key={g.category}
            aria-labelledby={`skills-${g.category}`}
            className={clsx(
              "relative flex flex-col gap-5 overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface-1 p-5 shadow-[var(--shadow-1)] transition-ui hover:border-line-strong sm:p-6",
              SPAN[g.category],
              g.category === "frameworks" && "sm:col-span-2",
            )}
          >
            <header className="flex items-baseline justify-between gap-4">
              <h3 id={`skills-${g.category}`} className="eyebrow text-ink">
                {SKILL_CATEGORY_LABELS[g.category]}
              </h3>
              <span className="tabular font-mono text-sm text-ink-faint">{String(g.items.length).padStart(2, "0")}</span>
            </header>
            {g.category === "engines" && unityCert && (
              <Link to="/#certifications" className="flex items-center gap-2 text-sm text-primary-text underline-offset-4 hover:underline">
                <BadgeCheck size={16} aria-hidden />
                {unityCert.title}
              </Link>
            )}
            <ul className="flex flex-wrap gap-2">
              {g.items.map((s) => (
                <li key={s.id}>
                  <SkillPill skill={s} />
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </Section>
  );
}
