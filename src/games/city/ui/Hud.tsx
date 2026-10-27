import { useEffect, useRef, useState } from "react";
import { cityRuntime } from "../runtime";
import { useCity } from "../store";
import { MARKERS, placeName } from "../world/layout";
import { missionById } from "../content";
import { drawMap } from "./mapDraw";

// The heads-up display: help box, rotating minimap, street name, speedometer,
// mission count and the "MISSION PASSED" banner. Polls the runtime at ~20 fps.

function Minimap() {
  const ref = useRef<HTMLCanvasElement>(null);
  const passed = useCity((s) => s.passed);
  useEffect(() => {
    const c = ref.current!;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = c.clientWidth;
    const h = c.clientHeight;
    c.width = w * dpr;
    c.height = h * dpr;
    const g = c.getContext("2d")!;
    g.scale(dpr, dpr);
    const id = window.setInterval(() => {
      const rt = cityRuntime;
      const p = rt.driving >= 0 ? rt.cars[rt.driving] : rt.player;
      const facing = rt.driving >= 0 ? rt.cars[rt.driving].heading : rt.player.facing;
      drawMap(g, w, h, { cx: p.x, cz: p.z, scale: rt.driving >= 0 ? 0.9 : 1.4, rotation: -Math.PI / 2 - rt.camYaw }, { player: { x: p.x, z: p.z, facing }, passed, traffic: rt.trafficDots, clampBlips: true });
    }, 50);
    return () => window.clearInterval(id);
  }, [passed]);
  return <canvas ref={ref} aria-hidden className="ct-minimap" />;
}

/** Re-reads a value from the runtime every `ms`. Pass a stable (module-level) reader. */
function useRuntimeTick<T>(read: () => T, ms = 120): T {
  const [v, setV] = useState(read);
  useEffect(() => {
    const id = window.setInterval(() => setV(read), ms);
    return () => window.clearInterval(id);
  }, [read, ms]);
  return v;
}

const readPlace = () => placeName(cityRuntime.player.x, cityRuntime.player.z);
const readSpeed = () => (cityRuntime.driving >= 0 ? Math.round(cityRuntime.speedKmh) : -1);

export function Hud() {
  const help = useCity((s) => s.help);
  const passed = useCity((s) => s.passed);
  const banner = useCity((s) => s.passedBanner);
  const place = useRuntimeTick(readPlace, 300);
  const speed = useRuntimeTick(readSpeed, 100);

  return (
    <div className="ct-hud" aria-live="polite">
      {help && <div className="ct-help">{help}</div>}

      <div className="ct-count">
        <span>Missions</span>
        <strong>
          {passed.length} / {MARKERS.length}
        </strong>
      </div>

      <div className="ct-mapwrap">
        <Minimap />
        <p className="ct-zone">Sunset Bay</p>
      </div>

      <div className="ct-street">
        {speed >= 0 && (
          <p className="ct-speed">
            {speed}
            <span>km/h</span>
          </p>
        )}
        <p className="ct-streetname">{place}</p>
        <p className="ct-area">Sunset Bay</p>
      </div>

      {banner && (
        <div className="ct-passed" role="status">
          <p className="ct-passed-title">Mission passed</p>
          <p className="ct-passed-sub">{missionById(banner).title}</p>
          <p className="ct-passed-respect">Respect +</p>
        </div>
      )}
    </div>
  );
}
