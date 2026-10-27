import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { CABLES, CAR_SIZE, LAMPS, MONORAIL_PILLARS, MONORAIL_Y, MONORAIL_Z, PARKED, PEDESTRIANS, VENTS, walkerAlong } from "./props";
import { BOUND } from "./city";

// Street level of the Sprawl: lamps with light pools, parked cars, a crowd on the
// sidewalks, sagging overhead cables, steam vents and the elevated monorail.
// Everything is instanced or merged (a handful of draw calls); layout is in props.ts.

const ACCENTS = ["#3ef0ff", "#ff3ea5", "#f3e600", "#b07cff"].map((c) => new THREE.Color(c));
const CAR_COLORS = ["#1c2233", "#3a1830", "#14303a", "#2b2b30", "#3a2a12"].map((c) => new THREE.Color(c));

const tmp = new THREE.Object3D();

/** A soft radial sprite, for light pools and steam. */
function radialTexture(inner: string, outer = "rgba(0,0,0,0)") {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, inner);
  grad.addColorStop(1, outer);
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function Lamps() {
  const pole = useRef<THREE.InstancedMesh>(null);
  const head = useRef<THREE.InstancedMesh>(null);
  const pool = useRef<THREE.InstancedMesh>(null);
  const poolTex = useMemo(() => radialTexture("rgba(170,215,255,0.55)"), []);
  useLayoutEffect(() => {
    LAMPS.forEach((l, i) => {
      const rot = Math.atan2(l.dx, l.dz);
      tmp.position.set(l.x, 3.4, l.z);
      tmp.rotation.set(0, rot, 0);
      tmp.updateMatrix();
      pole.current!.setMatrixAt(i, tmp.matrix);
      tmp.position.set(l.x + l.dx * 1.4, 6.55, l.z + l.dz * 1.4);
      tmp.updateMatrix();
      head.current!.setMatrixAt(i, tmp.matrix);
      tmp.position.set(l.x + l.dx * 1.6, 0.03, l.z + l.dz * 1.6);
      tmp.rotation.set(-Math.PI / 2, 0, 0);
      tmp.updateMatrix();
      pool.current!.setMatrixAt(i, tmp.matrix);
    });
    for (const m of [pole, head, pool]) m.current!.instanceMatrix.needsUpdate = true;
  }, []);
  // Pole + arm in one geometry: the arm reaches along local +z.
  const poleGeo = useMemo(() => {
    const p = new THREE.CylinderGeometry(0.07, 0.11, 6.8, 6);
    const arm = new THREE.BoxGeometry(0.08, 0.08, 1.6).translate(0, 3.15, 0.75);
    return mergeGeometries([p, arm])!;
  }, []);
  return (
    <group>
      <instancedMesh ref={pole} args={[poleGeo, undefined, LAMPS.length]}>
        <meshStandardMaterial color="#1a1d26" roughness={0.5} metalness={0.7} />
      </instancedMesh>
      <instancedMesh ref={head} args={[undefined, undefined, LAMPS.length]}>
        <boxGeometry args={[0.32, 0.1, 0.8]} />
        <meshBasicMaterial color="#d8ecff" toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={pool} args={[undefined, undefined, LAMPS.length]}>
        <planeGeometry args={[7, 7]} />
        <meshBasicMaterial map={poolTex} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </instancedMesh>
    </group>
  );
}

