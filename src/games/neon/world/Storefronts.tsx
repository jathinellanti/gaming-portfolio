import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { POIS, BILLBOARDS, type Poi } from "./city";

// Neon signs + glowing doorways for the eight CV locations, and holographic
// billboards that advertise the real skills and projects (texts come from content).

function neonTexture(text: string, color: string): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 192;
  const g = c.getContext("2d")!;
  g.font = '800 104px "Orbitron", system-ui, sans-serif';
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.shadowColor = color;
  for (const blur of [40, 20, 8]) {
    g.shadowBlur = blur;
    g.fillStyle = color;
    g.fillText(text, 512, 100);
  }
  g.shadowBlur = 0;
  g.fillStyle = "#ffffff";
  g.globalAlpha = 0.85;
  g.fillText(text, 512, 100);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function billboardTexture(lines: [string, string], hue: number): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 288;
  const g = c.getContext("2d")!;
  const grad = g.createLinearGradient(0, 0, 512, 288);
  grad.addColorStop(0, `hsl(${hue} 90% 22%)`);
  grad.addColorStop(1, `hsl(${(hue + 60) % 360} 90% 14%)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, 512, 288);
  g.strokeStyle = `hsl(${hue} 100% 65%)`;
  g.lineWidth = 6;
  g.strokeRect(10, 10, 492, 268);
  g.fillStyle = "rgba(255,255,255,0.06)";
  for (let y = 0; y < 288; y += 4) g.fillRect(0, y, 512, 1);
  g.textAlign = "center";
  g.fillStyle = "#ffffff";
  g.shadowColor = `hsl(${hue} 100% 70%)`;
  g.shadowBlur = 18;
  g.font = '800 46px "Orbitron", system-ui, sans-serif';
  g.fillText(lines[0], 256, 140, 470);
  g.shadowBlur = 0;
  g.fillStyle = `hsl(${hue} 100% 80%)`;
  g.font = '600 26px "Rajdhani", system-ui, sans-serif';
  g.fillText(lines[1], 256, 196, 470);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function Storefront({ poi }: { poi: Poi }) {
  const { x, z, nx, nz } = poi.facade;
  const rotY = nx === 1 ? Math.PI / 2 : nx === -1 ? -Math.PI / 2 : nz === 1 ? 0 : Math.PI;
  const tex = useMemo(() => neonTexture(poi.sign, poi.color), [poi]);
  const out = (d: number) => [x + nx * d, z + nz * d] as const;
  const [sx, sz] = out(0.12);
  const [dx, dz] = out(0.06);
  const [lx, lz] = out(3);
  return (
    <group>
      <mesh position={[sx, 5.2, sz]} rotation={[0, rotY, 0]}>
        <planeGeometry args={[7.2, 1.35]} />
        <meshBasicMaterial map={tex} transparent toneMapped={false} depthWrite={false} color={new THREE.Color(1.6, 1.6, 1.6)} />
      </mesh>
      {/* Doorway glow */}
      <mesh position={[dx, 1.5, dz]} rotation={[0, rotY, 0]}>
        <planeGeometry args={[3.2, 3]} />
        <meshBasicMaterial color={poi.color} toneMapped={false} transparent opacity={0.85} />
      </mesh>
      <mesh position={[dx + nx * 0.02, 1.5, dz + nz * 0.02]} rotation={[0, rotY, 0]}>
        <planeGeometry args={[2.6, 2.5]} />
        <meshBasicMaterial color="#05060a" />
      </mesh>
      <pointLight position={[lx, 3.2, lz]} color={poi.color} intensity={28} distance={16} decay={1.6} />
    </group>
  );
}

function Billboard({ x, y, z, rotY, w, h, texture, phase }: { x: number; y: number; z: number; rotY: number; w: number; h: number; texture: THREE.Texture; phase: number }) {
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(({ clock }) => {
    if (!mat.current) return;
    const t = clock.elapsedTime + phase;
    // Holo flicker: mostly steady, occasional dip.
    mat.current.opacity = 0.82 + Math.sin(t * 2.1) * 0.05 - (Math.sin(t * 13.7) > 0.97 ? 0.35 : 0);
  });
  return (
    <mesh position={[x, y, z]} rotation={[0, rotY, 0]}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial ref={mat} map={texture} transparent toneMapped={false} side={THREE.DoubleSide} color={new THREE.Color(1.3, 1.3, 1.3)} depthWrite={false} />
    </mesh>
  );
}

export function Storefronts({ ads }: { ads: [string, string][] }) {
  const [fontsReady, setFontsReady] = useState(false);
  useEffect(() => {
    let live = true;
    const done = () => live && setFontsReady(true);
    Promise.all([document.fonts?.load?.('800 104px "Orbitron"'), document.fonts?.load?.('600 26px "Rajdhani"')]).then(done, done);
    return () => {
      live = false;
    };
  }, []);
  const textures = useMemo(() => (fontsReady ? ads.map((a, i) => billboardTexture(a, (i * 67 + 190) % 360)) : []), [ads, fontsReady]);
  if (!fontsReady) return null;
  return (
    <group>
      {POIS.map((p) => (
        <Storefront key={p.id} poi={p} />
      ))}
      {textures.length > 0 &&
        BILLBOARDS.map((b) => <Billboard key={b.slot} {...b} texture={textures[b.slot % textures.length]} phase={b.slot * 1.7} />)}
    </group>
  );
}
