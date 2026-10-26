import { useEffect, useRef, useState } from "react";
import { useContent } from "../../../content/useContent";
import { useBlock } from "../store";
import { runtime } from "../runtime";
import { B, PLACEABLE, blockDef } from "../world/blocks";
import { REGIONS } from "../world/structures";
import { blockIcon } from "./itemIcons";
import { sfx } from "../../../platform/audio";

const FACING = ["North (−Z)", "West (−X)", "South (+Z)", "East (+X)"];
const DISCOVERABLE = REGIONS.length - 1;

export function Hud({ locked, touch }: { locked: boolean; touch: boolean }) {
  const content = useContent();
  const hotbar = useBlock((s) => s.hotbar);
  const discovered = useBlock((s) => s.discovered);
  const toasts = useBlock((s) => s.toasts);
  const actionbar = useBlock((s) => s.actionbar);
  const title = useBlock((s) => s.title);
  const region = useBlock((s) => s.region);
  const debug = useBlock((s) => s.debug);
  const screen = useBlock((s) => s.screen);
  const chatLog = useBlock((s) => s.chatLog);
  const [, setTick] = useState(0);
  const [itemName, setItemName] = useState<{ text: string; until: number } | null>(null);
  const firstHotbar = useRef(true);

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 250);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (firstHotbar.current) {
      firstHotbar.current = false;
      return;
    }
    setItemName({ text: blockDef(PLACEABLE[hotbar]).name, until: performance.now() + 1500 });
    sfx("click");
  }, [hotbar]);

  const lastToast = useRef(0);
  useEffect(() => {
    const newest = toasts.at(-1)?.id ?? 0;
    if (newest > lastToast.current) sfx("toast");
    lastToast.current = newest;
  }, [toasts]);

  const now = performance.now();
  const showAction = actionbar && actionbar.until > now ? actionbar.text : itemName && itemName.until > now ? itemName.text : null;
  const showTitle = title && title.until > now ? title : null;
  const level = discovered.filter((d) => d !== "spawn").length;
  const b = runtime.body;
  const facing = FACING[((Math.round(runtime.yaw / (Math.PI / 2)) % 4) + 4) % 4];
  const boss = region === "dungeon" ? (content.caseStudies.length ? `${content.caseStudies.length} boss encounter${content.caseStudies.length > 1 ? "s" : ""}` : "The arena awaits its first challenger") : null;
  const recentChat = chatLog.slice(-4);

  return (
    <div className="pointer-events-none absolute inset-0 z-10" aria-hidden={screen !== null}>
      {screen === null && <div className="jc-crosshair" />}

      {boss && (
        <div className="absolute left-1/2 top-3 flex -translate-x-1/2 flex-col items-center gap-1">
          <p className="jc-text-shadow text-[15px]">{boss}</p>
          <div className="jc-bossbar">
            <span style={{ width: content.caseStudies.length ? "100%" : "0%" }} />
          </div>
        </div>
      )}

      {showTitle && (
        <div className="absolute inset-x-0 top-[28%] text-center" role="status">
          <p className="jc-text-shadow text-[clamp(28px,5vw,52px)] font-semibold" style={{ textShadow: "4px 4px 0 #3f3f3f" }}>
            {showTitle.title}
          </p>
          <p className="jc-text-shadow mt-1 text-[clamp(15px,2vw,22px)]">{showTitle.subtitle}</p>
        </div>
      )}

      <div className="absolute right-3 top-16 flex flex-col gap-2 sm:top-20" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className="jc-toast">
            <img src={blockIcon(B.GOLD_BLOCK)} alt="" width={32} height={32} style={{ imageRendering: "pixelated" }} />
            <div>
              <p className="text-[15px] text-[#ffff55]">{t.title}</p>
              <p className="text-[15px]">{t.body}</p>
            </div>
          </div>
        ))}
      </div>

      {debug && (
        <div className="jc-f3 absolute left-2 top-2 space-y-0.5 text-white">
          <p>Jathincraft · portfolio edition</p>
          <p>{Math.round(runtime.fps)} fps</p>
          <p>
            XYZ: {b.x.toFixed(2)} / {b.y.toFixed(2)} / {b.z.toFixed(2)}
          </p>
          <p>
            Block: {Math.floor(b.x)} {Math.floor(b.y)} {Math.floor(b.z)} · Chunk: {Math.floor(b.x / 16)} {Math.floor(b.z / 16)}
          </p>
          <p>Facing: {facing}</p>
          <p>Region: {region ?? "wilderness"}</p>
          <p>Time: {Math.round(runtime.time * 24000)} ticks</p>
          <p>
            Chunks: {runtime.manager?.stats().chunks ?? 0} · Worker: {runtime.manager?.stats().worker ? "on" : "off"}
          </p>
          {runtime.target && (
            <p>
              Targeted: {blockDef(runtime.targetBlock).name} @ {runtime.target.x} {runtime.target.y} {runtime.target.z}
            </p>
          )}
        </div>
      )}

      {screen === null && !locked && !touch && runtime.ready && (
        <div className="absolute inset-x-0 top-[58%] text-center">
          <p className="jc-text-shadow text-xl">Click to play</p>
          <p className="jc-text-shadow mt-1 text-sm text-white/85">Esc for the menu · M for the map · or use the CV button above</p>
        </div>
      )}

      {screen !== "chat" && recentChat.length > 0 && (
        <ul className="absolute bottom-[112px] left-2 space-y-0.5">
          {recentChat.map((l, i) => (
            <li key={i} className="jc-chatline text-[15px]" style={{ color: l.kind === "error" ? "#ff6b6b" : "#fff" }}>
              {l.text}
            </li>
          ))}
        </ul>
      )}

      <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1">
        {showAction && <p className="jc-text-shadow mb-1 text-center text-[16px]">{showAction}</p>}
        <p className="jc-level">{level}</p>
        <div className="jc-xp w-[396px] max-w-[92vw]" title="Regions discovered">
          <span style={{ width: `${(level / DISCOVERABLE) * 100}%` }} />
        </div>
        <div className="jc-hotbar">
          {PLACEABLE.map((id, i) => (
            <div key={id} className={`jc-hotslot${i === hotbar ? " is-active" : ""}`}>
              <img src={blockIcon(id)} alt="" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
