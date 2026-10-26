import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useContent } from "../../../../content/useContent";
import { GuiWindow } from "../Window";
import { useBlock } from "../../store";
import { runtime } from "../../runtime";
import { REGIONS, regionById, type Region } from "../../world/structures";
import { blockDef } from "../../world/blocks";
import { tileAverageColor } from "../../world/atlas";
import { runCommand, HELP_LINES } from "../commands";
import { useSettings } from "../../../../platform/settings";

export function travelTo(region: Region) {
  const st = useBlock.getState();
  st.requestTeleport([region.spawn[0], region.spawn[1], region.spawn[2], region.spawn[3]]);
  st.close();
  st.say(`Travelled to ${region.name}`);
}

// ---------------------------------------------------------------- Pause
export function PauseScreen() {
  const open = useBlock((s) => s.open);
  const close = useBlock((s) => s.close);
  const navigate = useNavigate();
  return (
    <div className="jc-screen" role="dialog" aria-modal="true" aria-labelledby="jc-pause-title">
      <div className="w-[min(420px,100%)]">
        <h2 id="jc-pause-title" className="jc-screen-title">
          Game Menu
        </h2>
        <div className="grid gap-2">
          <button type="button" className="jc-btn is-wide" onClick={close} data-autofocus>
            Back to Game
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" className="jc-btn" onClick={() => open("book")}>
              The Archive
            </button>
            <button type="button" className="jc-btn" onClick={() => open("inventory")}>
              Armory
            </button>
            <button type="button" className="jc-btn" onClick={() => open("advancements")}>
              Skill Tree
            </button>
            <button type="button" className="jc-btn" onClick={() => open("crafting")}>
              Projects
            </button>
            <button type="button" className="jc-btn" onClick={() => open("dungeon")}>
              Boss Encounters
            </button>
            <button type="button" className="jc-btn" onClick={() => open("trophies")}>
              Achievements
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" className="jc-btn" onClick={() => open("map")}>
              Map &amp; Fast Travel
            </button>
            <button type="button" className="jc-btn" onClick={() => open("options")}>
              Options…
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" className="jc-btn" onClick={() => open("exit")}>
              Contact
            </button>
            <button type="button" className="jc-btn" onClick={() => navigate("/cv")}>
              Open CV
            </button>
          </div>
          <button type="button" className="jc-btn is-wide" onClick={() => navigate("/")}>
            Save and Quit to Portfolio
          </button>
        </div>
        <p className="jc-text-shadow mt-4 text-center text-sm text-white/85">
          WASD move · Mouse/Arrows look · Space jump (double-tap: fly) · Shift sneak · Ctrl sprint · Left click break · Right click use/place · E skills · L skill tree · M map · T chat · F5 camera · F3 debug
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Options
export function OptionsScreen() {
  const s = useBlock();
  const sound = useSettings((x) => x.sound);
  const setSettings = useSettings((x) => x.set);
  const row = (label: string, value: string, input: React.ReactNode) => (
    <label className="grid gap-1">
      <span className="flex justify-between text-[15px]">
        <span>{label}</span>
        <span>{value}</span>
      </span>
      {input}
    </label>
  );
  return (
    <GuiWindow title="Options" width={460}>
      <div className="grid gap-4">
        {row("Render distance", `${s.renderDistance} chunks`, <input type="range" min={2} max={10} value={s.renderDistance} onChange={(e) => s.setOption({ renderDistance: Number(e.target.value) })} />)}
        {row("Field of view", `${s.fov}°`, <input type="range" min={50} max={110} value={s.fov} onChange={(e) => s.setOption({ fov: Number(e.target.value) })} />)}
        {row("Mouse sensitivity", `${Math.round(s.sensitivity * 100)}%`, <input type="range" min={20} max={300} value={Math.round(s.sensitivity * 100)} onChange={(e) => s.setOption({ sensitivity: Number(e.target.value) / 100 })} />)}
        {row("Day length", `${s.dayLengthMin} min`, <input type="range" min={2} max={60} value={s.dayLengthMin} onChange={(e) => s.setOption({ dayLengthMin: Number(e.target.value) })} />)}
        <label className="flex items-center justify-between text-[15px]">
          <span>Sound effects</span>
          <input type="checkbox" checked={sound} onChange={(e) => setSettings({ sound: e.target.checked })} />
        </label>
        <p className="text-sm opacity-80">Lower the render distance if the game stutters. Motion effects follow your system's reduced-motion setting.</p>
      </div>
    </GuiWindow>
  );
}

// ---------------------------------------------------------------- Map
const MARKER: Record<string, string> = { spawn: "#ffffff", archive: "#e0b04a", armory: "#9aa4b5", shrine: "#3ef0ff", crafting: "#c0603a", dungeon: "#7cbf3a", trophies: "#fcd34d", exit: "#3ef0ff" };

export function MapScreen() {
  const ref = useRef<HTMLCanvasElement>(null);
  const discovered = useBlock((s) => s.discovered);
  const open = useBlock((s) => s.open);
  const SIZE = 192;
  const SCALE = 2;

  useEffect(() => {
    const c = ref.current;
    const m = runtime.manager;
    if (!c || !m) return;
    const ctx = c.getContext("2d")!;
    const img = ctx.createImageData(SIZE, SIZE);
    const cx = Math.floor(runtime.body.x);
    const cz = Math.floor(runtime.body.z);
    for (let py = 0; py < SIZE; py++)
      for (let px = 0; px < SIZE; px++) {
        const x = cx + px - SIZE / 2;
        const z = cz + py - SIZE / 2;
        const top = m.surfaceY(x, z);
        const i = (py * SIZE + px) * 4;
        if (top === null) {
          img.data[i] = img.data[i + 1] = img.data[i + 2] = 40;
          img.data[i + 3] = 255;
          continue;
        }
        const id = m.getBlock(x, top - 1, z);
        const col = tileAverageColor(blockDef(id).top);
        const shade = 0.75 + ((top - 30) / 40) * 0.5;
        img.data[i] = Math.min(255, col.r * 255 * shade);
        img.data[i + 1] = Math.min(255, col.g * 255 * shade);
        img.data[i + 2] = Math.min(255, col.b * 255 * shade);
        img.data[i + 3] = 255;
      }
    ctx.putImageData(img, 0, 0);
    for (const r of REGIONS) {
      const mx = r.spawn[0] - cx + SIZE / 2;
      const mz = r.spawn[2] - cz + SIZE / 2;
      if (mx < 0 || mz < 0 || mx >= SIZE || mz >= SIZE) continue;
      ctx.fillStyle = "#000";
      ctx.fillRect(mx - 3, mz - 3, 6, 6);
      ctx.fillStyle = MARKER[r.id];
      ctx.fillRect(mx - 2, mz - 2, 4, 4);
    }
    // Player arrow
    ctx.save();
    ctx.translate(SIZE / 2, SIZE / 2);
    ctx.rotate(-runtime.yaw);
    ctx.fillStyle = "#ff3b3b";
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(4, 4);
    ctx.lineTo(-4, 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }, []);

  return (
    <GuiWindow title="Map & Fast Travel" width={720}>
      <div className="grid gap-4 md:grid-cols-[auto_1fr]">
        <canvas ref={ref} width={SIZE} height={SIZE} style={{ width: SIZE * SCALE, height: SIZE * SCALE, imageRendering: "pixelated", border: "3px solid #000" }} aria-label="Top-down map around you, with building markers" role="img" />
        <ul className="grid content-start gap-1.5" aria-label="Places">
          {REGIONS.map((r) => (
            <li key={r.id} className="flex items-center gap-2">
              <span aria-hidden className="size-3 shrink-0 border border-black" style={{ background: MARKER[r.id] }} />
              <span className="flex-1 text-[15px]">
                {r.name}
                {r.id !== "spawn" && !discovered.includes(r.id) && <span className="ml-1 text-xs opacity-70">(not visited)</span>}
              </span>
              <button type="button" className="jc-btn" style={{ minHeight: 30, fontSize: 13, padding: "0 8px" }} onClick={() => travelTo(r)}>
                Travel
              </button>
              {r.screen && (
                <button type="button" className="jc-btn" style={{ minHeight: 30, fontSize: 13, padding: "0 8px" }} onClick={() => open(r.screen!)} aria-label={`Open ${r.name} without travelling`}>
                  Open
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </GuiWindow>
  );
}

// ---------------------------------------------------------------- Chat
export function ChatScreen() {
  const log = useBlock((s) => s.chatLog);
  const arg = useBlock((s) => s.screenArg);
  const [text, setText] = useState(typeof arg === "string" ? arg : "");
  const navigate = useNavigate();

  const submit = () => {
    const st = useBlock.getState();
    if (!text.trim()) {
      st.close();
      return;
    }
    const r = runCommand(text);
    if (text.startsWith("/")) st.chat(text, "player");
    for (const line of r.message.split("\n")) if (line) st.chat(line, r.ok ? "info" : "error");
    setText("");
    const a = r.action;
    if (!a) return;
    if (a.type === "teleport") travelTo(regionById(a.region));
    else if (a.type === "teleportXYZ") {
      st.requestTeleport([a.x + 0.5, a.y, a.z + 0.5, runtime.yaw]);
      st.close();
    } else if (a.type === "open") st.open(a.screen);
    else if (a.type === "time") {
      runtime.time = a.value;
      st.setTime(a.value);
      st.close();
    } else if (a.type === "navigate") navigate(a.to);
  };

  return (
    <div className="jc-screen" style={{ placeItems: "end start", background: "transparent" }} role="dialog" aria-label="Chat">
      <div className="w-[min(640px,100%)]">
        <ul className="mb-2 space-y-0.5" aria-live="polite">
          {log.slice(-10).map((l, i) => (
            <li key={i} className="jc-chatline" style={{ color: l.kind === "error" ? "#ff6b6b" : l.kind === "player" ? "#d0d0d0" : "#ffffff" }}>
              {l.text}
            </li>
          ))}
          {log.length === 0 && (
            <li className="jc-chatline" style={{ color: "#ffff55" }}>
              {HELP_LINES[0]}
            </li>
          )}
        </ul>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <label className="sr-only" htmlFor="jc-chat-input">
            Chat or command
          </label>
          <input
            id="jc-chat-input"
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 120))}
            className="w-full bg-black/60 px-2 py-2 text-white outline-none"
            style={{ font: '16px "Pixelify Sans", monospace' }}
            placeholder="Type /help, /tp archive, /cv …"
            autoComplete="off"
          />
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Guide NPC
export function GuideScreen() {
  const { profile } = useContent();
  const open = useBlock((s) => s.open);
  const places = useMemo(() => REGIONS.filter((r) => r.screen && r.id !== "exit"), []);
  return (
    <GuiWindow title="Guide" width={520}>
      <p className="text-[15px] leading-snug">
        Welcome to Jathincraft! This village is {profile.shortName}&apos;s CV, built out of blocks. Every building holds a part of it. Walk in and right-click the glowing workstation, or open any of them right
        now:
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {places.map((r) => (
          <button key={r.id} type="button" className="jc-btn" onClick={() => open(r.screen!)}>
            {r.name}
          </button>
        ))}
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <button type="button" className="jc-btn" onClick={() => open("map")}>
          Show me the map
        </button>
        <button type="button" className="jc-btn" onClick={() => open("exit")}>
          How do I contact them?
        </button>
      </div>
    </GuiWindow>
  );
}
