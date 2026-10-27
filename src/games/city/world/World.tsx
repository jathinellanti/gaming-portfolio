import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { BLOCK, BLOCK_CENTRES, BUILDINGS, KERB, PALMS, PASTELS, ROAD, ROAD_LINES, SAND, SHORE_X, type Building } from "./layout";

// SUNSET BAY's static world: sunset sky, ocean, beach, streets, art-deco buildings
// and palms. Everything is merged or instanced: a handful of draw calls.

/** Sun direction: low over the sea (east, +x), a little south. */
export const SUN_DIR = new THREE.Vector3(1, 0.13, 0.32).normalize();

function Sky() {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: { sun: { value: SUN_DIR } },
        vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `varying vec3 vDir; uniform vec3 sun;
          void main(){
            float h = clamp(vDir.y, -0.2, 1.0);
            vec3 horizon = vec3(1.0, 0.72, 0.45);
            vec3 band = vec3(0.98, 0.55, 0.55);
            vec3 zenith = vec3(0.30, 0.42, 0.78);
            vec3 col = mix(horizon, band, smoothstep(0.0, 0.12, h));
            col = mix(col, zenith, smoothstep(0.1, 0.65, h));
            float s = max(dot(vDir, sun), 0.0);
            col += vec3(1.0, 0.75, 0.42) * pow(s, 8.0) * 0.55;
            col += vec3(1.0, 0.92, 0.75) * smoothstep(0.9965, 0.999, s);
            if (vDir.y < 0.0) col = mix(col, vec3(0.95, 0.6, 0.45), smoothstep(0.0, -0.15, vDir.y));
            gl_FragColor = vec4(col, 1.0);
          }`,
      }),
    [],
  );
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ camera }) => ref.current!.position.copy(camera.position));
  return (
    <mesh ref={ref} material={mat} renderOrder={-1}>
      <sphereGeometry args={[900, 32, 16]} />
    </mesh>
  );
}

function Ocean() {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { t: { value: 0 }, sun: { value: SUN_DIR }, fogColor: { value: new THREE.Color("#f3b48f") } },
        vertexShader: `uniform float t; varying vec3 vWorld; varying float vWave;
          void main(){
            vec3 p = position;
            vec4 w = modelMatrix * vec4(p,1.0);
            float wave = sin(w.x*0.08 + t*1.1)*0.28 + sin(w.z*0.11 - t*0.8)*0.2 + sin((w.x+w.z)*0.21 + t*1.7)*0.08;
            w.y += wave;
            vWave = wave; vWorld = w.xyz;
            gl_Position = projectionMatrix * viewMatrix * w;
          }`,
        fragmentShader: `uniform float t; uniform vec3 sun; uniform vec3 fogColor; varying vec3 vWorld; varying float vWave;
          float hash(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
          void main(){
            float shore = smoothstep(${SHORE_X.toFixed(1)}, ${(SHORE_X + 45).toFixed(1)}, vWorld.x);
            vec3 shallow = vec3(0.28, 0.78, 0.78);
            vec3 deep = vec3(0.10, 0.36, 0.55);
            vec3 col = mix(shallow, deep, shore) + vWave * 0.06;
            vec3 view = normalize(cameraPosition - vWorld);
            float fres = pow(1.0 - max(view.y, 0.0), 3.0);
            col = mix(col, vec3(1.0, 0.72, 0.55), fres * 0.55);
            // Sun glitter: sparkling cells along the sun's path.
            vec2 cell = floor(vWorld.xz * 1.6 + vec2(t*0.6, t*0.3));
            float sparkle = step(0.965, hash(cell)) * pow(max(dot(reflect(-view, vec3(0.0,1.0,0.0)), sun), 0.0), 24.0);
            col += vec3(1.0, 0.85, 0.55) * sparkle * 1.6;
            float dist = length(cameraPosition.xz - vWorld.xz);
            col = mix(col, fogColor, smoothstep(220.0, 760.0, dist));
            gl_FragColor = vec4(col, 1.0);
          }`,
      }),
    [],
  );
  useFrame(({ clock }) => (mat.uniforms.t.value = clock.elapsedTime));
  return (
    <mesh material={mat} rotation-x={-Math.PI / 2} position={[SHORE_X + 600, -0.35, 0]}>
      <planeGeometry args={[1200, 1600, 120, 160]} />
    </mesh>
  );
}

/** Repeating asphalt (subtle grain) as a canvas texture. */
function asphaltTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  g.fillStyle = "#54525a";
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 4000; i++) {
    g.fillStyle = Math.random() < 0.5 ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.09)";
    g.fillRect(Math.random() * 256, Math.random() * 256, 1 + Math.random() * 2, 1 + Math.random() * 2);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(30, 30);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function quad(x: number, z: number, w: number, d: number, y: number): THREE.BufferGeometry {
  return new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2).translate(x, y, z);
}

