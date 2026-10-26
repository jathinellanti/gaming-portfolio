import { ArrowUpRight, Award, BadgeCheck } from "lucide-react";
import { useContent } from "../../content/useContent";
import { Section } from "../components/Section";
import { EmptyState } from "../components/EmptyState";
import { BrandIcon } from "../components/BrandIcon";
import { siUnity } from "simple-icons";
import { formatMonth } from "../format";

export function Certifications() {
  const { achievements } = useContent();
  return (
    <Section id="certifications" title="Certifications">
      {achievements.length === 0 ? (
        <EmptyState icon={Award} title="No certifications listed yet" why="Certificates and awards appear here once they are added to src/content/data/achievements.ts." />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {achievements.map((a) => (
            <li key={a.id} className="relative flex gap-5 overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface-1 p-6 shadow-[var(--shadow-1)]">
              <div aria-hidden className="grid size-14 shrink-0 place-items-center rounded-[14px] border border-line-strong bg-surface-2 text-ink">
                {a.issuer.startsWith("Unity") ? <BrandIcon icon={siUnity} size={26} /> : <Award size={24} />}
              </div>
              <div className="min-w-0">
                <p className="eyebrow flex items-center gap-1.5 text-primary-text">
                  <BadgeCheck size={14} aria-hidden />
                  {a.kind}
                </p>
                <h3 className="mt-2 text-[length:var(--step-1)] font-medium text-ink">{a.title}</h3>
                <p className="mt-1 text-ink-dim">
                  {a.issuer}
                  {a.date && (
                    <>
                      {" · "}
                      <time dateTime={a.date} className="tabular">
                        {formatMonth(a.date)}
                      </time>
                    </>
                  )}
                </p>
                {a.description && <p className="mt-3 text-sm text-ink-dim">{a.description}</p>}
                {a.credentialUrl && (
                  <a href={a.credentialUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-ink underline-offset-4 hover:underline">
                    Verify credential <ArrowUpRight size={14} aria-hidden />
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
