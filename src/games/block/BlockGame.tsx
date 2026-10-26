import "./ui/gui.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { ArrowUp, Footprints, Hammer, Menu, Package, Pickaxe } from "lucide-react";
import { useBlock, persistBlock } from "./store";
import { runtime } from "./runtime";
import { WorldView } from "./world/WorldView";
import { Signs } from "./world/Signs";
import { Particles } from "./world/Particles";
import { Sky } from "./sky/Sky";
import { Player } from "./player/Player";
import { Guide } from "./player/Guide";
import { Hud } from "./ui/Hud";
import { ScreenHost } from "./ui/ScreenHost";
import { GUIDE_POS } from "./world/structures";
import { ExitBar } from "../../platform/ExitBar";
import { TouchControls } from "../../platform/TouchControls";
import { raise } from "../../platform/faults";
import { PageMeta } from "../../site/meta";

const TOGGLES: Record<string, "inventory" | "advancements" | "map"> = { KeyE: "inventory", KeyL: "advancements", KeyM: "map" };

function nearGuide() {
  const b = runtime.body;
  return Math.hypot(b.x - GUIDE_POS[0], b.z - GUIDE_POS[2]) < 3 && Math.abs(b.y - GUIDE_POS[1]) < 2;
}

export function BlockGame() {
  const screen = useBlock((s) => s.screen);
  const [locked, setLocked] = useState(false);
  const [ready, setReady] = useState(runtime.ready);
  const [glLost, setGlLost] = useState(false);
  const [canvasKey, setCanvasKey] = useState(0);
  const wrap = useRef<HTMLDivElement>(null);
  const touch = useMemo(() => typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches, []);

  const requestLock = useCallback(() => {
    if (touch || useBlock.getState().screen !== null) return;
    const canvas = wrap.current?.querySelector("canvas");
    try {
      const p = canvas?.requestPointerLock?.() as unknown as Promise<void> | undefined;
      p?.catch?.(() => {});
    } catch {
      /* lock refused (e.g. too soon after Esc): the "Click to play" hint stays up */
    }
  }, [touch]);

  // Input listeners; `mounted` lets the context-loss handler ignore teardown.
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    const detach = runtime.input.attach(window);
    return () => {
      mounted.current = false;
      detach();
    };
  }, []);

  // Pointer lock state ↔ pause menu
  useEffect(() => {
    const onChange = () => {
      const isLocked = !!document.pointerLockElement;
      setLocked(isLocked);
      if (!isLocked && useBlock.getState().screen === null) useBlock.getState().open("pause");
    };
    document.addEventListener("pointerlockchange", onChange);
    return () => document.removeEventListener("pointerlockchange", onChange);
  }, []);

  // Opening a screen releases the mouse; closing one (a user gesture) recaptures it.
  // Never lock on first load: the player clicks in when ready ("Click to play").
  const prevScreen = useRef(screen);
  useEffect(() => {
    if (screen !== null) {
      runtime.input.reset();
      if (document.pointerLockElement) document.exitPointerLock();
    } else if (prevScreen.current !== null) requestLock();
    prevScreen.current = screen;
  }, [screen, requestLock]);

  // UI keys
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const st = useBlock.getState();
      if (st.screen === "chat") {
        if (e.key === "Escape") st.close();
        return;
      }
      if (e.key === "Escape") {
        if (st.screen) st.close();
        else {
          // Most browsers swallow Esc to release pointer lock (pointerlockchange then opens
          // the menu). Where the key reaches the page while locked, release it ourselves.
          if (document.pointerLockElement) document.exitPointerLock();
          st.open("pause");
        }
        return;
      }
      const toggle = TOGGLES[e.code];
      if (toggle) {
        e.preventDefault();
        if (st.screen === toggle) st.close();
        else if (st.screen === null || Object.values(TOGGLES).includes(st.screen as never)) st.open(toggle);
        return;
      }
      if (st.screen) return;
      if (e.code === "KeyT") {
        e.preventDefault();
        st.open("chat");
      } else if (e.code === "Slash") {
        e.preventDefault();
        st.open("chat", "/");
      } else if (e.code === "F5") {
        e.preventDefault();
        st.cycleCamera();
      } else if (e.code === "F3") {
        e.preventDefault();
        st.toggleDebug();
      } else if (e.code === "KeyF" && nearGuide()) st.open("guide");
      else if (/^Digit[1-9]$/.test(e.code)) st.setHotbar(Number(e.code.slice(5)) - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Loading → ready
  useEffect(() => {
    if (ready) return;
    const id = window.setInterval(() => {
      if (runtime.ready) {
        setReady(true);
        const st = useBlock.getState();
        if (st.discovered.length === 0) {
          st.showTitle("Jathincraft", "A CV you can walk around in", 4000);
          st.chat("Welcome! Talk to the Guide (F), press M for the map, or Esc for the menu.");
        }
      }
    }, 150);
    return () => window.clearInterval(id);
  }, [ready]);

  // Save progress regularly and when leaving
  useEffect(() => {
    const save = () => {
      useBlock.getState().setTime(runtime.time);
      const b = runtime.body;
      persistBlock(runtime.ready ? [b.x, b.y, b.z, runtime.yaw, runtime.pitch] : null);
    };
    const id = window.setInterval(save, 5000);
    window.addEventListener("pagehide", save);
    return () => {
      save();
      window.clearInterval(id);
      window.removeEventListener("pagehide", save);
    };
  }, []);

  const touchActions = useMemo(
    () => [
      { id: "jump", label: "Jump", icon: <ArrowUp size={20} aria-hidden />, onDown: () => (runtime.input.touchJump = true), onUp: () => (runtime.input.touchJump = false) },
      { id: "break", label: "Break block", icon: <Pickaxe size={20} aria-hidden />, onDown: () => (runtime.input.breaking = true), onUp: () => (runtime.input.breaking = false) },
      { id: "use", label: "Use or place", icon: <Hammer size={20} aria-hidden />, onDown: () => runtime.input.useQueued++ },
      { id: "sneak", label: "Sneak", icon: <Footprints size={20} aria-hidden />, onDown: () => (runtime.input.touchSneak = !runtime.input.touchSneak) },
      { id: "inv", label: "Skills", icon: <Package size={20} aria-hidden />, onDown: () => useBlock.getState().open("inventory") },
      { id: "menu", label: "Menu", icon: <Menu size={20} aria-hidden />, onDown: () => useBlock.getState().open("pause") },
    ],
    [],
  );

  return (
    <div ref={wrap} className="jc" data-theme="dark" onContextMenu={(e) => e.preventDefault()}>
      <PageMeta title="Jathincraft" description="Explore Ellanti Jathin's CV as a block-building world: skills in the Armory, projects in the Crafting Hall, the skill tree at the Advancement Shrine." />
      <a href="#jc-menu" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:bg-black focus:p-2" onClick={(e) => (e.preventDefault(), useBlock.getState().open("pause"))}>
        Skip to the game menu
      </a>
      <Canvas
        key={canvasKey}
        aria-label="Jathincraft: a 3D block world. Use the game menu (Esc) to open every CV section without playing."
        dpr={[1, 1.5]}
        gl={{ antialias: false, powerPreference: "high-performance" }}
        camera={{ fov: 75, near: 0.05, far: 1000, position: [0, 40, 0] }}
        onPointerDown={requestLock}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener("webglcontextlost", (e) => {
            // R3F deliberately drops the context when the canvas unmounts; only a loss while mounted is a fault.
            if (!mounted.current) return;
            e.preventDefault();
            raise("webgl.context_lost");
            setGlLost(true);
          });
        }}
      >
        <Sky />
        <WorldView />
        <Signs />
        <Guide />
        <Particles />
        <Player />
      </Canvas>

      <Hud locked={locked} touch={touch} />
      <ScreenHost />
      {touch && screen === null && ready && (
        <TouchControls
          onMove={(x, y) => (runtime.input.touchMove = [x, y])}
          onLook={(dx, dy) => {
            runtime.input.lookDX += dx;
            runtime.input.lookDY += dy;
          }}
          actions={touchActions}
        />
      )}

      {!ready && (
        <div className="jc-dirt absolute inset-0 z-40 grid place-items-center" role="status" aria-live="polite">
          <div className="text-center">
            <p className="jc-text-shadow text-2xl">Building terrain…</p>
            <p className="jc-text-shadow mt-2 text-white/80">Generating the village and the land around it</p>
          </div>
        </div>
      )}

      {glLost && (
        <div className="jc-screen" role="alertdialog" aria-labelledby="jc-gl-lost">
          <div className="jc-panel w-[min(420px,100%)] text-center">
            <h2 id="jc-gl-lost" className="text-xl">
              Graphics were interrupted
            </h2>
            <p className="mt-2 text-[15px]">The GPU reset or the tab ran low on graphics memory.</p>
            <button
              type="button"
              className="jc-btn mt-3"
              onClick={() => {
                setGlLost(false);
                runtime.ready = false;
                setReady(false);
                setCanvasKey((k) => k + 1);
              }}
            >
              Restore graphics
            </button>
          </div>
        </div>
      )}

      <span id="jc-menu" />
      <ExitBar />
    </div>
  );
}
