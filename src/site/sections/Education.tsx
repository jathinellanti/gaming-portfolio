import { useContent } from "../../content/useContent";
import { Section } from "../components/Section";
import { Timeline, TimelineRow } from "../components/Timeline";
import { byNewest, formatRange } from "../format";
import { Certifications } from "./Certifications";

// Education and certifications side by side, like a CV's credentials block.
// Certifications keeps its own <section id="certifications"> for the nav and anchors.
export function Education() {
  const { education } = useContent();
  const rows = [...education].sort(byNewest);
  return (
    <Section id="education" title="Education & certifications">
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="panel px-5 sm:px-7 lg:col-span-8">
          <Timeline label="Education history">
            {rows.map((e) => (
              <TimelineRow
                key={e.id}
                date={formatRange(e.start, e.end)}
                title={e.programme}
                subtitle={`${e.institution} · ${e.location}`}
                aside={
                  e.result && (
                    <span className="rounded-full border border-line-strong bg-bg px-3 py-0.5 font-mono text-sm text-ink">
                      <span className="text-ink-dim">{e.result.label}</span> <span className="tabular">{e.result.value}</span>
                    </span>
                  )
                }
              />
            ))}
          </Timeline>
        </div>
        <div className="lg:col-span-4">
          <Certifications />
        </div>
      </div>
    </Section>
  );
}
