import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useContent } from "../../../content/useContent";
import { neonRuntime, useNeon } from "../store";
import { COLLIDERS, POIS, nearestPoi, poiById } from "../world/city";

// Status card, minimap, objective tracker, interaction prompt, clock, toasts,
// and scanner tags projected over the POIs.

function Minimap() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let raf = 0;
    let last = 0;
    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (now - last < 90) return;
      last = now;
      const c = ref.current;
      if (!c) return;
      const g = c.getContext("2d")!;
      const S = c.width;
      const scale = S / 120; // 120 m across
      const { x, z } = neonRuntime.walker;
      g.clearRect(0, 0, S, S);
      g.save();
      g.beginPath();
      g.arc(S / 2, S / 2, S / 2 - 2, 0, Math.PI * 2);
      g.clip();
      g.fillStyle = "rgba(6,8,16,0.88)";
      g.fillRect(0, 0, S, S);
      g.translate(S / 2, S / 2);
      g.rotate(neonRuntime.yaw);
      g.fillStyle = "#1d2133";
      g.strokeStyle = "rgba(62,240,255,0.25)";
      for (const b of COLLIDERS) {
        const bx = (b.minX - x) * scale;
        const bz = (b.minZ - z) * scale;
        g.fillRect(bx, bz, (b.maxX - b.minX) * scale, (b.maxZ - b.minZ) * scale);
        g.strokeRect(bx, bz, (b.maxX - b.minX) * scale, (b.maxZ - b.minZ) * scale);
      }
      for (const p of POIS) {
        const px = (p.at[0] - x) * scale;
        const pz = (p.at[1] - z) * scale;
        g.fillStyle = p.color;
        g.fillRect(px - 4, pz - 4, 8, 8);
      }
      g.restore();
      g.fillStyle = "#f3e600";
      g.beginPath();
      g.moveTo(S / 2, S / 2 - 8);
      g.lineTo(S / 2 + 6, S / 2 + 6);
      g.lineTo(S / 2, S / 2 + 2);
      g.lineTo(S / 2 - 6, S / 2 + 6);
      g.closePath();
      g.fill();
      g.strokeStyle = "rgba(255,59,79,0.7)";
      g.lineWidth = 2;
      g.beginPath();
      g.arc(S / 2, S / 2, S / 2 - 2, 0, Math.PI * 2);
      g.stroke();
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={ref} width={168} height={168} className="size-[124px] sm:size-[168px]" aria-hidden />;
}