function Ground() {
  const { asphalt, markings, white, grass, crossings } = useMemo(() => {
    const span = 280;
    const roads: THREE.BufferGeometry[] = [];
    const yellow: THREE.BufferGeometry[] = [];
    const edge: THREE.BufferGeometry[] = [];
    const zebra: THREE.BufferGeometry[] = [];
    for (const r of ROAD_LINES) {
      roads.push(quad(r, 0, ROAD, span, 0.02), quad(0, r, span, ROAD, 0.021));
      // Markings between crossings: dashed centre line, solid edge lines.
      for (let i = 0; i < ROAD_LINES.length - 1; i++) {
        const a = ROAD_LINES[i] + ROAD / 2 + 2;
        const b = ROAD_LINES[i + 1] - ROAD / 2 - 2;
        for (let v = a; v < b - 3; v += 7) {
          yellow.push(quad(r, v + 1.5, 0.22, 3, 0.04), quad(v + 1.5, r, 3, 0.22, 0.041));
        }
        for (const s of [-1, 1]) edge.push(quad(r + s * (ROAD / 2 - 0.6), (a + b) / 2, 0.16, b - a, 0.04), quad((a + b) / 2, r + s * (ROAD / 2 - 0.6), b - a, 0.16, 0.041));
      }
      for (const c of ROAD_LINES)
        for (const s of [-1, 1])
          for (let k = -5; k <= 5; k++) {
            zebra.push(quad(r + k * 1.2, c + s * (ROAD / 2 + 1.4), 0.6, 2.4, 0.042), quad(c + s * (ROAD / 2 + 1.4), r + k * 1.2, 2.4, 0.6, 0.043));
          }
    }
    const lawns: THREE.BufferGeometry[] = [];
    for (const [x, z] of [
      [30, 30],
      [-30, -30],
    ])
      lawns.push(quad(x, z, BLOCK - 6, BLOCK - 6, KERB + 0.01));
    return {
      asphalt: mergeGeometries(roads)!,
      markings: mergeGeometries(yellow)!,
      white: mergeGeometries(edge)!,
      grass: mergeGeometries(lawns)!,
      crossings: mergeGeometries(zebra)!,
    };
  }, []);
  const asphaltMap = useMemo(() => asphaltTexture(), []);
  const foam = useRef<THREE.ShaderMaterial>(null);
  useFrame(({ clock }) => {
    if (foam.current) foam.current.uniforms.t.value = clock.elapsedTime;
  });
  return (
    <group>
      {/* Sidewalk/plaza base for the city, then sand to the waterline. */}
      <mesh rotation-x={-Math.PI / 2} position={[(SAND.minX - 160) / 2, 0, 0]}>
        <planeGeometry args={[SAND.minX + 160, 300]} />
        <meshStandardMaterial color="#e4d6c6" roughness={0.95} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[(SAND.minX + SHORE_X + 20) / 2, -0.02, 0]}>
        <planeGeometry args={[SHORE_X + 20 - SAND.minX, 1600]} />
        <meshStandardMaterial color="#f1d3a2" roughness={1} />
      </mesh>
      {/* Surf: a foam band that washes in and out at the waterline. */}
      <mesh rotation-x={-Math.PI / 2} position={[SHORE_X - 1, 0.01, 0]}>
        <planeGeometry args={[8, 1600, 1, 1]} />
        <shaderMaterial
          ref={foam}
          transparent
          depthWrite={false}
          uniforms={{ t: { value: 0 } }}
          vertexShader={`varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`}
          fragmentShader={`uniform float t; varying vec2 vUv;
            void main(){
              float edge = 0.55 + 0.25 * sin(t*0.7 + vUv.y*80.0) * 0.4 + 0.2 * sin(t*0.7);
              float a = smoothstep(edge - 0.18, edge, vUv.x) * (1.0 - smoothstep(edge, edge + 0.08, vUv.x));
              gl_FragColor = vec4(1.0, 1.0, 0.98, a * 0.85);
            }`}
        />
      </mesh>
      <mesh geometry={asphalt}>
        <meshStandardMaterial map={asphaltMap} roughness={0.85} />
      </mesh>
      <mesh geometry={markings}>
        <meshStandardMaterial color="#f2c14e" roughness={0.6} />
      </mesh>
      <mesh geometry={white}>
        <meshStandardMaterial color="#f4f1ea" roughness={0.6} />
      </mesh>
      <mesh geometry={crossings}>
        <meshStandardMaterial color="#f4f1ea" roughness={0.7} />
      </mesh>
      <mesh geometry={grass}>
        <meshStandardMaterial color="#86c26e" roughness={1} />
      </mesh>
      {/* Weather Plaza fountain. */}
      <group position={[30, 0, 30]}>
        <mesh position={[0, 0.35 + KERB, 0]}>
          <cylinderGeometry args={[4.2, 4.6, 0.7, 32]} />
          <meshStandardMaterial color="#f3ece2" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.66 + KERB, 0]}>
          <cylinderGeometry args={[3.8, 3.8, 0.05, 32]} />
          <meshStandardMaterial color="#5ec8d8" roughness={0.1} metalness={0.2} />
        </mesh>
      </group>
    </group>
  );
}

