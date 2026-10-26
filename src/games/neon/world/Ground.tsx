import { useMemo } from "react";
import * as THREE from "three";
import { MeshReflectorMaterial } from "@react-three/drei";
import { BLOCK, PITCH, STREET, SIDEWALK } from "./city";

// One canvas-painted ground for the whole district: asphalt, lane lines,
// crosswalks, sidewalks; a matching roughness map makes puddles mirror-like.
const SIZE = 220; // metres covered
const PX = 2048;
const m2px = (m: number) => ((m + SIZE / 2) / SIZE) * PX;

function paint(): { map: THREE.CanvasTexture; rough: THREE.CanvasTexture } {
  const c = document.createElement("canvas");
  const r = document.createElement("canvas");
  c.width = c.height = r.width = r.height = PX;
  const g = c.getContext("2d")!;
  const q = r.getContext("2d")!;
  let seed = 4242;
  const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

  g.fillStyle = "#101118";
  g.fillRect(0, 0, PX, PX);
  q.fillStyle = "#c8c8c8"; // fairly rough asphalt
  q.fillRect(0, 0, PX, PX);
  for (let k = 0; k < 9000; k++) {
    g.fillStyle = rand() < 0.5 ? "#16171f" : "#0c0d13";
    g.fillRect(rand() * PX, rand() * PX, 2, 2);
  }

  // Blocks: sidewalk ring + plinth (the tower footprints sit on top)
  const centers = [-1.5, -0.5, 0.5, 1.5].map((i) => i * PITCH);
  for (const cx of centers)
    for (const cz of centers) {
      const half = BLOCK / 2 + SIDEWALK;
      g.fillStyle = "#24252e";
      g.fillRect(m2px(cx - half), m2px(cz - half), m2px(cx + half) - m2px(cx - half), m2px(cz + half) - m2px(cz - half));
      q.fillStyle = "#9a9a9a";
      q.fillRect(m2px(cx - half), m2px(cz - half), m2px(cx + half) - m2px(cx - half), m2px(cz + half) - m2px(cz - half));
      g.strokeStyle = "#30323c";
      g.lineWidth = 1;
      for (let t = -half; t <= half; t += 1.5) {
        g.beginPath();
        g.moveTo(m2px(cx - half), m2px(cz + t));
        g.lineTo(m2px(cx + half), m2px(cz + t));
        g.stroke();
      }
      g.strokeStyle = "#5a5c68";
      g.lineWidth = 3;
      g.strokeRect(m2px(cx - half), m2px(cz - half), m2px(cx + half) - m2px(cx - half), m2px(cz + half) - m2px(cz - half));
    }

  // Lane markings on every street centreline
  const lines = [-2, -1, 0, 1, 2].map((k) => k * PITCH);
  g.lineWidth = 4;
  for (const l of lines) {
    g.strokeStyle = "#d9b23a";
    g.setLineDash([22, 18]);
    g.beginPath();
    g.moveTo(m2px(l), 0);
    g.lineTo(m2px(l), PX);
    g.moveTo(0, m2px(l));
    g.lineTo(PX, m2px(l));
    g.stroke();
  }
  g.setLineDash([]);
  // Crosswalks at intersections
  g.fillStyle = "#cfd2dc";
  for (const ix of lines)
    for (const iz of lines)
      for (let s = -STREET / 2 + 1; s < STREET / 2 - 1; s += 1.4) {
        for (const side of [-1, 1]) {
          g.fillRect(m2px(ix + s), m2px(iz + side * (STREET / 2 + 0.6)) - 6, 7, 12);
          g.fillRect(m2px(ix + side * (STREET / 2 + 0.6)) - 6, m2px(iz + s), 12, 7);
        }
      }
  // Puddles: dark on the colour map, smooth on the roughness map
  for (let k = 0; k < 140; k++) {
    const x = rand() * PX;
    const y = rand() * PX;
    const rx = 12 + rand() * 60;
    const ry = 8 + rand() * 30;
    g.fillStyle = "rgba(5,6,10,0.55)";
    q.fillStyle = "#101010";
    for (const ctx of [g, q]) {
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, rand() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const mk = (cv: HTMLCanvasElement, srgb: boolean) => {
    const t = new THREE.CanvasTexture(cv);
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  };
  return { map: mk(c, true), rough: mk(r, false) };
}

export function Ground({ reflect }: { reflect: boolean }) {
  const { map, rough } = useMemo(paint, []);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[SIZE, SIZE]} />
        {reflect ? (
          <MeshReflectorMaterial
            map={map}
            roughnessMap={rough}
            roughness={1}
            metalness={0.4}
            mirror={0.55}
            blur={[280, 90]}
            resolution={512}
            mixBlur={1}
            mixStrength={2.2}
            depthScale={0.6}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.2}
          />
        ) : (
          <meshStandardMaterial map={map} roughnessMap={rough} roughness={1} metalness={0.55} envMapIntensity={1.4} />
        )}
      </mesh>
      {/* Dark ground beyond the district so the fog has something to swallow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <planeGeometry args={[1400, 1400]} />
        <meshStandardMaterial color="#07070c" roughness={0.9} />
      </mesh>
    </group>
  );
}
