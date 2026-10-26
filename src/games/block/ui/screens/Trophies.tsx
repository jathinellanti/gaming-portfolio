import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { useContent } from "../../../../content/useContent";
import { GuiWindow, Slot, useTooltip } from "../Window";
import { TROPHY_FRAMES } from "../../world/structures";
import { medalIcon, skillIcon } from "../itemIcons";
import { useBlock } from "../../store";
import { formatMonth } from "../../../../site/format";

// Hall of Trophies: one frame per certification/achievement; spare frames stay honest.
export function TrophiesScreen() {
  const { achievements } = useContent();
  const arg = useBlock((s) => s.screenArg);
  const [sel, setSel] = useState(typeof arg === "number" ? arg : 0);
  const { bind, node } = useTooltip();
  const a = achievements[sel];

  return (
    <GuiWindow title="Hall of Trophies" width={520}>
      <div className="flex flex-wrap gap-2" role="list" aria-label="Trophy frames">
        {TROPHY_FRAMES.map((_, i) => {
          const item = achievements[i];
          const icon = item ? (item.issuer.startsWith("Unity") ? skillIcon("unity", "Unity") : medalIcon()) : undefined;
          return (
            <div role="listitem" key={i}>
              {item ? (
                <Slot icon={icon} label={item.title} pressed={sel === i} onClick={() => setSel(i)} tip={bind({ title: item.title, titleClass: "gold", lines: [{ text: item.issuer }] })} />
              ) : (
                <button type="button" className="jc-slot" aria-label={`Empty frame ${i + 1}`} aria-pressed={sel === i} onClick={() => setSel(i)} />
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-3 min-h-[110px] rounded border-2 border-[#8b8b8b] bg-[#b4b4b4] p-3" aria-live="polite">
        {a ? (
          <>
            <p className="text-sm font-semibold text-[#6b4a00]">{a.kind === "certification" ? "Certification" : a.kind === "award" ? "Award" : "Milestone"}</p>
            <p className="text-lg">{a.title}</p>
            <p>{a.issuer}</p>
            <p className="text-sm opacity-80">{a.date ? formatMonth(a.date) : "Date not listed"}</p>
            {a.description && <p className="mt-1 text-[15px]">{a.description}</p>}
            {a.credentialUrl && (
              <a href={a.credentialUrl} target="_blank" rel="noopener noreferrer" className="jc-btn mt-2" style={{ fontSize: 14 }}>
                Verify credential <ArrowUpRight size={14} aria-hidden />
              </a>
            )}
          </>
        ) : (
          <p className="opacity-80">An empty frame, waiting for a future achievement. Nothing is hung here that hasn't been earned.</p>
        )}
      </div>
      {node}
    </GuiWindow>
  );
}
