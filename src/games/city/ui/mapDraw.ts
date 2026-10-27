import { BLOCK, BLOCK_CENTRES, BUILDINGS, MARKERS, ROAD, ROAD_LINES, SAND, SHORE_X, type MissionId } from "../world/layout";

// One renderer for the HUD minimap (rotating, centred on the player) and the
// full map screen (north-up, whole city). World x → screen right, world z → down.

export interface MapView {
  /** World point at the canvas centre. */
  cx: number;
  cz: number;
  /** Pixels per metre. */
  scale: number;
  /** Rotation so the camera's forward points up (minimap); 0 = north up. */
  rotation: number;
}

export interface MapState {
  player: { x: number; z: number; facing: number };
  passed: MissionId[];
  traffic?: [number, number][];
  /** Clamp off-screen blips to the edge (minimap). */
  clampBlips?: boolean;
}

export function drawMap(g: CanvasRenderingContext2D, w: number, h: number, view: MapView, s: MapState) {
  g.save();
  g.clearRect(0, 0, w, h);
  g.translate(w / 2, h / 2);
  g.rotate(view.rotation);
  g.scale(view.scale, view.scale);
  g.translate(-view.cx, -view.cz);

  // Land, beach and sea.
  g.fillStyle = "#c9c2b8";
  g.fillRect(-400, -400, 800, 800);
  g.fillStyle = "#ecd3a4";
  g.fillRect(SAND.minX, -800, SHORE_X - SAND.minX, 1600);
  g.fillStyle = "#4fa9c4";
  g.fillRect(SHORE_X, -800, 1200, 1600);

  // Blocks (kerbed), buildings, plazas.
  for (const x of BLOCK_CENTRES)
    for (const z of BLOCK_CENTRES) {
      g.fillStyle = "#b9b1a6";
      g.fillRect(x - BLOCK / 2, z - BLOCK / 2, BLOCK, BLOCK);
    }
  g.fillStyle = "#9aa86f";
  for (const [x, z] of [
    [30, 30],
    [-30, -30],
  ])
    g.fillRect(x - BLOCK / 2 + 3, z - BLOCK / 2 + 3, BLOCK - 6, BLOCK - 6);
  g.fillStyle = "#8f8a95";
  for (const b of BUILDINGS) g.fillRect(b.x - b.w / 2, b.z - b.d / 2, b.w, b.d);

  // Roads.
  g.fillStyle = "#3f3d45";
  for (const r of ROAD_LINES) {
    g.fillRect(r - ROAD / 2, -140, ROAD, 280);
    g.fillRect(-140, r - ROAD / 2, 280, ROAD);
  }

  g.restore();

  // Blips, drawn upright in screen space.
  const toScreen = (x: number, z: number) => {
    const dx = (x - view.cx) * view.scale;
    const dz = (z - view.cz) * view.scale;
    const c = Math.cos(view.rotation);
    const sn = Math.sin(view.rotation);
    return [w / 2 + dx * c - dz * sn, h / 2 + dx * sn + dz * c];
  };
  for (const [x, z] of s.traffic ?? []) {
    const [sx, sy] = toScreen(x, z);
    g.fillStyle = "rgba(255,255,255,0.75)";
    g.fillRect(sx - 1.5, sy - 1.5, 3, 3);
  }
  for (const m of MARKERS) {
    let [sx, sy] = toScreen(m.at[0], m.at[1]);
    if (s.clampBlips) {
      const pad = 9;
      sx = Math.max(pad, Math.min(w - pad, sx));
      sy = Math.max(pad, Math.min(h - pad, sy));
    }
    const done = s.passed.includes(m.id);
    g.beginPath();
    g.arc(sx, sy, 6, 0, Math.PI * 2);
    g.fillStyle = done ? "#5df2a8" : "#ffd400";
    g.fill();
    g.lineWidth = 2;
    g.strokeStyle = "#111";
    g.stroke();
  }
  // Player arrow.
  const [px, py] = toScreen(s.player.x, s.player.z);
  g.save();
  g.translate(px, py);
  g.rotate(s.player.facing + view.rotation + Math.PI / 2);
  g.beginPath();
  g.moveTo(0, -9);
  g.lineTo(6, 7);
  g.lineTo(0, 3.5);
  g.lineTo(-6, 7);
  g.closePath();
  g.fillStyle = "#ffffff";
  g.fill();
  g.lineWidth = 1.5;
  g.strokeStyle = "#111";
  g.stroke();
  g.restore();
}
