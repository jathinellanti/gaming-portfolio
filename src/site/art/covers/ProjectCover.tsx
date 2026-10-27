import type { ComponentType } from "react";
import type { Project } from "../../../content/schema";
import { ElmsCover } from "./ElmsCover";
import { GenerativeCover } from "./GenerativeCover";
import { WeatherCover } from "./WeatherCover";

// Project cover: a designed illustration of what the project does (after app/UI
// shots on Pinterest and Dribbble), always labelled as one. Real screenshots, where
// a project has them, live in the project page's Screens gallery instead.
const ART: Record<string, ComponentType> = {
  "weather-information-system": WeatherCover,
  "employee-leave-management": ElmsCover,
};

export function ProjectCover({ project }: { project: Project }) {
  const Art = ART[project.slug];
  return (
    <div className="relative isolate aspect-[16/10] w-full overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface-1 shadow-[var(--shadow-2)] [container-type:inline-size]">
      {Art ? (
        <Art />
      ) : (
        <div aria-hidden className="absolute inset-0">
          <GenerativeCover seed={project.slug} title={project.title} />
        </div>
      )}
      <span className="absolute right-3 top-3 rounded-full bg-black/55 px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider text-white/90 backdrop-blur">Illustration</span>
    </div>
  );
}
