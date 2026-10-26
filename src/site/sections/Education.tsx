import { useContent } from "../../content/useContent";
import { Section } from "../components/Section";
import { Timeline, TimelineRow } from "../components/Timeline";
import { byNewest, formatRange } from "../format";

export function Education() {
  const { education } = useContent();
  const rows = [...education].sort(byNewest);
  return (
    <Section id="education" title="Education">
      <Timeline label="Education history">
        {rows.map((e) => (
          <TimelineRow
            key={e.id}
            date={formatRange(e.start, e.end)}
            title={e.programme}
            subtitle={`${e.institution} · ${e.location}`}
            aside={
              e.result && (
                <span className="rounded-full border border-line-strong px-3 py-0.5 font-mono text-sm text-ink">
                  <span className="text-ink-dim">{e.result.label}</span> <span className="tabular">{e.result.value}</span>
                </span>
              )
            }
          />
        ))}
      </Timeline>
    </Section>
  );
}
