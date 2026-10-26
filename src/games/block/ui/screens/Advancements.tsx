import { useMemo, useState } from "react";
import { useContent } from "../../../../content/useContent";
import type { SkillTreeNode } from "../../../../content/schema";
import { GuiWindow } from "../Window";
import { layoutAdvancements } from "../../content";
import { bookIcon, medalIcon, projectIcon } from "../itemIcons";
import { evidenceLabel, openEvidence } from "../evidence";

const COL_W = 150;
const ROW_H = 104;

function iconFor(n: SkillTreeNode) {
  const e = n.evidence[0];
  if (e.kind === "project") return projectIcon(e.id);
  if (e.kind === "achievement") return medalIcon();
  return bookIcon();
}

// The skill tree as an advancements board. Every node is backed by evidence.
export function AdvancementsScreen() {
  const content = useContent();
  const branches = useMemo(() => ["All", ...new Set(content.skillTree.map((n) => n.branch))], [content.skillTree]);
  const [branch, setBranch] = useState("All");
  const nodes = useMemo(() => layoutAdvancements(branch === "All" ? content.skillTree : content.skillTree.filter((n) => n.branch === branch)), [content.skillTree, branch]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = nodes.find((n) => n.node.id === selectedId)?.node ?? nodes[0]?.node;
  const pos = new Map(nodes.map((n) => [n.node.id, n]));
  const width = Math.max(1, ...nodes.map((n) => n.col + 1)) * COL_W + 20;
  const height = Math.max(1, ...nodes.map((n) => n.row + 1)) * ROW_H + 20;

  return (
    <GuiWindow title="Advancements: Skill Tree" width={760}>
      <div role="tablist" aria-label="Branches" className="mb-2 flex flex-wrap gap-1">
        {branches.map((b) => (
          <button key={b} type="button" role="tab" aria-selected={branch === b} className="jc-btn" style={{ minHeight: 32, fontSize: 14, background: branch === b ? "#8a91c4" : undefined }} onClick={() => setBranch(b)}>
            {b}
          </button>
        ))}
      </div>
      {nodes.length === 0 ? (
        <p>No advancements yet. Specialisations appear here once they're backed by a project, role or certificate.</p>
      ) : (
        <div className="jc-dirt overflow-auto rounded border-2 border-black p-2" style={{ maxHeight: 360 }}>
          <div className="relative" style={{ width, height }}>
            <svg className="absolute inset-0" width={width} height={height} aria-hidden>
              {nodes.flatMap((n) =>
                n.node.requires
                  .map((r) => pos.get(r))
                  .filter((p): p is NonNullable<typeof p> => !!p)
                  .map((p) => {
                    const x1 = p.col * COL_W + 32 + 26;
                    const y1 = p.row * ROW_H + 32;
                    const x2 = n.col * COL_W + 32 - 26;
                    const y2 = n.row * ROW_H + 32;
                    const mx = (x1 + x2) / 2;
                    return <path key={`${p.node.id}-${n.node.id}`} d={`M${x1} ${y1} H${mx} V${y2} H${x2}`} stroke="#fff" strokeWidth={3} fill="none" />;
                  }),
              )}
            </svg>
            {nodes.map((n) => (
              <button
                key={n.node.id}
                type="button"
                onClick={() => setSelectedId(n.node.id)}
                aria-pressed={selected?.id === n.node.id}
                className="absolute flex flex-col items-center gap-1 text-center"
                style={{ left: n.col * COL_W + 6, top: n.row * ROW_H + 6, width: 52 + 0 }}
              >
                <span
                  className="grid size-[52px] place-items-center"
                  style={{ background: "#c9a227", boxShadow: `inset 3px 3px 0 #fde68a, inset -3px -3px 0 #7a5a12, 0 0 0 2px #000${selected?.id === n.node.id ? ", 0 0 0 5px #fff" : ""}` }}
                >
                  <img src={iconFor(n.node)} alt="" width={32} height={32} style={{ imageRendering: "pixelated" }} />
                </span>
                <span className="w-[130px] text-[13px] leading-tight text-white" style={{ textShadow: "2px 2px 0 #000" }}>
                  {n.node.title}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
      {selected && (
        <div className="mt-3 rounded border-2 border-[#8b8b8b] bg-[#b4b4b4] p-3" aria-live="polite">
          <p className="text-sm font-semibold text-[#6b4a00]">Advancement made · {selected.branch}</p>
          <p className="text-lg">{selected.title}</p>
          <p className="text-[15px]">{selected.summary}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {selected.evidence.map((e) => (
              <button key={`${e.kind}-${e.id}`} type="button" className="jc-btn" style={{ minHeight: 32, fontSize: 14 }} onClick={() => openEvidence(content, e)}>
                Evidence: {evidenceLabel(content, e)}
              </button>
            ))}
          </div>
        </div>
      )}
    </GuiWindow>
  );
}
