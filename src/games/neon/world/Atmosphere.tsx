import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import { prefersReducedMotion } from "../../../platform/webgl";

// Night sky dome with horizon city-glow, purple exponential fog, a procedural
// environment for reflections (no HDR download), GPU rain, and flying traffic.

const SKY_VERT = /* glsl */ `
  varying vec3 vDir;
  void main() { vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const SKY_FRAG = /* glsl */ `
  varying vec3 vDir;
  void main() {
    float h = normalize(vDir).y;
    vec3 zenith = vec3(0.012, 0.008, 0.035);
    vec3 glow = vec3(0.32, 0.07, 0.28);
    vec3 amber = vec3(0.45, 0.16, 0.08);
    vec3 c = mix(glow, zenith, smoothstep(-0.02, 0.38, h));
    c = mix(c, amber, smoothstep(0.08, -0.04, h) * 0.6);
    gl_FragColor = vec4(c, 1.0);
    #include <colorspace_fragment>
  }`;

export function SkyAndFog() {
  const { scene } = useThree();
  const dome = useMemo(() => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(900, 32, 16), new THREE.ShaderMaterial({ vertexShader: SKY_VERT, fragmentShader: SKY_FRAG, side: THREE.BackSide, depthWrite: false, fog: false }));
    m.renderOrder = -10;
    m.frustumCulled = false;
    return m;
  }, []);
  useEffect(() => {
    scene.add(dome);
    scene.fog = new THREE.FogExp2("#1a0b26", 0.0105);
    return () => {
      scene.remove(dome);
      scene.fog = null;
    };
  }, [scene, dome]);
  useFrame(({ camera }) => dome.position.copy(camera.position));
  return (
    <>
      <hemisphereLight args={["#5a3a8a", "#0a0a12", 0.35]} />
      <ambientLight intensity={0.08} />
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={3} color="#ff3ea5" position={[30, 18, -40]} scale={[40, 10, 1]} />
        <Lightformer form="rect" intensity={3} color="#3ef0ff" position={[-40, 14, 30]} scale={[30, 8, 1]} />
        <Lightformer form="rect" intensity={2} color="#ffb547" position={[0, 30, 60]} scale={[60, 6, 1]} />
        <Lightformer form="ring" intensity={1.5} color="#b07cff" position={[0, 80, 0]} scale={40} />
      </Environment>
    </>
  );
}

const RAIN_VERT = /* glsl */ `
  attribute vec3 seed; // x, z offset in [-1,1], phase in [0,1]
  attribute float tip; // 0 = top of streak, 1 = bottom
  uniform float time; uniform vec3 cam; uniform float area; uniform float height;
  varying float vAlpha;
  void main() {
    float y = mod(seed.z * height - time * 26.0, height) - height * 0.35;
    vec3 p = vec3(cam.x + seed.x * area, cam.y + y - tip * 0.9, cam.z + seed.y * area);
    p.x += tip * 0.12;
    vAlpha = 0.28 * (1.0 - tip * 0.6);
    gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
  }`;
const RAIN_FRAG = /* glsl */ `
  varying float vAlpha;
  void main() { gl_FragColor = vec4(0.72, 0.86, 1.0, vAlpha); }`;

export function Rain({ count = 2600 }: { count?: number }) {
  const reduce = useMemo(() => prefersReducedMotion(), []);
  const lines = useMemo(() => {
    const seeds = new Float32Array(count * 2 * 3);
    const tips = new Float32Array(count * 2);
    const pos = new Float32Array(count * 2 * 3);
    for (let i = 0; i < count; i++) {
      const sx = Math.random() * 2 - 1;
      const sz = Math.random() * 2 - 1;
      const ph = Math.random();
      for (let k = 0; k < 2; k++) {
        seeds.set([sx, sz, ph], (i * 2 + k) * 3);
        tips[i * 2 + k] = k;
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("seed", new THREE.BufferAttribute(seeds, 3));
    g.setAttribute("tip", new THREE.BufferAttribute(tips, 1));
    const m = new THREE.ShaderMaterial({
      vertexShader: RAIN_VERT,
      fragmentShader: RAIN_FRAG,
      transparent: true,
      depthWrite: false,
      uniforms: { time: { value: 0 }, cam: { value: new THREE.Vector3() }, area: { value: 28 }, height: { value: 34 } },
    });
    const l = new THREE.LineSegments(g, m);
    l.frustumCulled = false;
    return l;
  }, [count]);
  useFrame(({ clock, camera }) => {
    const u = (lines.material as THREE.ShaderMaterial).uniforms;
    u.time.value = reduce ? 0 : clock.elapsedTime;
    (u.cam.value as THREE.Vector3).copy(camera.position);
  });
  return <primitive object={lines} />;
}

interface Car {
  axis: "x" | "z";
  lane: number;
  y: number;
  dir: 1 | -1;
  speed: number;
  offset: number;
}

export function Traffic({ count = 26 }: { count?: number }) {
  const body = useRef<THREE.InstancedMesh>(null);
  const tail = useRef<THREE.InstancedMesh>(null);
  const head = useRef<THREE.InstancedMesh>(null);
  const cars = useMemo<Car[]>(() => {
    let s = 31;
    const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    const lanes = [-42, 0, 42];
    return Array.from({ length: count }, () => ({ axis: r() < 0.5 ? "x" : "z", lane: lanes[Math.floor(r() * 3)] + (r() - 0.5) * 6, y: 24 + Math.floor(r() * 4) * 11, dir: r() < 0.5 ? 1 : -1, speed: 14 + r() * 12, offset: r() * 260 }));
  }, [count]);
  const m4 = useMemo(() => new THREE.Matrix4(), []);
  const q = useMemo(() => new THREE.Quaternion(), []);
  const p = useMemo(() => new THREE.Vector3(), []);
  const one = useMemo(() => new THREE.Vector3(1, 1, 1), []);
  const reduce = useMemo(() => prefersReducedMotion(), []);
  useFrame(({ clock }) => {
    if (!body.current || !tail.current || !head.current) return;
    const t = reduce ? 0 : clock.elapsedTime;
    cars.forEach((c, i) => {
      const along = (((c.offset + t * c.speed) % 260) + 260) % 260 - 130;
      const a = along * c.dir;
      const yaw = c.axis === "x" ? (c.dir > 0 ? -Math.PI / 2 : Math.PI / 2) : c.dir > 0 ? Math.PI : 0;
      q.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, yaw);
      const fx = c.axis === "x" ? a : c.lane;
      const fz = c.axis === "x" ? c.lane : a;
      p.set(fx, c.y + Math.sin(t * 0.8 + i) * 0.4, fz);
      m4.compose(p, q, one);
      body.current!.setMatrixAt(i, m4);
      const back = new THREE.Vector3(0, 0, 1.6).applyQuaternion(q);
      m4.compose(p.clone().add(back), q, one);
      tail.current!.setMatrixAt(i, m4);
      m4.compose(p.clone().sub(back), q, one);
      head.current!.setMatrixAt(i, m4);
    });
    body.current.instanceMatrix.needsUpdate = true;
    tail.current.instanceMatrix.needsUpdate = true;
    head.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <group>
      <instancedMesh ref={body} args={[undefined, undefined, count]} frustumCulled={false}>
        <boxGeometry args={[1.9, 0.9, 3.4]} />
        <meshStandardMaterial color="#1b1e2a" metalness={0.8} roughness={0.3} />
      </instancedMesh>
      <instancedMesh ref={tail} args={[undefined, undefined, count]} frustumCulled={false}>
        <boxGeometry args={[1.7, 0.18, 0.12]} />
        <meshBasicMaterial color={new THREE.Color(4, 0.25, 0.3)} toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={head} args={[undefined, undefined, count]} frustumCulled={false}>
        <boxGeometry args={[1.5, 0.14, 0.12]} />
        <meshBasicMaterial color={new THREE.Color(3, 3.2, 3.6)} toneMapped={false} />
      </instancedMesh>
    </group>
  );
}
