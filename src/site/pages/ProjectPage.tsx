import { Link, useParams } from "react-router";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { useContent } from "../../content/useContent";
import { skillById } from "../../content/model";
import { PageMeta } from "../meta";
import { ButtonA } from "../components/Button";
import { Chip } from "../components/Chip";
import { StackMosaic } from "../components/StackMosaic";
import { BRANDS, BrandIcon } from "../components/BrandIcon";
import { CONTEXT_LABEL } from "../evidence";
import { formatRange } from "../format";
import { NotFound } from "./NotFound";

export function ProjectPage() {
  const { slug } = useParams();
  const content = useContent();
  const index = content.projects.findIndex((p) => p.slug === slug);
  const project = content.projects[index];
  if (!project) return <NotFound title="Project not found" body="There's no project at this address. It may have been renamed." />;

  const next = content.projects[(index + 1) % content.projects.length];
  const stack = project.tech.map((t) => skillById(content, t)).filter((s) => s !== undefined);
  const facts = [
    { k: "Role", v: project.role },
    { k: "Type", v: CONTEXT_LABEL[project.context] },
    { k: "When", v: formatRange(project.start, project.end).replace(" – Present", "") },
    ...(project.status ? [{ k: "Status", v: project.status }] : []),
    ...(project.links.repo ? [{ k: "Code", v: "Public on GitHub" }] : []),
  ];

  return (
    <article className="mx-auto max-w-[1200px] px-4 pb-24 pt-8 sm:px-6 lg:px-8">
      <PageMeta title={project.title} description={project.summary} />
      <Link to="/#projects" className="inline-flex items-center gap-2 rounded-md py-2 text-sm text-ink-dim transition-ui hover:text-ink">
        <ArrowLeft size={15} aria-hidden />
        All projects
      </Link>

      <header className="mt-8 grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-end">
        <div>
          <p className="eyebrow">Case study</p>
          <h1 className="text-display mt-4 text-[length:var(--step-4)] leading-[0.98] text-ink">{project.title}</h1>
          <p className="mt-6 max-w-[52ch] text-[length:var(--step-1)] text-ink-dim">{project.summary}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            {project.links.repo && (
              <ButtonA href={project.links.repo} target="_blank" rel="noopener noreferrer" variant="primary">
                <BrandIcon icon={BRANDS.github} size={16} />
                View source
                <span className="sr-only">(opens GitHub in a new tab)</span>
              </ButtonA>
            )}
            {project.links.live && (
              <ButtonA href={project.links.live} target="_blank" rel="noopener noreferrer" variant="secondary">
                Live demo <ArrowUpRight size={15} aria-hidden />
                <span className="sr-only">(opens in a new tab)</span>
              </ButtonA>
            )}
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line [&>*:last-child:nth-child(odd)]:col-span-2">
          {facts.map((f) => (
            <div key={f.k} className="bg-surface-1 p-5">
              <dt className="eyebrow">{f.k}</dt>
              <dd className="mt-2 text-ink">{f.v}</dd>
            </div>
          ))}
        </dl>
      </header>

      <div className="mt-14">
        {project.images.length > 0 ? (
          <ul className="grid gap-4 md:grid-cols-2">
            {project.images.map((img) => (
              <li key={img.src}>
                <img src={img.src} alt={img.alt} width={img.width} height={img.height} loading="lazy" decoding="async" className="w-full rounded-[var(--radius-card)] border border-line" />
              </li>
            ))}
          </ul>
        ) : (
          <div className="mx-auto max-w-[720px]">
            <StackMosaic project={project} />
          </div>
        )}
      </div>

      <div className="mt-16 grid gap-12 md:grid-cols-[200px_1fr] md:gap-8">
        <p className="eyebrow">Overview</p>
        <div className="max-w-[var(--measure)] space-y-5 text-[length:var(--step-1)] leading-relaxed text-ink-dim">
          {project.description.map((d) => (
            <p key={d}>{d}</p>
          ))}
        </div>

        <p className="eyebrow">What it does</p>
        <ul className="max-w-[var(--measure)] space-y-2 text-ink">
          {project.features.map((f) => (
            <li key={f} className="flex gap-3">
              <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-primary" />
              {f}
            </li>
          ))}
        </ul>

        <p className="eyebrow">My contribution</p>
        <div className="max-w-[var(--measure)] text-ink-dim">
          {project.contribution.length > 0 ? (
            <ul className="space-y-2">
              {project.contribution.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          ) : (
            <p>Team project. Individual contribution details coming soon.</p>
          )}
        </div>

        <p className="eyebrow">Stack</p>
        <ul className="flex flex-wrap gap-2">
          {stack.map((s) => (
            <li key={s.id}>
              <Chip>{s.name}</Chip>
            </li>
          ))}
        </ul>
      </div>

      {next && next.slug !== project.slug && (
        <Link
          to={`/projects/${next.slug}`}
          className="group mt-24 flex items-center justify-between gap-6 border-t border-line pt-8 transition-ui"
        >
          <span>
            <span className="eyebrow block">Next project</span>
            <span className="text-display mt-2 block text-[length:var(--step-3)] text-ink">{next.title}</span>
          </span>
          <ArrowRight size={28} aria-hidden className="shrink-0 text-ink-dim transition-ui group-hover:translate-x-1 group-hover:text-primary-text" />
        </Link>
      )}
    </article>
  );
}
