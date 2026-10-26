import "./ui/neon.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ArrowUp, Gauge, Hand, Menu, ScanLine } from "lucide-react";
import { useContent } from "../../content/useContent";
import { neonRuntime, persistNeon, useNeon, type HubTab } from "./store";
import { Buildings } from "./world/Buildings";
import { Ground } from "./world/Ground";
import { Storefronts } from "./world/Storefronts";
import { Rain, SkyAndFog, Traffic } from "./world/Atmosphere";
import { Effects } from "./world/Effects";
import { Player } from "./player/Player";
import { Hud } from "./ui/Hud";
import { Hub } from "./ui/Hub";
import { Exit, HoloCall, Pause, Settings } from "./ui/Menus";
import { poiById } from "./world/city";
import { ExitBar } from "../../platform/ExitBar";
import { TouchControls } from "../../platform/TouchControls";
import { tryPointerLock } from "../../platform/fpsInput";
import { raise } from "../../platform/faults";
import { PageMeta } from "../../site/meta";

const HUB_KEYS: Record<string, HubTab> = { KeyJ: "jobs", KeyC: "character", KeyP: "perks", KeyM: "map" };

function FirstFrame({ onReady }: { onReady(): void }) {
  const frames = useRef(0);
  useFrame(() => {
    if (++frames.current === 3) onReady();
  });
  return null;
}

function interact() {
  const st = useNeon.getState();
  const poi = neonRuntime.nearPoi ? poiById(neonRuntime.nearPoi) : undefined;
  if (!poi || st.screen) return;
  if (poi.screen === "exit") st.open("exit");
  else st.openHub(poi.screen as HubTab);
}