function ParkedCars() {
  const body = useRef<THREE.InstancedMesh>(null);
  const tail = useRef<THREE.InstancedMesh>(null);
  const headl = useRef<THREE.InstancedMesh>(null);
  const bodyGeo = useMemo(() => {
    const lower = new THREE.BoxGeometry(CAR_SIZE.length, 0.62, CAR_SIZE.width).translate(0, 0.55, 0);
    const cabin = new THREE.BoxGeometry(CAR_SIZE.length * 0.48, 0.5, CAR_SIZE.width * 0.86).translate(-0.25, 1.1, 0);
    return mergeGeometries([lower, cabin])!;
  }, []);
  useLayoutEffect(() => {
    PARKED.forEach((p, i) => {
      tmp.position.set(p.x, 0, p.z);
      tmp.rotation.set(0, p.rot, 0);
      tmp.updateMatrix();
      body.current!.setMatrixAt(i, tmp.matrix);
      body.current!.setColorAt(i, CAR_COLORS[p.color]);
      const fx = Math.cos(p.rot);
      const fz = -Math.sin(p.rot);
      tmp.position.set(p.x - fx * (CAR_SIZE.length / 2 + 0.01), 0.7, p.z - fz * (CAR_SIZE.length / 2 + 0.01));
      tmp.updateMatrix();
      tail.current!.setMatrixAt(i, tmp.matrix);
      tmp.position.set(p.x + fx * (CAR_SIZE.length / 2 + 0.01), 0.65, p.z + fz * (CAR_SIZE.length / 2 + 0.01));
      tmp.updateMatrix();
      headl.current!.setMatrixAt(i, tmp.matrix);
    });
    for (const m of [body, tail, headl]) m.current!.instanceMatrix.needsUpdate = true;
    if (body.current!.instanceColor) body.current!.instanceColor.needsUpdate = true;
  }, []);
  return (
    <group>
      <instancedMesh ref={body} args={[bodyGeo, undefined, PARKED.length]}>
        <meshStandardMaterial roughness={0.28} metalness={0.8} />
      </instancedMesh>
      <instancedMesh ref={tail} args={[undefined, undefined, PARKED.length]}>
        <boxGeometry args={[0.04, 0.12, CAR_SIZE.width * 0.9]} />
        <meshBasicMaterial color="#ff2a3d" toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={headl} args={[undefined, undefined, PARKED.length]}>
        <boxGeometry args={[0.04, 0.1, CAR_SIZE.width * 0.8]} />
        <meshBasicMaterial color="#cfe6ff" toneMapped={false} />
      </instancedMesh>
    </group>
  );
}

function Crowd() {
  const body = useRef<THREE.InstancedMesh>(null);
  const band = useRef<THREE.InstancedMesh>(null);
  const bodyGeo = useMemo(() => {
    const legs = new THREE.CylinderGeometry(0.15, 0.12, 0.85, 6).translate(0, 0.43, 0);
    const torso = new THREE.CylinderGeometry(0.24, 0.18, 0.72, 8).translate(0, 1.2, 0);
    const head = new THREE.SphereGeometry(0.12, 8, 6).translate(0, 1.7, 0);
    return mergeGeometries([legs, torso, head])!;
  }, []);
  useLayoutEffect(() => {
    PEDESTRIANS.forEach((p, i) => band.current!.setColorAt(i, ACCENTS[p.accent]));
    if (band.current!.instanceColor) band.current!.instanceColor.needsUpdate = true;
  }, []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    PEDESTRIANS.forEach((p, i) => {
      const along = walkerAlong(p, t);
      const bob = Math.abs(Math.sin(t * 5.5 * Math.abs(p.speed) + p.phase)) * 0.05;
      const heading = p.speed > 0 ? 0 : Math.PI;
      if (p.axis === "x") tmp.position.set(along, bob, p.line + p.offset);
      else tmp.position.set(p.line + p.offset, bob, along);
      tmp.rotation.set(0, p.axis === "x" ? heading : heading + Math.PI / 2, 0);
      tmp.updateMatrix();
      body.current!.setMatrixAt(i, tmp.matrix);
      tmp.position.y += 1.32;
      tmp.updateMatrix();
      band.current!.setMatrixAt(i, tmp.matrix);
    });
    body.current!.instanceMatrix.needsUpdate = true;
    band.current!.instanceMatrix.needsUpdate = true;
  });
  return (
    <group>
      <instancedMesh ref={body} args={[bodyGeo, undefined, PEDESTRIANS.length]} frustumCulled={false}>
        <meshStandardMaterial color="#0d0f16" roughness={0.6} metalness={0.2} />
      </instancedMesh>
      <instancedMesh ref={band} args={[undefined, undefined, PEDESTRIANS.length]} frustumCulled={false}>
        <cylinderGeometry args={[0.245, 0.245, 0.05, 10, 1, true]} />
        <meshBasicMaterial toneMapped={false} side={THREE.DoubleSide} />
      </instancedMesh>
    </group>
  );
}

