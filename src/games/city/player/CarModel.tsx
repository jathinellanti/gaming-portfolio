import { forwardRef, useMemo } from "react";
import * as THREE from "three";

// A stylised coupe: body, swept cabin, wheels (named so the driver code can spin and
// steer them), lights and a soft shadow. Local +x is forward, so a car group's
// rotation.y = -heading (heading convention: forward = (cos θ, sin θ)).

const glass = new THREE.MeshStandardMaterial({ color: "#1c2a3a", roughness: 0.08, metalness: 0.6 });
const tyre = new THREE.MeshStandardMaterial({ color: "#151517", roughness: 0.9 });
const rim = new THREE.MeshStandardMaterial({ color: "#d9dde3", roughness: 0.25, metalness: 0.9 });
const chrome = new THREE.MeshStandardMaterial({ color: "#eceff3", roughness: 0.2, metalness: 1 });
const headMat = new THREE.MeshBasicMaterial({ color: "#fff6d8", toneMapped: false });
const tailMat = new THREE.MeshBasicMaterial({ color: "#ff2b3a", toneMapped: false });

let shadowTex: THREE.CanvasTexture | null = null;
function shadowTexture() {
  if (shadowTex) return shadowTex;
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(32, 32, 4, 32, 32, 32);
  grad.addColorStop(0, "rgba(0,0,0,0.55)");
  grad.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  shadowTex = new THREE.CanvasTexture(c);
  return shadowTex;
}

export const WHEELS: [number, number][] = [
  [1.42, 0.86],
  [1.42, -0.86],
  [-1.32, 0.86],
  [-1.32, -0.86],
];

export const CarModel = forwardRef<THREE.Group, { color: string; hero?: boolean }>(function CarModel({ color, hero = false }, ref) {
  const paint = useMemo(() => new THREE.MeshStandardMaterial({ color, roughness: 0.22, metalness: 0.55 }), [color]);
  const low = hero ? 0.88 : 1;
  return (
    <group ref={ref}>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.03, 0]}>
        <planeGeometry args={[5.4, 2.8]} />
        <meshBasicMaterial map={shadowTexture()} transparent depthWrite={false} />
      </mesh>
      {/* Lower body, with a slightly lifted rear deck. */}
      <mesh material={paint} position={[0, 0.58 * low, 0]}>
        <boxGeometry args={[4.4, 0.56 * low, 1.86]} />
      </mesh>
      <mesh material={paint} position={[-1.35, 0.9 * low, 0]}>
        <boxGeometry args={[1.5, 0.16, 1.8]} />
      </mesh>
      {/* Cabin: glass greenhouse with a painted roof. */}
      <mesh material={glass} position={[-0.25, 1.08 * low, 0]}>
        <boxGeometry args={[hero ? 1.9 : 2.2, 0.46 * low, 1.6]} />
      </mesh>
      <mesh material={paint} position={[-0.3, 1.33 * low, 0]}>
        <boxGeometry args={[hero ? 1.5 : 1.8, 0.07, 1.58]} />
      </mesh>
      <mesh material={chrome} position={[0, 0.33, 0]}>
        <boxGeometry args={[4.42, 0.05, 1.88]} />
      </mesh>
      {/* Lights. */}
      {[0.62, -0.62].map((z) => (
        <mesh key={`h${z}`} material={headMat} position={[2.21, 0.66 * low, z]}>
          <boxGeometry args={[0.03, 0.12, 0.42]} />
        </mesh>
      ))}
      {[0.66, -0.66].map((z) => (
        <mesh key={`t${z}`} material={tailMat} position={[-2.21, 0.7 * low, z]}>
          <boxGeometry args={[0.03, 0.1, 0.38]} />
        </mesh>
      ))}
      {/* Wheels: named wheel-0..3 for spin and steer. */}
      {WHEELS.map(([x, z], i) => (
        <group key={i} name={`wheel-${i}`} position={[x, 0.36, z]}>
          <mesh material={tyre} rotation-x={Math.PI / 2}>
            <cylinderGeometry args={[0.36, 0.36, 0.26, 16]} />
          </mesh>
          <mesh material={rim} rotation-x={Math.PI / 2} position={[0, 0, z > 0 ? 0.135 : -0.135]}>
            <cylinderGeometry args={[0.22, 0.22, 0.02, 10]} />
          </mesh>
        </group>
      ))}
    </group>
  );
});