export function NeonGame() {
  const { skills, projects, profile, achievements } = useContent();
  const screen = useNeon((s) => s.screen);
  const quality = useNeon((s) => s.quality);
  const scanning = useNeon((s) => s.scanning);
  const [locked, setLocked] = useState(false);
  const [ready, setReady] = useState(false);
  const [glLost, setGlLost] = useState(false);
  const [canvasKey, setCanvasKey] = useState(0);
  const wrap = useRef<HTMLDivElement>(null);
  const mounted = useRef(true);
  const touch = useMemo(() => typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches, []);

  // Billboard copy comes from real content only.
  const ads = useMemo<[string, string][]>(() => {
    const name = (id: string) => skills.find((s) => s.id === id)?.name;
    const pair = (a: string, b: string) => [name(a), name(b)].filter(Boolean).join(" · ");
    const list: [string, string][] = [
      [pair("csharp", "unity"), achievements[0]?.title ?? "Game development"],
      [pair("react", "nodejs"), "Full-stack web, built to ship"],
      [pair("python", "django"), "Server-side, API-driven"],
      [profile.name.toUpperCase(), profile.title],
      ...projects.map((p) => [p.title.toUpperCase(), p.summary.split(".")[0]] as [string, string]),
      [pair("mongodb", "sql"), "Data, modelled properly"],
    ];
    return list.filter((l) => l[0]);
  }, [skills, projects, profile, achievements]);

  const requestLock = useCallback(() => {
    if (!touch && useNeon.getState().screen === null) tryPointerLock(wrap.current?.querySelector("canvas"));
  }, [touch]);

  useEffect(() => {
    mounted.current = true;
    const detach = neonRuntime.input.attach(window);
    return () => {
      mounted.current = false;
      detach();
    };
  }, []);

  useEffect(() => {
    const onChange = () => {
      const isLocked = !!document.pointerLockElement;
      setLocked(isLocked);
      if (!isLocked && useNeon.getState().screen === null) useNeon.getState().open("pause");
    };
    document.addEventListener("pointerlockchange", onChange);
    return () => document.removeEventListener("pointerlockchange", onChange);
  }, []);

  const prevScreen = useRef(screen);
  useEffect(() => {
    if (screen !== null) {
      neonRuntime.input.reset();
      if (document.pointerLockElement) document.exitPointerLock();
    } else if (prevScreen.current !== null) requestLock();
    prevScreen.current = screen;
  }, [screen, requestLock]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      const st = useNeon.getState();
      if (e.code === "Tab" && st.screen === null) e.preventDefault();
      if (e.key === "Escape") {
        if (st.screen) st.close();
        else {
          if (document.pointerLockElement) document.exitPointerLock();
          st.open("pause");
        }
        return;
      }
      const tab = HUB_KEYS[e.code];
      if (tab) {
        e.preventDefault();
        if (st.screen === "hub" && st.tab === tab) st.close();
        else if (st.screen === null || st.screen === "hub") st.openHub(tab);
        return;
      }
      if (e.code === "KeyF" && st.screen === null) interact();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!ready || useNeon.getState().callSeen) return;
    const id = window.setTimeout(() => useNeon.getState().setCall(true), 1200);
    return () => window.clearTimeout(id);
  }, [ready]);

  useEffect(() => {
    const id = window.setInterval(persistNeon, 5000);
    window.addEventListener("pagehide", persistNeon);
    return () => {
      persistNeon();
      window.clearInterval(id);
      window.removeEventListener("pagehide", persistNeon);
    };
  }, []);

  const touchActions = useMemo(
    () => [
      { id: "jump", label: "Jump", icon: <ArrowUp size={20} aria-hidden />, onDown: () => (neonRuntime.input.touchJump = true), onUp: () => (neonRuntime.input.touchJump = false) },
      { id: "sprint", label: "Sprint", icon: <Gauge size={20} aria-hidden />, onDown: () => (neonRuntime.input.touchSprint = !neonRuntime.input.touchSprint) },
      { id: "use", label: "Enter location", icon: <Hand size={20} aria-hidden />, onDown: interact },
      { id: "scan", label: "Scan", icon: <ScanLine size={20} aria-hidden />, onDown: () => neonRuntime.input.keys.add("KeyQ"), onUp: () => neonRuntime.input.keys.delete("KeyQ") },
      { id: "menu", label: "Menu", icon: <Menu size={20} aria-hidden />, onDown: () => useNeon.getState().open("pause") },
    ],
    [],
  );

  return (
    <div ref={wrap} className={`nc${scanning ? " is-scanning" : ""}`} data-theme="dark">
      <PageMeta title="NEON//SPRAWL" description="Walk a rain-soaked neon district where every storefront holds part of Ellanti Jathin's CV." />
      <Canvas
        key={canvasKey}
        aria-label="NEON//SPRAWL: a 3D neon city block. Press Escape for a menu that opens every CV section without playing."
        dpr={quality === "high" ? [1, 1.75] : [1, 1.25]}
        gl={{ antialias: quality !== "low", powerPreference: "high-performance" }}
        camera={{ fov: 78, near: 0.08, far: 1200, position: [0, 1.7, 12] }}
        onPointerDown={requestLock}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener("webglcontextlost", (e) => {
            if (!mounted.current) return;
            e.preventDefault();
            raise("webgl.context_lost");
            setGlLost(true);
          });
        }}
      >
        <SkyAndFog />
        <Buildings />
        <Ground reflect={quality === "high"} />
        <Storefronts ads={ads} />
        <Rain count={quality === "low" ? 1200 : quality === "medium" ? 2600 : 3600} />
        <Traffic count={quality === "low" ? 14 : 26} />
        <Player />
        {quality !== "low" && <Effects />}
        <FirstFrame onReady={() => setReady(true)} />
      </Canvas>

      <Hud locked={locked} touch={touch} />
      <HoloCall />
      {screen === "hub" && <Hub />}
      {screen === "pause" && <Pause />}
      {screen === "settings" && <Settings />}
      {screen === "exit" && <Exit />}
      {touch && screen === null && ready && (
        <TouchControls
          onMove={(x, y) => (neonRuntime.input.move = [x, y])}
          onLook={(dx, dy) => {
            neonRuntime.input.lookDX += dx;
            neonRuntime.input.lookDY += dy;
          }}
          actions={touchActions}
        />
      )}

      {!ready && (
        <div className="absolute inset-0 z-40 grid place-items-center bg-[#05040a]" role="status" aria-live="polite">
          <div className="text-center">
            <p className="nc-display text-2xl text-[var(--nc-yellow)]">Jacking in…</p>
            <p className="mt-2 text-[var(--nc-dim)]">Rendering the district</p>
          </div>
        </div>
      )}

      {glLost && (
        <div className="nc-screen" role="alertdialog" aria-labelledby="nc-gl">
          <div className="nc-panel nc-cut w-[min(420px,100%)] p-5 text-center">
            <h2 id="nc-gl" className="nc-display text-lg">
              Graphics were interrupted
            </h2>
            <p className="mt-2 text-[var(--nc-dim)]">The GPU reset or the tab ran low on graphics memory.</p>
            <div className="mt-4 flex justify-center gap-2">
              <button
                type="button"
                className="nc-btn"
                onClick={() => {
                  setGlLost(false);
                  setReady(false);
                  setCanvasKey((k) => k + 1);
                }}
              >
                Restore graphics
              </button>
              <button
                type="button"
                className="nc-btn is-ghost"
                onClick={() => {
                  useNeon.getState().setOption({ quality: "low" });
                  setGlLost(false);
                  setReady(false);
                  setCanvasKey((k) => k + 1);
                }}
              >
                Lite mode
              </button>
            </div>
          </div>
        </div>
      )}

      <ExitBar />
    </div>
  );
}
