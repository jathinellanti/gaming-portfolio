import { useMemo } from "react";
import { Link } from "react-router";
import { ArrowUpRight } from "lucide-react";
import { useContent } from "../../../../content/useContent";
import { GuiWindow, Slot, useTooltip } from "../Window";
import { buildRecipes } from "../../content";
import { projectIcon, skillIcon } from "../itemIcons";
import { useBlock } from "../../store";
import { CONTEXT_LABEL } from "../../../../site/evidence";
import { formatMonth } from "../../../../site/format";

// The Crafting Hall: every project is a recipe whose ingredients are its real stack.
export function CraftingScreen() {
  const content = useContent();
  const recipes = useMemo(() => buildRecipes(content), [content]);
  const arg = useBlock((s) => s.screenArg);
  const open = useBlock((s) => s.open);
  const { bind, node } = useTooltip();
  const current = recipes.find((r) => r.project.slug === arg) ?? recipes[0];

  if (!current)
    return (
      <GuiWindow title="Crafting Hall" width={460}>
        <p>The recipe book is empty: projects appear here as soon as they're added to the portfolio.</p>
      </GuiWindow>
    );

  const p = current.project;
  return (
    <GuiWindow title="Crafting Hall: Projects" width={720}>
      <div className="grid gap-4 md:grid-cols-[200px_1fr]">
        <nav aria-label="Recipe book" className="rounded border-2 border-[#8b8b8b] bg-[#b4b4b4] p-2">
          <p className="mb-2 text-sm font-semibold">Recipe Book</p>
          <ul className="space-y-1">
            {recipes.map((r) => (
              <li key={r.project.slug}>
                <button
                  type="button"
                  className="jc-btn is-wide"
                  style={{ justifyContent: "flex-start", fontSize: 14, minHeight: 44, padding: "6px 10px", background: r === current ? "#8a91c4" : undefined }}
                  aria-current={r === current}
                  onClick={() => open("crafting", r.project.slug)}
                >
                  <img src={projectIcon(r.project.slug)} alt="" width={24} height={24} style={{ imageRendering: "pixelated" }} />
                  <span className="text-left leading-tight">{r.project.title}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <section aria-label={`Recipe: ${p.title}`}>
          <div className="flex flex-wrap items-center gap-4">
            <div className="grid grid-cols-3" role="list" aria-label="Ingredients">
              {current.grid.map((s, i) => (
                <div role="listitem" key={i}>
                  {s ? <Slot icon={skillIcon(s.id, s.name)} label={s.name} tip={bind({ title: s.name, lines: [{ text: "Ingredient" }] })} /> : <Slot label="" />}
                </div>
              ))}
            </div>
            <svg width="44" height="30" viewBox="0 0 22 15" aria-hidden style={{ imageRendering: "pixelated" }}>
              <path d="M0 5h12V0l10 7.5L12 15v-5H0z" fill="#8b8b8b" stroke="#373737" strokeWidth="1" />
            </svg>
            <Slot icon={projectIcon(p.slug)} label={`Result: ${p.title}`} count={1} tip={bind({ title: p.title, titleClass: "accent", lines: [{ text: CONTEXT_LABEL[p.context] }, { text: formatMonth(p.start) }] })} />
          </div>

          <h3 className="mt-4 text-lg">{p.title}</h3>
          <p className="text-sm opacity-80">
            {CONTEXT_LABEL[p.context]} · {p.role} · {formatMonth(p.start)}
          </p>
          <p className="mt-2 text-[15px] leading-snug">{p.summary}</p>
          <ul className="mt-2 list-disc space-y-0.5 pl-5 text-[15px]">
            {p.features.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link to={`/projects/${p.slug}`} className="jc-btn" style={{ fontSize: 15 }}>
              Read the case study
            </Link>
            {p.links.repo && (
              <a href={p.links.repo} target="_blank" rel="noopener noreferrer" className="jc-btn" style={{ fontSize: 15 }}>
                Source code <ArrowUpRight size={14} aria-hidden />
                <span className="sr-only">(opens GitHub in a new tab)</span>
              </a>
            )}
          </div>
        </section>
      </div>
      {node}
    </GuiWindow>
  );
}