function Cables() {
  const geometry = useMemo(() => {
    const pts: number[] = [];
    for (const c of CABLES) {
      const n = 12;
      for (let k = 0; k < n; k++)
        for (const s of [k, k + 1]) {
          const t = s / n;
          pts.push(c.a[0] + (c.b[0] - c.a[0]) * t, c.a[1] + (c.b[1] - c.a[1]) * t - Math.sin(Math.PI * t) * c.sag, c.a[2] + (c.b[2] - c.a[2]) * t);
        }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, []);
  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color="#05060a" />
    </lineSegments>
  );
}

function Steam() {
  const PER = 22;
  const ref = useRef<THREE.Points>(null);
  const tex = useMemo(() => radialTexture("rgba(255,255,255,0.9)"), []);
  const { positions, seeds } = useMemo(() => {
    const positions = new Float32Array(VENTS.length * PER * 3);
    const seeds = new Float32Array(VENTS.length * PER);
    for (let i = 0; i < seeds.length; i++) seeds[i] = Math.random();
    return { positions, seeds };
  }, []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    VENTS.forEach(([x, z], v) => {
      for (let k = 0; k < PER; k++) {
        const i = v * PER + k;
        const life = (t * 0.22 + seeds[i]) % 1;
        positions[i * 3] = x + Math.sin(seeds[i] * 40 + t * 0.6) * (0.4 + life * 1.6);
        positions[i * 3 + 1] = life * 7;
        positions[i * 3 + 2] = z + Math.cos(seeds[i] * 30 + t * 0.5) * (0.4 + life * 1.6);
      }
    });
    ref.current!.geometry.attributes.position.needsUpdate = true;
  });
  return (
    <points ref={ref} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial map={tex} size={3.2} color="#9fb2e6" transparent opacity={0.16} depthWrite={false} sizeAttenuation />
    </points>
  );
}

function Monorail() {
  const train = useRef<THREE.Group>(null);
  const span = 2 * (BOUND + 30);
  useFrame(({ clock }) => {
    const x = ((clock.elapsedTime * 13) % span) - span / 2;
    train.current!.position.set(x, MONORAIL_Y + 1.6, MONORAIL_Z);
  });
  return (
    <group>
      {/* Track beam with a neon underline, and gantry legs on both sidewalks. */}
      <mesh position={[0, MONORAIL_Y, MONORAIL_Z]}>
        <boxGeometry args={[span, 0.9, 2.4]} />
        <meshStandardMaterial color="#161922" roughness={0.6} metalness={0.5} />
      </mesh>
      <mesh position={[0, MONORAIL_Y - 0.48, MONORAIL_Z]}>
        <boxGeometry args={[span, 0.06, 0.12]} />
        <meshBasicMaterial color="#b07cff" toneMapped={false} />
      </mesh>
      {MONORAIL_PILLARS.map(([x, z], i) => (
        <mesh key={i} position={[x, MONORAIL_Y / 2, z]}>
          <boxGeometry args={[0.8, MONORAIL_Y, 0.8]} />
          <meshStandardMaterial color="#12141b" roughness={0.7} metalness={0.4} />
        </mesh>
      ))}
      {MONORAIL_PILLARS.filter((_, i) => i % 2 === 0).map(([x], i) => (
        <mesh key={`beam${i}`} position={[x, MONORAIL_Y - 0.9, MONORAIL_Z]}>
          <boxGeometry args={[0.8, 0.9, 13.6]} />
          <meshStandardMaterial color="#12141b" roughness={0.7} metalness={0.4} />
        </mesh>
      ))}
      <group ref={train}>
        {[-12.2, 0, 12.2].map((dx) => (
          <group key={dx} position={[dx, 0, 0]}>
            <mesh>
              <boxGeometry args={[11.8, 2.6, 2.7]} />
              <meshStandardMaterial color="#1d2130" roughness={0.3} metalness={0.8} />
            </mesh>
            <mesh position={[0, 0.25, 1.36]}>
              <boxGeometry args={[10.6, 0.7, 0.02]} />
              <meshBasicMaterial color="#7fe9ff" toneMapped={false} />
            </mesh>
            <mesh position={[0, 0.25, -1.36]}>
              <boxGeometry args={[10.6, 0.7, 0.02]} />
              <meshBasicMaterial color="#7fe9ff" toneMapped={false} />
            </mesh>
          </group>
        ))}
        <mesh position={[18.3, -0.2, 0]}>
          <boxGeometry args={[0.05, 0.4, 1.8]} />
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

export function StreetLife({ crowd = true }: { crowd?: boolean }) {
  return (
    <group>
      <Lamps />
      <ParkedCars />
      {crowd && <Crowd />}
      <Cables />
      <Steam />
      <Monorail />
    </group>
  );
}