/** Pastel art-deco facade: white render, window rows, balcony trims. Tinted per building. */
function facadeTexture() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const g = c.getContext("2d")!;
  g.fillStyle = "#ffffff";
  g.fillRect(0, 0, 256, 256);
  // 4 bays x 4 floors per 12 m x 12 m tile.
  for (let f = 0; f < 4; f++) {
    g.fillStyle = "rgba(0,0,0,0.07)";
    g.fillRect(0, f * 64 + 58, 256, 6); // balcony/trim band
    for (let b = 0; b < 4; b++) {
      const x = b * 64 + 12;
      const y = f * 64 + 14;
      g.fillStyle = "#3b6f86";
      g.fillRect(x, y, 40, 36);
      const glass = g.createLinearGradient(0, y, 0, y + 36);
      glass.addColorStop(0, "rgba(255,220,180,0.55)");
      glass.addColorStop(1, "rgba(30,60,90,0.1)");
      g.fillStyle = glass;
      g.fillRect(x, y, 40, 36);
      g.fillStyle = "rgba(255,255,255,0.85)";
      g.fillRect(x + 19, y, 2, 36);
      g.fillRect(x, y + 17, 40, 2);
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

const TILE = 12;

function boxWorldUV(x: number, z: number, w: number, d: number, y0: number, y1: number, color: THREE.Color, out: { pos: number[]; uv: number[]; col: number[]; nor: number[]; ind: number[] }, roof = true) {
  const x0 = x - w / 2;
  const x1 = x + w / 2;
  const z0 = z - d / 2;
  const z1 = z + d / 2;
  const face = (a: number[], b: number[], c: number[], dd: number[], n: number[], u0: number, u1: number, isRoof = false) => {
    const base = out.pos.length / 3;
    for (const v of [a, b, c, dd]) out.pos.push(...v);
    for (let k = 0; k < 4; k++) out.nor.push(...n);
    if (isRoof) out.uv.push(0.02, 0.98, 0.03, 0.98, 0.03, 0.97, 0.02, 0.97);
    else out.uv.push(u0 / TILE, y0 / TILE, u1 / TILE, y0 / TILE, u1 / TILE, y1 / TILE, u0 / TILE, y1 / TILE);
    const tint = isRoof ? color.clone().multiplyScalar(0.82) : color;
    for (let k = 0; k < 4; k++) out.col.push(tint.r, tint.g, tint.b);
    out.ind.push(base, base + 1, base + 2, base, base + 2, base + 3);
  };
  face([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [1, 0, 0], z1, z0);
  face([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0], z0, z1);
  face([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1], x0, x1);
  face([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [0, 0, -1], -x1, -x0);
  if (roof) face([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], [0, 1, 0], 0, 0, true);
}

function Buildings() {
  const { geometry, material, trims } = useMemo(() => {
    const out = { pos: [] as number[], uv: [] as number[], col: [] as number[], nor: [] as number[], ind: [] as number[] };
    const trimGeos: THREE.BufferGeometry[] = [];
    const white = new THREE.Color("#ffffff");
    BUILDINGS.forEach((b: Building) => {
      const color = new THREE.Color(PASTELS[b.color]);
      const body = b.h * 0.86;
      boxWorldUV(b.x, b.z, b.w, b.d, 0, body, color, out);
      // Art-deco crown: a stepped top block and a parapet trim.
      boxWorldUV(b.x, b.z, b.w * b.crown, b.d * b.crown, body, b.h, color, out);
      trimGeos.push(new THREE.BoxGeometry(b.w + 0.5, 0.45, b.d + 0.5).translate(b.x, body + 0.2, b.z));
      trimGeos.push(new THREE.BoxGeometry(b.w + 0.3, 0.6, b.d + 0.3).translate(b.x, 3.6, b.z));
      if (b.fin) {
        // A vertical fin on the face that looks at the nearest road.
        const finX = b.x - b.w / 2 - 0.35;
        boxWorldUV(finX, b.z, 0.7, Math.min(3, b.d * 0.2), 4, b.h + 3, white, out, true);
      }
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(out.pos, 3));
    g.setAttribute("normal", new THREE.Float32BufferAttribute(out.nor, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(out.uv, 2));
    g.setAttribute("color", new THREE.Float32BufferAttribute(out.col, 3));
    g.setIndex(out.ind);
    g.computeBoundingSphere();
    const material = new THREE.MeshStandardMaterial({ map: facadeTexture(), vertexColors: true, roughness: 0.75, metalness: 0.02 });
    return { geometry: g, material, trims: mergeGeometries(trimGeos)! };
  }, []);
  return (
    <group>
      <mesh geometry={geometry} material={material} />
      <mesh geometry={trims}>
        <meshStandardMaterial color="#fffaf2" roughness={0.6} />
      </mesh>
    </group>
  );
}

/** Distant hills on the land side, for a horizon. */
function Hills() {
  const geometry = useMemo(() => {
    const parts: THREE.BufferGeometry[] = [];
    let s = 3;
    const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let k = 0; k < 26; k++) {
      const a = Math.PI * 0.55 + (k / 25) * Math.PI * 0.9;
      const d = 260 + r() * 120;
      const h = 30 + r() * 60;
      parts.push(new THREE.ConeGeometry(70 + r() * 60, h, 7).translate(Math.cos(a) * d, h / 2 - 2, Math.sin(a) * d));
    }
    return mergeGeometries(parts)!;
  }, []);
  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color="#b98a7d" roughness={1} flatShading />
    </mesh>
  );
}

function Palms() {
  const trunk = useRef<THREE.InstancedMesh>(null);
  const crown = useRef<THREE.InstancedMesh>(null);
  const { trunkGeo, crownGeo } = useMemo(() => {
    const trunkGeo = new THREE.CylinderGeometry(0.16, 0.28, 1, 7).translate(0, 0.5, 0);
    const fronds: THREE.BufferGeometry[] = [];
    for (let k = 0; k < 9; k++) {
      const f = new THREE.PlaneGeometry(4.6, 0.9, 8, 1);
      const p = f.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i) + 2.3; // 0..4.6 along the frond
        const taper = 1 - (x / 4.6) * 0.85;
        p.setXYZ(i, x, -0.07 * x * x, p.getY(i) * taper);
      }
      f.computeVertexNormals();
      fronds.push(f.rotateY((k / 9) * Math.PI * 2 + (k % 2) * 0.2));
    }
    return { trunkGeo, crownGeo: mergeGeometries(fronds)! };
  }, []);
  // Matrices are set as soon as both instanced meshes exist (ref callbacks below).
  const place = () => {
    if (!trunk.current || !crown.current) return;
    const o = new THREE.Object3D();
    const top = new THREE.Vector3();
    PALMS.forEach((p, i) => {
      o.position.set(p.x, 0, p.z);
      o.rotation.set(0, p.rot, 0);
      o.rotateZ(p.lean);
      o.scale.set(1, p.h, 1);
      o.updateMatrix();
      trunk.current!.setMatrixAt(i, o.matrix);
      top.set(0, 1, 0).applyMatrix4(o.matrix); // the trunk's tip (its geometry is 1 m tall)
      o.position.copy(top);
      o.rotation.set(0, p.rot * 3, 0);
      o.scale.set(1, 1, 1);
      o.updateMatrix();
      crown.current!.setMatrixAt(i, o.matrix);
    });
    trunk.current.instanceMatrix.needsUpdate = true;
    crown.current.instanceMatrix.needsUpdate = true;
  };
  return (
    <group>
      <instancedMesh
        ref={(m) => {
          trunk.current = m;
          place();
        }}
        args={[trunkGeo, undefined, PALMS.length]}
      >
        <meshStandardMaterial color="#8a6a4a" roughness={0.95} />
      </instancedMesh>
      <instancedMesh
        ref={(m) => {
          crown.current = m;
          place();
        }}
        args={[crownGeo, undefined, PALMS.length]}
      >
        <meshStandardMaterial color="#3f8a3c" roughness={0.8} side={THREE.DoubleSide} />
      </instancedMesh>
    </group>
  );
}

export function World() {
  return (
    <group>
      <Sky />
      <hemisphereLight args={["#ffd9b8", "#6b5878", 0.95]} />
      <directionalLight position={[SUN_DIR.x * 300, SUN_DIR.y * 300 + 60, SUN_DIR.z * 300]} intensity={2.4} color="#ffc08a" />
      <ambientLight intensity={0.18} color="#ffe2cc" />
      <fog attach="fog" args={["#f3b48f", 140, 620]} />
      <Ocean />
      <Hills />
      <Ground />
      <Buildings />
      <Palms />
      {/* Block footprints behind the buildings, so plazas and lots read as kerbed. */}
      {BLOCK_CENTRES.flatMap((x) =>
        BLOCK_CENTRES.map((z) => (
          <mesh key={`${x},${z}`} position={[x, KERB / 2, z]}>
            <boxGeometry args={[BLOCK, KERB, BLOCK]} />
            <meshStandardMaterial color="#d8cabb" roughness={0.95} />
          </mesh>
        )),
      )}
    </group>
  );
}
