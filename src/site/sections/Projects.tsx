import { Link } from "react-router";
import { ArrowRight, ArrowUpRight, FolderGit2, Gamepad2 } from "lucide-react";
import { useContent } from "../../content/useContent";
import { skillById } from "../../content/model";
import type { Project } from "../../content/schema";
import { Section } from "../components/Section";
import { Chip } from "../components/Chip";
import { EmptyState } from "../components/EmptyState";
import { ProjectCover } from "../art/covers/ProjectCover";
import { CONTEXT_LABEL } from "../evidence";
import { formatMonth } from "../format";
import { WORLDS } from "../../play/worlds";

// Featured work: one card per project (showcase art, context, summary, stack, links),
// plus a card for the Realm, so the playable CV sits beside the real work.
function ProjectCard({ project, index }: { project: Project; index: number }) {
  const content = useContent();
  const stack = project.tech.map((t) => skillById(content, t)).filter((s) => s !== undefined);
  const shown = stack.slice(0, 5);
  return (
    <li className="group panel flex flex-col overflow-hidden transition-ui hover:-translate-y-1 hover:border-line-strong">
      <Link to={`/projects/${project.slug}`} tabIndex={-1} aria-hidden className="block p-2 pb-0">
        <ProjectCover project={project} />
      </Link>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <p className="eyebrow tabular flex flex-wrap items-center gap-x-2">
          <span className="text-primary-text">{String(index + 1).padStart(2, "0")}</span>
          <span aria-hidden>·</span>
          {formatMonth(project.start)}
          <span aria-hidden>·</span>
          {CONTEXT_LABEL[project.context]}
        </p>
        <h3 className="text-lux mt-3 text-[clamp(1.5rem,2.3vw,1.85rem)] leading-[1.1] text-ink">
          <Link to={`/projects/${project.slug}`} className="transition-ui hover:text-primary-text">
            {project.title}
          </Link>
        </h3>
        <p className="mt-1 text-sm text-ink-faint">{project.role}</p>
        <p className="mt-3 text-ink-dim">{project.summary}</p>
        <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Tech stack">
          {shown.map((s) => (
            <li key={s.id}>
              <Chip>{s.name}</Chip>
            </li>
          ))}
          {stack.length > shown.length && (
            <li>
              <Chip tone="neutral">+{stack.length - shown.length}</Chip>
            </li>
          )}
        </ul>
        <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-2 pt-6 text-sm font-medium">
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

function RealmCard() {
  const playable = WORLDS.filter((w) => w.status === "available").length;
  return (
    <li className="group panel relative flex flex-col overflow-hidden transition-ui hover:-translate-y-1 hover:border-primary">
      <div aria-hidden className="grid aspect-[16/10] grid-cols-3 gap-1.5 p-2 pb-0">
        {WORLDS.map((w) => (
          <div key={w.id} className="overflow-hidden rounded-[12px]">
            <img src={`/art/${w.card}-600.webp`} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.2,0,0,1)] group-hover:scale-[1.06]" />
          </div>
        ))}
      </div>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <p className="eyebrow flex items-center gap-2">
          <Gamepad2 size={14} aria-hidden className="text-primary-text" />
          {playable} of {WORLDS.length} worlds playable
        </p>
        <h3 className="text-lux mt-3 text-[clamp(1.5rem,2.3vw,1.85rem)] leading-[1.1] text-ink">
          <Link to="/play" className="transition-ui hover:text-primary-text">
            The Developer&apos;s Realm
          </Link>
        </h3>
        <p className="mt-1 text-sm text-ink-faint">This portfolio, as games</p>
        <p className="mt-3 text-ink-dim">The same CV as three explorable worlds: a block world, a neon megacity and a sunset open city.</p>
        <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Worlds">
          {WORLDS.map((w) => (
            <li key={w.id}>
              <Chip tone="neutral">{w.title}</Chip>
            </li>
          ))}
        </ul>
        <div className="mt-auto pt-6 text-sm font-medium">
          <Link to="/play" className="inline-flex items-center gap-1.5 text-ink underline-offset-4 transition-ui hover:text-primary-text hover:underline">
            Choose a world <ArrowRight size={15} aria-hidden />
          </Link>
        </div>
      </div>
    </li>
  );
}

export function Projects() {
  const { projects, profile } = useContent();
  return (
    <Section
      id="projects"
      title="Featured work"
      lead="Real repositories, described from their code."
      action={
        <a href={profile.links.github} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-medium text-ink-dim underline-offset-4 transition-ui hover:text-ink hover:underline">
          All on GitHub <ArrowUpRight size={14} aria-hidden />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      }
    >
      {projects.length === 0 ? (
        <EmptyState icon={FolderGit2} title="No projects published yet" why="Projects appear here once they are added to src/content/data/projects.ts." />
      ) : (
        <ol aria-label="Projects" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((p, i) => (
            <ProjectCard key={p.slug} project={p} index={i} />
          ))}
          <RealmCard />
        </ol>
      )}
    </Section>
  );
}
