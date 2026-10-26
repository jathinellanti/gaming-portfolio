import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { blockDef } from "./blocks";
import { tileAverageColor } from "./atlas";
import { prefersReducedMotion } from "../../../platform/webgl";

// Block-break debris: a small pool of instanced cubes tinted by the block's texture.
const MAX = 96;
interface Bit {
  p: THREE.Vector3;
  v: THREE.Vector3;
  life: number;
}

const queue: { x: number; y: number; z: number; id: number }[] = [];
export function spawnBreakParticles(x: number, y: number, z: number, id: number) {
  if (!prefersReducedMotion()) queue.push({ x, y, z, id });
}

export function Particles() {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const bits = useMemo<Bit[]>(() => Array.from({ length: MAX }, () => ({ p: new THREE.Vector3(), v: new THREE.Vector3(), life: 0 })), []);
  const next = useRef(0);
  const m4 = useMemo(() => new THREE.Matrix4(), []);
  const scale = useMemo(() => new THREE.Vector3(), []);
  const q = useMemo(() => new THREE.Quaternion(), []);

  useFrame((_, dtRaw) => {
    const im = mesh.current;
    if (!im) return;
    const dt = Math.min(dtRaw, 0.05);
    while (queue.length) {
      const e = queue.shift()!;
      const color = tileAverageColor(blockDef(e.id).side);
      for (let k = 0; k < 14; k++) {
        const i = next.current++ % MAX;
        const b = bits[i];
        b.p.set(e.x + 0.2 + Math.random() * 0.6, e.y + 0.2 + Math.random() * 0.6, e.z + 0.2 + Math.random() * 0.6);
        b.v.set((Math.random() - 0.5) * 3, Math.random() * 3 + 1, (Math.random() - 0.5) * 3);
        b.life = 0.6 + Math.random() * 0.4;
        im.setColorAt(i, color.clone().multiplyScalar(0.75 + Math.random() * 0.35));
      }
      if (im.instanceColor) im.instanceColor.needsUpdate = true;
    }
    for (let i = 0; i < MAX; i++) {
      const b = bits[i];
      if (b.life > 0) {
        b.life -= dt;
        b.v.y -= 14 * dt;
        b.p.addScaledVector(b.v, dt);
      }
      const s = b.life > 0 ? 0.11 : 0;
      m4.compose(b.p, q, scale.set(s, s, s));
      im.setMatrixAt(i, m4);
    }
    im.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, MAX]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial />
    </instancedMesh>
  );
}
