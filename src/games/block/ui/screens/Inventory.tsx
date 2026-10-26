import { useMemo, useState } from "react";
import { useContent } from "../../../../content/useContent";
import { SKILL_CATEGORY_LABELS } from "../../../../content/model";
import type { Skill } from "../../../../content/schema";
import { GuiWindow, Slot, useTooltip } from "../Window";
import { INVENTORY_TABS } from "../../content";
import { blockIcon, skillIcon } from "../itemIcons";
import { PLACEABLE, blockDef } from "../../world/blocks";
import { useBlock } from "../../store";
import { evidenceLabel, openEvidence } from "../evidence";

// The Armory: a creative-style inventory of real skills, tabbed by category.
export function InventoryScreen() {
  const content = useContent();
  const [tab, setTab] = useState<(typeof INVENTORY_TABS)[number]["id"]>("all");
  const [selected, setSelected] = useState<Skill | null>(null);
  const hotbar = useBlock((s) => s.hotbar);
  const setHotbar = useBlock((s) => s.setHotbar);
  const { bind, node } = useTooltip();

  const items = useMemo(() => content.skills.filter((s) => tab === "all" || s.category === tab), [content.skills, tab]);
  const slots = Math.max(27, Math.ceil(items.length / 9) * 9);

  return (
    <GuiWindow title="The Armory: Skills" width={520}>
      <div role="tablist" aria-label="Skill categories" className="mb-3 flex flex-wrap gap-1">
        {INVENTORY_TABS.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} className="jc-btn" style={{ minHeight: 32, fontSize: 14, background: tab === t.id ? "#8a91c4" : undefined }} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="grid w-fit grid-cols-9 gap-0" role="list" aria-label="Skills">
        {Array.from({ length: slots }, (_, i) => {
          const s = items[i];
          if (!s) return <Slot key={i} label="" />;
          const evidence = s.evidence.map((e) => evidenceLabel(content, e));
          return (
            <div role="listitem" key={s.id}>
              <Slot
                icon={skillIcon(s.id, s.name)}
                label={s.name}
                pressed={selected?.id === s.id}
                onClick={() => setSelected(s)}
                tip={bind({
                  title: s.name,
                  titleClass: evidence.length ? "accent" : "",
                  lines: [{ text: SKILL_CATEGORY_LABELS[s.category] }, ...(evidence.length ? evidence.map((e) => ({ text: `Shown in: ${e}`, cls: "gold" })) : [{ text: "Listed on my CV" }])],
                })}
              />
            </div>
          );
        })}
      </div>

      <div className="mt-3 min-h-[86px] rounded border-2 border-[#8b8b8b] bg-[#b4b4b4] p-3 text-[15px]" aria-live="polite">
        {selected ? (
          <>
            <p className="font-semibold">
              {selected.name} <span className="font-normal opacity-75">· {SKILL_CATEGORY_LABELS[selected.category]}</span>
            </p>
            {selected.evidence.length ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {selected.evidence.map((e) => (
                  <button key={`${e.kind}-${e.id}`} type="button" className="jc-btn" style={{ minHeight: 32, fontSize: 14 }} onClick={() => openEvidence(content, e)}>
                    See it in: {evidenceLabel(content, e)}
                  </button>
                ))}
              </div>
            ) : (
              <p className="mt-1 opacity-80">Listed on my CV. No public project shows it yet.</p>
            )}
          </>
        ) : (
          <p className="opacity-80">Select a skill to see where I've used it.</p>
        )}
      </div>

      <p className="mt-3 text-sm">Hotbar: blocks you can build with (1–9 or scroll)</p>
      <div className="mt-1 grid w-fit grid-cols-9">
        {PLACEABLE.map((id, i) => (
          <Slot key={id} icon={blockIcon(id)} label={`Hotbar ${i + 1}: ${blockDef(id).name}`} pressed={hotbar === i} onClick={() => setHotbar(i)} tip={bind({ title: blockDef(id).name, lines: [{ text: `Hotbar slot ${i + 1}` }] })} />
        ))}
      </div>
      {node}
    </GuiWindow>
  );
}
