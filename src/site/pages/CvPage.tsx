import { Printer } from "lucide-react";
import { useContent } from "../../content/useContent";
import { SKILL_CATEGORIES, SKILL_CATEGORY_LABELS, skillById } from "../../content/model";
import { PageMeta } from "../meta";
import { Button } from "../components/Button";
import { CvLink } from "../components/CvLink";
import { CONTEXT_LABEL } from "../evidence";
import { byNewest, formatMonth, formatRange } from "../format";

function CvSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="print-avoid-break border-t border-line pt-5" aria-label={title}>
      <h2 className="eyebrow text-ink">{title}</h2>
      <div className="mt-4 space-y-5">{children}</div>
    </section>
  );
}

function Entry({ title, meta, date, children }: { title: string; meta: string; date: string; children?: React.ReactNode }) {
  return (
    <div className="print-avoid-break">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
        <h3 className="font-medium text-ink">{title}</h3>
        <p className="tabular font-mono text-sm text-ink-dim">{date}</p>
      </div>
      <p className="text-ink-dim">{meta}</p>
      {children && <div className="mt-1.5 text-[0.95rem] text-ink-dim">{children}</div>}
    </div>
  );
}

export function CvPage() {
  const content = useContent();
  const { profile, education, experience, skills, projects, achievements } = content;
  return (
    <div className="mx-auto max-w-[880px] px-4 py-10 sm:px-6 lg:py-16">
      <PageMeta title="CV" description={`Curriculum vitae of ${profile.name}, ${profile.title}.`} />
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="eyebrow">Curriculum vitae</p>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => window.print()}>
            <Printer size={15} aria-hidden />
            Print / Save as PDF
          </Button>
          <CvLink variant="primary" size="sm" hideWhenMissing />
        </div>
      </div>

      <article className="space-y-8 rounded-[var(--radius-card)] border border-line bg-surface-1 p-6 shadow-[var(--shadow-2)] sm:p-10 print:border-0 print:p-0 print:shadow-none">
        <header>
          <h1 className="text-display text-[length:var(--step-4)] text-ink">{profile.name}</h1>
          <p className="mt-2 text-[length:var(--step-1)] text-ink">
            {profile.title}
            {profile.subtitle && <span className="text-ink-dim"> · {profile.subtitle}</span>}
          </p>
          <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-sm text-ink-dim">
            <a href={`mailto:${profile.email}`} className="underline-offset-4 hover:underline">
              {profile.email}
            </a>
            <span aria-hidden>·</span>
            <a href={profile.links.github} className="underline-offset-4 hover:underline">
              {profile.links.github.replace("https://", "")}
            </a>
            {profile.links.linkedin && (
              <>
                <span aria-hidden>·</span>
                <a href={profile.links.linkedin} className="underline-offset-4 hover:underline">
                  LinkedIn
                </a>
              </>
            )}
            <span aria-hidden>·</span>
            <span>{profile.location}</span>
          </p>
        </header>

        <CvSection title="Profile">
          <p className="text-ink-dim">{profile.intro}</p>
        </CvSection>

        <CvSection title="Education">
          {[...education].sort(byNewest).map((e) => (
            <Entry key={e.id} title={e.programme} meta={`${e.institution}, ${e.location}${e.result ? ` · ${e.result.label}: ${e.result.value}` : ""}`} date={formatRange(e.start, e.end)} />
          ))}
        </CvSection>

        {experience.length > 0 && (
          <CvSection title="Experience">
            {[...experience].sort(byNewest).map((e) => (
              <Entry key={e.id} title={`${e.role}, ${e.organisation}`} meta={e.location} date={formatRange(e.start, e.end)}>
                <p>{e.summary}</p>
              </Entry>
            ))}
          </CvSection>
        )}

        <CvSection title="Skills">
          <dl className="grid gap-2 sm:grid-cols-[190px_1fr]">
            {SKILL_CATEGORIES.map((c) => {
              const items = skills.filter((s) => s.category === c);
              if (items.length === 0) return null;
              return (
                <div key={c} className="contents">
                  <dt className="text-sm font-medium text-ink">{SKILL_CATEGORY_LABELS[c]}</dt>
                  <dd className="text-sm text-ink-dim">{items.map((s) => s.name).join(", ")}</dd>
                </div>
              );
            })}
          </dl>
        </CvSection>

        {projects.length > 0 && (
          <CvSection title="Projects">
            {projects.map((p) => (
              <Entry
                key={p.slug}
                title={p.title}
                meta={`${CONTEXT_LABEL[p.context]} · ${p.tech.map((t) => skillById(content, t)?.name ?? t).join(", ")}`}
                date={formatMonth(p.start)}
              >
                <p>{p.summary}</p>
                {p.links.repo && <p className="mt-1 font-mono text-xs">{p.links.repo.replace("https://", "")}</p>}
              </Entry>
            ))}
          </CvSection>
        )}

        {achievements.length > 0 && (
          <CvSection title="Certifications">
            {achievements.map((a) => (
              <Entry key={a.id} title={a.title} meta={a.issuer} date={a.date ? formatMonth(a.date) : ""} />
            ))}
          </CvSection>
        )}
      </article>
    </div>
  );
}
