import { useEffect, useState } from "react";
import * as THREE from "three";
import { REGIONS } from "./structures";

// Wooden facade signs naming each building, drawn in the pixel font once it loads.
function signTexture(text: string): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 320;
  c.height = 64;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#6b4a28";
  ctx.fillRect(0, 0, 320, 64);
  ctx.fillStyle = "#8f6c3c";
  ctx.fillRect(4, 4, 312, 56);
  for (let y = 4; y < 60; y += 14) {
    ctx.fillStyle = "#7a5c33";
    ctx.fillRect(4, y + 12, 312, 2);
  }
  ctx.font = '700 30px "Pixelify Sans", monospace';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#3a2615";
  ctx.fillText(text, 162, 35);
  ctx.fillStyle = "#f6ecd2";
  ctx.fillText(text, 160, 33);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

export function Signs() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let live = true;
    const done = () => live && setReady(true);
    if (document.fonts?.load) document.fonts.load('700 30px "Pixelify Sans"').then(done, done);
    else done();
    return () => {
      live = false;
    };
  }, []);
  if (!ready) return null;
  return (
    <>
      {REGIONS.filter((r) => r.sign).map((r) => {
        const [x, y, z, facing] = r.sign!;
        const offset = facing === 1 ? 0.02 : 1 - 0.02;
        return (
          <mesh key={r.id} position={[x + 0.5, y + 0.5, z + offset]} rotation={[0, facing === 1 ? 0 : Math.PI, 0]}>
            <planeGeometry args={[5, 1]} />
            <meshBasicMaterial map={signTexture(r.name.toUpperCase())} />
          </mesh>
        );
      })}
    </>
  );
}
