import { Briefcase } from "lucide-react";
import { useContent } from "../../content/useContent";
import { Section } from "../components/Section";
import { Timeline, TimelineRow } from "../components/Timeline";
import { Chip } from "../components/Chip";
import { EmptyState } from "../components/EmptyState";
import { byNewest, formatRange } from "../format";

export function Experience() {
  const { experience } = useContent();
  const rows = [...experience].sort(byNewest);
  return (
    <Section id="experience" title="Experience">
      {rows.length === 0 ? (
        <EmptyState icon={Briefcase} title="No experience listed yet" why="Work and internship entries appear here once they are added to src/content/data/experience.ts." />
      ) : (
        <div className="panel px-5 sm:px-7">
          <Timeline label="Work experience">
            {rows.map((e) => (
              <TimelineRow key={e.id} date={formatRange(e.start, e.end)} title={`${e.role} · ${e.organisation}`} subtitle={e.location}>
                <p className="max-w-[var(--measure)] text-ink-dim">{e.summary}</p>
                {e.outcomes.length > 0 && (
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-ink-dim marker:text-ink-faint">
                    {e.outcomes.map((o) => (
                      <li key={o}>{o}</li>
                    ))}
                  </ul>
                )}
                {e.skillsGained.length > 0 && (
                  <ul className="mt-4 flex flex-wrap gap-2" aria-label="Skills gained">
                    {e.skillsGained.map((s) => (
                      <li key={s}>
                        <Chip>{s}</Chip>
                      </li>
                    ))}
                  </ul>
                )}
              </TimelineRow>
            ))}
          </Timeline>
        </div>
      )}
    </Section>
  );
}
