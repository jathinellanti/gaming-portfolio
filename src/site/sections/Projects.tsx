import { Link } from "react-router";
import { ArrowRight, ArrowUpRight, FolderGit2 } from "lucide-react";
import { useContent } from "../../content/useContent";
import { skillById } from "../../content/model";
import type { Project } from "../../content/schema";
import { Section } from "../components/Section";
import { Chip } from "../components/Chip";
import { EmptyState } from "../components/EmptyState";
import { StackMosaic } from "../components/StackMosaic";
import { CONTEXT_LABEL } from "../evidence";
import { formatMonth } from "../format";

function ProjectVisual({ project }: { project: Project }) {
  const img = project.images[0];
  if (!img) return <StackMosaic project={project} />;
  return (
    <img
      src={img.src}
      alt={img.alt}
      width={img.width}
      height={img.height}
      loading="lazy"
      decoding="async"
      className="aspect-[16/10] w-full rounded-[var(--radius-card)] border border-line object-cover"
    />
  );
}

function ProjectRow({ project, index }: { project: Project; index: number }) {
  const content = useContent();
  const stack = project.tech.map((t) => skillById(content, t)).filter((s) => s !== undefined);
  return (
    <li className="group grid items-center gap-8 border-t border-line py-10 first:border-t-0 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
      <Link to={`/projects/${project.slug}`} tabIndex={-1} aria-hidden className="block transition-ui group-hover:-translate-y-0.5">
        <ProjectVisual project={project} />
      </Link>
      <div>
        <p className="eyebrow tabular">
          <span className="text-primary-text">{String(index + 1).padStart(2, "0")}</span> · {formatMonth(project.start)}
        </p>
        <h3 className="text-display mt-3 text-[length:var(--step-3)] text-ink">
          <Link to={`/projects/${project.slug}`} className="underline-offset-[6px] decoration-1 transition-ui hover:underline">
            {project.title}
          </Link>
        </h3>
        <div className="mt-3 flex flex-wrap gap-2">
          <Chip tone="neutral">{CONTEXT_LABEL[project.context]}</Chip>
          <Chip tone="neutral">{project.role}</Chip>
        </div>
        <p className="mt-4 max-w-[56ch] text-ink-dim">{project.summary}</p>
        <ul className="mt-4 space-y-1.5 text-sm text-ink-dim">
          {project.features.slice(0, 3).map((f) => (
            <li key={f} className="flex gap-2">
              <span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-ink-faint" />
              {f}
            </li>
          ))}
        </ul>
        <ul className="mt-5 flex flex-wrap gap-1.5" aria-label="Tech stack">
          {stack.map((s) => (
            <li key={s.id}>
              <Chip>{s.name}</Chip>
            </li>
          ))}
        </ul>
        <div className="mt-6 flex flex-wrap items-center gap-5 text-sm font-medium">
          <Link to={`/projects/${project.slug}`} className="inline-flex items-center gap-1.5 text-ink underline-offset-4 transition-ui hover:text-primary-text hover:underline">
            Read the case study <ArrowRight size={15} aria-hidden />
          </Link>
          {project.links.repo && (
            <a href={project.links.repo} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-ink-dim underline-offset-4 transition-ui hover:text-ink hover:underline">
              Source code <ArrowUpRight size={15} aria-hidden />
              <span className="sr-only">(opens GitHub in a new tab)</span>
            </a>
          )}
          {project.links.live && (
            <a href={project.links.live} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-ink-dim underline-offset-4 transition-ui hover:text-ink hover:underline">
              Live demo <ArrowUpRight size={15} aria-hidden />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          )}
        </div>
      </div>
    </li>
  );
}

export function Projects() {
  const { projects } = useContent();
  return (
    <Section id="projects" title="Selected projects" lead="Real repositories, described from their code.">
      {projects.length === 0 ? (
        <EmptyState icon={FolderGit2} title="No projects published yet" why="Projects appear here once they are added to src/content/data/projects.ts." />
      ) : (
        <ol aria-label="Projects">
          {projects.map((p, i) => (
            <ProjectRow key={p.slug} project={p} index={i} />
          ))}
        </ol>
      )}
    </Section>
  );
}
