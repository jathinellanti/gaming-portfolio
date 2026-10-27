import { ArrowUpRight, Award, BadgeCheck } from "lucide-react";
import { siUnity } from "simple-icons";
import { useContent } from "../../content/useContent";
import { EmptyState } from "../components/EmptyState";
import { BrandIcon } from "../components/BrandIcon";
import { sectionLabel, sectionNumber } from "../nav-items";
import { formatMonth } from "../format";

// Rendered inside the Education section's grid, but still its own section so the
// nav, the palette and /#certifications land here.
export function Certifications() {
  const { achievements } = useContent();
  return (
    <section id="certifications" aria-labelledby="certifications-heading" className="panel relative h-full overflow-hidden p-6 sm:p-7">
      <div aria-hidden className="absolute -right-16 -top-16 size-48 rounded-full bg-[radial-gradient(closest-side,var(--secondary-soft),transparent)]" />
      <div aria-hidden className="pointer-events-none absolute -bottom-10 -right-8 text-ink opacity-[0.05]">
        <BrandIcon icon={siUnity} size={220} />
      </div>
      <p className="eyebrow">
        <span className="tabular bg-gradient-to-r from-primary-text to-secondary-text bg-clip-text text-transparent">{sectionNumber("certifications")}</span>
        <span aria-hidden> / </span>
        {sectionLabel("certifications")}
      </p>
      <h3 id="certifications-heading" className="sr-only">
        Certifications
      </h3>
      {achievements.length === 0 ? (
        <div className="mt-4">
          <EmptyState icon={Award} title="No certifications listed yet" why="Certificates and awards appear here once they are added to src/content/data/achievements.ts." />
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {achievements.map((a) => (
            <li key={a.id} className="relative flex gap-4 rounded-[14px] border border-line bg-surface-2 p-4">
              <div aria-hidden className="grid size-12 shrink-0 place-items-center rounded-[12px] border border-line-strong bg-bg text-ink">
                {a.issuer.startsWith("Unity") ? <BrandIcon icon={siUnity} size={24} /> : <Award size={22} />}
              </div>
              <div className="min-w-0">
                <p className="eyebrow flex items-center gap-1.5 text-primary-text">
                  <BadgeCheck size={14} aria-hidden />
                  {a.kind}
                </p>
                <h4 className="mt-1.5 font-medium leading-snug text-ink">{a.title}</h4>
                <p className="mt-1 text-sm text-ink-dim">
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
                {a.description && <p className="mt-2 text-sm text-ink-dim">{a.description}</p>}
                {a.credentialUrl && (
                  <a href={a.credentialUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-ink underline-offset-4 hover:underline">
                    Verify credential <ArrowUpRight size={14} aria-hidden />
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
