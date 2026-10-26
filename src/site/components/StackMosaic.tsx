import { ImageOff } from "lucide-react";
import { useContent } from "../../content/useContent";
import { skillById } from "../../content/model";
import type { Project } from "../../content/schema";
import { SkillIcon } from "./BrandIcon";

// Cover for a project with no screenshots: a window frame carrying the real repo
// path, the title and the real stack. Honestly labelled, never a fake UI mock.
// Replaced automatically once the project has `images`.
export function StackMosaic({ project }: { project: Project }) {
  const content = useContent();
  const stack = project.tech.map((t) => skillById(content, t)).filter((s) => s !== undefined);
  const repoPath = project.links.repo?.replace(/^https:\/\/github\.com\//, "") ?? project.slug;
  return (
    <div className="relative isolate flex aspect-[16/10] w-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface-2 shadow-[var(--shadow-2)]">
      <div className="flex h-9 shrink-0 items-center gap-2 border-b border-line bg-surface-1 px-3">
        <span aria-hidden className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-surface-3" />
          <span className="size-2.5 rounded-full bg-surface-3" />
          <span className="size-2.5 rounded-full bg-surface-3" />
        </span>
        <span className="ml-2 truncate font-mono text-xs text-ink-faint">{repoPath}</span>
      </div>
      <div className="relative flex flex-1 flex-col justify-between p-5 sm:p-7">
        <div aria-hidden className="absolute inset-0 -z-10 opacity-60 [background-image:linear-gradient(var(--border)_1px,transparent_1px),linear-gradient(90deg,var(--border)_1px,transparent_1px)] [background-size:32px_32px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
        <div aria-hidden className="absolute -right-10 -top-24 -z-10 size-72 rounded-full bg-primary-soft blur-3xl" />
        <p aria-hidden className="text-display max-w-[14ch] text-[clamp(1.6rem,3.2vw,2.6rem)] leading-[1] text-ink">
          {project.title}
        </p>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <ul className="flex flex-wrap gap-1.5" aria-label={`${project.title} stack`}>
            {stack.map((s) => (
              <li key={s.id} title={s.name} className="grid size-9 place-items-center rounded-[10px] border border-line bg-surface-1 text-ink-dim">
                <SkillIcon id={s.id} name={s.name} size={17} />
                <span className="sr-only">{s.name}</span>
              </li>
            ))}
          </ul>
          <p className="flex items-center gap-1.5 text-xs text-ink-faint">
            <ImageOff size={13} aria-hidden />
            Screenshots coming soon
          </p>
        </div>
      </div>
    </div>
  );
}
