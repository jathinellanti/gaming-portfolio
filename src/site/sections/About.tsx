import { useContent } from "../../content/useContent";
import { Section } from "../components/Section";
import { formatMonth } from "../format";

export function About() {
  const { profile, education, experience, achievements } = useContent();
  const degree = education[0];
  const latestRole = experience[0];
  const cert = achievements.find((a) => a.kind === "certification");
  const facts: { term: string; detail: string }[] = [
    { term: "Based in", detail: profile.location },
    ...(degree ? [{ term: "Education", detail: `${degree.programme}, ${degree.institution}${degree.result ? ` · ${degree.result.label} ${degree.result.value}` : ""}` }] : []),
    ...(cert ? [{ term: "Certified", detail: `${cert.title}, ${cert.issuer}` }] : []),
    ...(latestRole ? [{ term: "Experience", detail: `${latestRole.role}, ${latestRole.organisation} (${formatMonth(latestRole.start)})` }] : []),
  ];
  return (
    <Section id="about" title="Engineer by training, game developer by direction.">
      <div className="grid gap-10 md:grid-cols-[200px_1fr] md:gap-8">
        <div aria-hidden className="hidden md:block" />
        <div className="grid gap-12 lg:grid-cols-[1.25fr_1fr]">
          <div className="max-w-[var(--measure)] space-y-5 text-[length:var(--step-1)] leading-relaxed text-ink-dim">
            {profile.about.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
          <dl className="divide-y divide-line self-start border-y border-line">
            {facts.map((f) => (
              <div key={f.term} className="grid grid-cols-[110px_1fr] gap-4 py-4">
                <dt className="eyebrow pt-0.5">{f.term}</dt>
                <dd className="text-ink">{f.detail}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </Section>
  );
}
