import { ArrowUpRight, Gamepad2 } from "lucide-react";
import { Link } from "react-router";
import { useContent } from "../../content/useContent";
import { Section } from "../components/Section";
import { SECTIONS, sectionNumber } from "../nav-items";
import { WORLDS } from "../../play/worlds";
import { formatMonth } from "../format";

// About: the story and the key facts in one panel, and a magazine-style table of
// contents beside it (numbered links to every section, plus the Realm).
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
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="panel p-6 sm:p-8 lg:col-span-7">
          <div className="max-w-[var(--measure)] space-y-5 text-[length:var(--step-1)] leading-relaxed text-ink-dim">
            {profile.about.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
          <dl className="mt-8 grid gap-px overflow-hidden rounded-[14px] border border-line bg-line sm:grid-cols-2">
            {facts.map((f) => (
              <div key={f.term} className="bg-surface-1 p-4">
                <dt className="eyebrow">{f.term}</dt>
                <dd className="mt-1.5 text-ink">{f.detail}</dd>
              </div>
            ))}
          </dl>
        </div>

        <nav aria-label="On this page" className="panel relative flex flex-col overflow-hidden p-6 sm:p-8 lg:col-span-5">
          <p className="eyebrow">Table of contents</p>
          <ol className="mt-3 grid grid-cols-1 gap-x-6 sm:grid-cols-2">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="group flex items-baseline gap-3 border-b border-line py-3 transition-ui hover:border-primary">
                  <span className="tabular font-mono text-xs text-ink-faint transition-ui group-hover:text-primary-text">{sectionNumber(s.id)}</span>
                  <span className="text-lux text-[1.3rem] text-ink transition-ui group-hover:text-primary-text">{s.label}</span>
                  <ArrowUpRight size={14} aria-hidden className="ml-auto self-center text-ink-faint transition-ui group-hover:text-primary-text" />
                </a>
              </li>
            ))}
          </ol>
          <Link to="/play" className="group mt-6 flex flex-1 flex-col overflow-hidden rounded-[16px] border border-line-strong bg-surface-2 transition-ui hover:border-primary lg:mt-auto lg:flex-none">
            {/* Each image zooms inside its own clipped cell, so the title below is never covered. */}
            <span aria-hidden className="grid h-36 shrink-0 grid-cols-3 gap-px overflow-hidden bg-line">
              {WORLDS.map((w) => (
                <span key={w.id} className="block overflow-hidden">
                  <img src={`/art/${w.card}-600.webp`} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.2,0,0,1)] group-hover:scale-105" />
                </span>
              ))}
            </span>
            <span className="flex items-center gap-3 p-4">
              <span className="min-w-0">
                <span className="flex items-center gap-2 font-medium text-ink">
                  <Gamepad2 size={16} aria-hidden className="text-primary-text" />
                  The Developer&apos;s Realm
                </span>
                <span className="mt-0.5 block text-sm text-ink-dim">This CV as {WORLDS.length} explorable worlds</span>
              </span>
              <ArrowUpRight size={16} aria-hidden className="ml-auto shrink-0 text-ink-faint transition-ui group-hover:text-primary-text" />
            </span>
          </Link>
        </nav>
      </div>
    </Section>
  );
}
