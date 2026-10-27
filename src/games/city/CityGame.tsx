import "./ui/city.css";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ArrowUp, Car, Gauge, Menu, Smartphone } from "lucide-react";
import { cityRuntime } from "./runtime";
import { useCity } from "./store";
import { World } from "./world/World";
import { Traffic } from "./world/Traffic";
import { Markers } from "./world/Markers";
import { Player } from "./player/Player";
import { Hud } from "./ui/Hud";
import { MapScreen, MissionScreen, PauseScreen, PhoneScreen, SettingsScreen } from "./ui/Screens";
import { ExitBar } from "../../platform/ExitBar";
import { TouchControls, type TouchAction } from "../../platform/TouchControls";
import { tryPointerLock } from "../../platform/fpsInput";
import { raise } from "../../platform/faults";
import { sfx, useWorldAudio } from "../../platform/audio";
import { PageMeta } from "../../site/meta";

// SUNSET BAY shell: canvas, HUD, screens, input, audio and fault capture.

function FirstFrame({ onReady }: { onReady(): void }) {
  const done = useRef(false);
  useFrame(() => {
    if (done.current) return;
    done.current = true;
    onReady();
  });
  return null;
}

export function CityGame() {
  const screen = useCity((s) => s.screen);
  const quality = useCity((s) => s.quality);
  const [locked, setLocked] = useState(false);
  const [ready, setReady] = useState(false);
  const [glLost, setGlLost] = useState(false);
  const [canvasKey, setCanvasKey] = useState(0);
  const wrap = useRef<HTMLDivElement>(null);
  const mounted = useRef(true);
  const touch = useMemo(() => typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches, []);

  // Cleared in a layout cleanup (the commit that removes the canvas), so a context
  // the browser reclaims while the next page paints isn't reported as a fault.
  useLayoutEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => cityRuntime.input.attach(window), []);

  // Surf, gulls and a warm city bed; the sunset radio; a click as screens open/close.
  useWorldAudio("city");
  useEffect(
    () =>
      useCity.subscribe((s, prev) => {
        if (s.screen !== prev.screen) sfx(s.screen ? "open" : "close");
        if (s.passedBanner && s.passedBanner !== prev.passedBanner) sfx("passed");
      }),
    [],
  );

  const requestLock = useCallback(() => {
    if (!touch && useCity.getState().screen === null) tryPointerLock(wrap.current?.querySelector("canvas"));
  }, [touch]);

  useEffect(() => {
    const onChange = () => {
      const isLocked = !!document.pointerLockElement;
      setLocked(isLocked);
      if (!isLocked && useCity.getState().screen === null) useCity.getState().open("pause");
    };
    document.addEventListener("pointerlockchange", onChange);
    return () => document.removeEventListener("pointerlockchange", onChange);
  }, []);

  const prevScreen = useRef(screen);
  useEffect(() => {
    if (screen !== null) {
      cityRuntime.input.reset();
      if (document.pointerLockElement) document.exitPointerLock();
    } else if (prevScreen.current !== null) requestLock();
    prevScreen.current = screen;
  }, [screen, requestLock]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      const st = useCity.getState();
      if (e.key === "Escape") {
        if (st.screen) st.close();
        else {
          if (document.pointerLockElement) document.exitPointerLock();
          st.open("pause");
        }
        return;
      }
      if (e.code === "Space" && st.screen === null) e.preventDefault();
      if ((e.code === "ArrowUp" || e.code === "KeyP") && (st.screen === null || st.screen === "phone")) {
        e.preventDefault();
        if (st.screen === "phone") st.close();
        else st.open("phone");
        return;
      }
      if (e.code === "KeyM" && (st.screen === null || st.screen === "map")) {
        if (st.screen === "map") st.close();
        else st.open("map");
        return;
      }
      if (e.code === "KeyF" && st.screen === null) {
        cityRuntime.useQueued = true;
        if (!st.helpSeen) st.dismissHelp();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const touchActions = useMemo<TouchAction[]>(
    () => [
      { id: "jump", label: "Jump / handbrake", icon: <ArrowUp size={20} aria-hidden />, onDown: () => (cityRuntime.input.touchJump = true), onUp: () => (cityRuntime.input.touchJump = false) },
      { id: "sprint", label: "Sprint", icon: <Gauge size={20} aria-hidden />, onDown: () => (cityRuntime.input.touchSprint = !cityRuntime.input.touchSprint) },
      { id: "car", label: "Get in or out of a car", icon: <Car size={20} aria-hidden />, onDown: () => (cityRuntime.useQueued = true) },
      { id: "phone", label: "Phone", icon: <Smartphone size={20} aria-hidden />, onDown: () => useCity.getState().open("phone") },
      { id: "menu", label: "Menu", icon: <Menu size={20} aria-hidden />, onDown: () => useCity.getState().open("pause") },
    ],
    [],
  );

  return (
    <div ref={wrap} className="ct-root fixed inset-0 overflow-hidden bg-[#f3b48f]" data-theme="dark">
      <PageMeta title="SUNSET BAY" description="Drive a sunset coastal city where every mission opens part of Ellanti Jathin's CV." />
      <Canvas
        key={canvasKey}
        aria-label="SUNSET BAY: a 3D sunset coastal city. Press Escape for a menu that opens every CV section without playing."
        dpr={quality === "high" ? [1, 1.75] : [1, 1.25]}
        gl={{ antialias: quality !== "low", powerPreference: "high-performance" }}
        camera={{ fov: 64, near: 0.1, far: 1600, position: [8, 4, 44] }}
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
        <World />
        <Markers />
        <Traffic count={quality === "low" ? 5 : 10} />
        <Player />
        <FirstFrame onReady={() => setReady(true)} />
      </Canvas>

      <Hud />
      {ready && !locked && !touch && screen === null && (
        <div className="ct-play">
          <p>
            Click to play
            <small>Esc for the menu that opens every CV section · F near a car to drive</small>
          </p>
        </div>
      )}
      {screen === "mission" && <MissionScreen />}
      {screen === "phone" && <PhoneScreen />}
      {screen === "pause" && <PauseScreen />}
      {screen === "map" && <MapScreen />}
      {screen === "settings" && <SettingsScreen />}
      {touch && screen === null && ready && (
        <TouchControls
          onMove={(x, y) => (cityRuntime.input.move = [x, y])}
          onLook={(dx, dy) => {
            cityRuntime.input.lookDX += dx;
            cityRuntime.input.lookDY += dy;
          }}
          actions={touchActions}
        />
      )}

      {!ready && (
        <div className="absolute inset-0 z-40 grid place-items-center bg-[#1b1424]" role="status" aria-live="polite">
          <div className="text-center">
            <p className="ct-title text-[#ffb627]">Sunset Bay</p>
            <p className="mt-2 text-white/75">Loading the coast…</p>
          </div>
        </div>
      )}

      {glLost && (
        <div className="ct-screen" role="alertdialog" aria-labelledby="ct-gl">
          <div className="ct-panel" style={{ width: "min(420px, 100%)" }}>
            <div className="ct-panel-body text-center">
              <h2 id="ct-gl" className="ct-title">
                Graphics were interrupted
              </h2>
              <p className="ct-dim">The GPU reset or the tab ran low on graphics memory.</p>
              <div className="ct-actions justify-center">
                <button
                  type="button"
                  className="ct-btn is-primary"
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
                  className="ct-btn"
                  onClick={() => {
                    useCity.getState().setOption({ quality: "low" });
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
        </div>
      )}

      <ExitBar />
    </div>
  );
}