function ScanTags() {
  const scanning = useNeon((s) => s.scanning);
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  useEffect(() => {
    if (!scanning) return;
    let raf = 0;
    const v = new THREE.Vector3();
    const frame = () => {
      raf = requestAnimationFrame(frame);
      const cam = neonRuntime.camera;
      if (!cam) return;
      POIS.forEach((p, i) => {
        const el = refs.current[i];
        if (!el) return;
        v.set(p.facade.x + p.facade.nx * 0.5, 4.2, p.facade.z + p.facade.nz * 0.5).project(cam);
        const dist = Math.hypot(p.at[0] - neonRuntime.walker.x, p.at[1] - neonRuntime.walker.z);
        const visible = v.z < 1 && Math.abs(v.x) < 1.05 && Math.abs(v.y) < 1.05 && dist < 90;
        el.style.display = visible ? "block" : "none";
        if (visible) {
          el.style.left = `${((v.x + 1) / 2) * window.innerWidth}px`;
          el.style.top = `${((1 - v.y) / 2) * window.innerHeight}px`;
          (el.querySelector("[data-dist]") as HTMLElement).textContent = `${Math.round(dist)} M`;
        }
      });
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [scanning]);
  if (!scanning) return null;
  return (
    <>
      {POIS.map((p, i) => (
        <div key={p.id} ref={(el) => void (refs.current[i] = el)} className="nc-scan-tag" style={{ display: "none" }}>
          <div className="nc-panel nc-cut px-3 py-1.5" style={{ borderColor: p.color }}>
            <p className="nc-display text-[12px]" style={{ color: p.color }}>
              {p.name}
            </p>
            <p className="text-[13px] text-[var(--nc-dim)]">{p.hint}</p>
            <p className="text-[12px] text-[var(--nc-yellow)]" data-dist />
          </div>
          <div className="mx-auto h-6 w-px" style={{ background: p.color }} />
        </div>
      ))}
      <div className="pointer-events-none absolute inset-0 border-[3px] border-[rgb(62_240_255_/_0.35)]" />
      <p className="nc-display absolute left-1/2 top-20 -translate-x-1/2 text-sm text-[var(--nc-cyan)]">Scanning</p>
    </>
  );
}

export function Hud({ locked, touch }: { locked: boolean; touch: boolean }) {
  const { profile } = useContent();
  const discovered = useNeon((s) => s.discovered);
  const toasts = useNeon((s) => s.toasts);
  const screen = useNeon((s) => s.screen);
  const scanning = useNeon((s) => s.scanning);
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 200);
    return () => window.clearInterval(id);
  }, []);

  const near = neonRuntime.nearPoi ? poiById(neonRuntime.nearPoi) : undefined;
  const objective = nearestPoi(neonRuntime.walker.x, neonRuntime.walker.z);
  const undiscovered = POIS.filter((p) => !discovered.includes(p.id));
  const next = undiscovered.length ? undiscovered.reduce((a, b) => (Math.hypot(a.at[0] - neonRuntime.walker.x, a.at[1] - neonRuntime.walker.z) < Math.hypot(b.at[0] - neonRuntime.walker.x, b.at[1] - neonRuntime.walker.z) ? a : b)) : objective.poi;
  const nextDist = Math.round(Math.hypot(next.at[0] - neonRuntime.walker.x, next.at[1] - neonRuntime.walker.z));
  const now = new Date();
  const clock = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  return (
    <div className="pointer-events-none absolute inset-0 z-10" aria-hidden={screen !== null}>
      {screen === null && !scanning && <div className="absolute left-1/2 top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--nc-yellow)] shadow-[0_0_8px_var(--nc-yellow)]" />}

      <div className="absolute left-3 top-3 w-[min(300px,60vw)] sm:left-5 sm:top-5">
        <div className="nc-panel nc-cut px-3 py-2">
          <p className="nc-display text-[13px] text-[var(--nc-yellow)]">{profile.name}</p>
          <p className="text-[13px] text-[var(--nc-dim)]">{profile.title.toUpperCase()}</p>
          <div className="mt-1.5 flex items-center gap-2 text-[12px]">
            <span className="nc-label">Lvl {discovered.length}</span>
            <div className="h-1.5 flex-1 bg-white/10">
              <div className="h-full bg-[var(--nc-red)] shadow-[0_0_8px_var(--nc-red)]" style={{ width: `${(discovered.length / POIS.length) * 100}%` }} />
            </div>
            <span className="text-[var(--nc-dim)]">STREET CRED</span>
          </div>
        </div>
      </div>

      <div className="absolute right-3 top-16 flex flex-col items-end gap-2 sm:right-5 sm:top-20">
        <Minimap />
        <div className="nc-panel nc-cut max-w-[230px] px-3 py-2 text-right">
          <p className="nc-label">{undiscovered.length ? "Next location" : "Explored"}</p>
          <p className="text-[15px]">{next.name}</p>
          <p className="text-[13px] text-[var(--nc-yellow)]">{nextDist} M</p>
        </div>
      </div>

      <div className="absolute left-1/2 top-24 flex -translate-x-1/2 flex-col items-center gap-2" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className="nc-toast nc-panel nc-cut px-4 py-2 text-center">
            <p className="nc-display text-[12px] text-[var(--nc-yellow)]">{t.title}</p>
            <p className="text-[16px]">{t.body}</p>
          </div>
        ))}
      </div>

      {screen === null && near && (
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 text-center">
          <p className="nc-panel nc-cut inline-flex items-center gap-3 px-4 py-2 text-[17px]">
            <span className="border border-[var(--nc-yellow)] px-2 text-[var(--nc-yellow)]">F</span>
            Enter {near.name}
          </p>
          <p className="mt-1 text-[14px] text-[var(--nc-dim)]">{near.hint}</p>
        </div>
      )}

      {screen === null && !locked && !touch && (
        <p className="nc-display absolute left-1/2 top-[58%] -translate-x-1/2 text-center text-sm text-white/85">
          Click to play
          <span className="mt-1 block font-[Rajdhani] text-[14px] normal-case tracking-normal text-[var(--nc-dim)]">Hold Tab to scan · Esc for the menu · M map · J journal</span>
        </p>
      )}

      <div className="absolute bottom-4 right-4 text-right sm:bottom-5 sm:right-5">
        <p className="nc-display text-lg text-[var(--nc-yellow)]">{clock}</p>
        <p className="text-[13px] text-[var(--nc-dim)]">RAIN · THE SPRAWL · BLOCK 7</p>
      </div>
      <p className="absolute bottom-4 left-4 text-[13px] text-[var(--nc-dim)] sm:bottom-5 sm:left-5">[TAB] SCAN · [J] JOURNAL · [M] MAP</p>

      <ScanTags />
    </div>
  );
}
