import { Swords } from "lucide-react";
import { useContent } from "../../../../content/useContent";
import { skillById } from "../../../../content/model";
import { GuiWindow } from "../Window";
import { useBlock } from "../../store";

// Boss encounters = verified technical case studies. With none published, the
// arena says so plainly instead of inventing a fight.
export function DungeonScreen() {
  const content = useContent();
  const open = useBlock((s) => s.open);
  const cases = content.caseStudies;

  return (
    <GuiWindow title="The Dungeon: Boss Encounters" width={640}>
      {cases.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <Swords size={40} aria-hidden />
          <p className="text-xl">The arena awaits its first challenger</p>
          <p className="max-w-[46ch] text-[15px]">
            Boss encounters here are real technical case studies: the problem, why it was hard, the strategy, the tools, and the outcome. None are published yet, and none will be
            invented.
          </p>
          <button type="button" className="jc-btn" onClick={() => open("crafting")}>
            See the projects instead
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {cases.map((c) => (
            <article key={c.id} className="rounded border-2 border-[#8b8b8b] bg-[#b4b4b4] p-3">
              <p className="text-center text-sm font-semibold">{c.title}</p>
              <div className="jc-bossbar mx-auto mt-1" aria-hidden>
                <span style={{ width: "100%" }} />
              </div>
              <dl className="mt-3 grid gap-2 text-[15px] sm:grid-cols-[120px_1fr]">
                <dt className="font-semibold">The Encounter</dt>
                <dd>{c.encounter}</dd>
                <dt className="font-semibold">The Challenge</dt>
                <dd>{c.challenge}</dd>
                <dt className="font-semibold">The Strategy</dt>
                <dd>
                  <ol className="list-decimal pl-5">
                    {c.strategy.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ol>
                </dd>
                <dt className="font-semibold">The Arsenal</dt>
                <dd>{c.arsenal.map((a) => skillById(content, a)?.name ?? a).join(", ")}</dd>
                <dt className="font-semibold">The Outcome</dt>
                <dd>{c.outcome}</dd>
              </dl>
            </article>
          ))}
        </div>
      )}
    </GuiWindow>
  );
}
