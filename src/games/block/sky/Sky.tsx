import { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { runtime, daylight } from "../runtime";
import { useBlock } from "../store";

// Sky dome (zenith → horizon gradient + sunrise/sunset glow), square sun and moon,
// stars, a flat blocky cloud layer, and fog that matches the horizon colour.

const DAY_ZENITH = new THREE.Color("#5b8cf5");
const DAY_HORIZON = new THREE.Color("#a8cdfa");
const NIGHT_ZENITH = new THREE.Color("#04050d");
const NIGHT_HORIZON = new THREE.Color("#0d1428");
const SUNSET = new THREE.Color("#ff8a4c");

const SKY_VERT = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`;
const SKY_FRAG = /* glsl */ `
  uniform vec3 zenith; uniform vec3 horizon; uniform vec3 sunset; uniform vec3 sunDir; uniform float sunsetAmount;
  varying vec3 vDir;
  void main() {
    vec3 d = normalize(vDir);
    float h = d.y;
    vec3 c = mix(horizon, zenith, smoothstep(-0.02, 0.5, h));
    float glow = pow(max(dot(d, normalize(sunDir)), 0.0), 6.0) * sunsetAmount;
    c = mix(c, sunset, glow * smoothstep(0.45, -0.05, h));
    c = mix(c, horizon * 0.55, smoothstep(0.0, -0.4, h));
    gl_FragColor = vec4(c, 1.0);
    #include <colorspace_fragment>
  }`;

const CLOUD_VERT = /* glsl */ `
  varying vec2 vWorld; varying float vDist;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorld = wp.xz;
    vDist = length(wp.xz - cameraPosition.xz);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }`;
const CLOUD_FRAG = /* glsl */ `
  uniform sampler2D map; uniform float drift; uniform float bright; uniform float radius;
  varying vec2 vWorld; varying float vDist;
  void main() {
    vec2 uv = (vWorld + vec2(drift, 0.0)) / 384.0;
    float a = texture2D(map, uv).a;
    if (a < 0.5) discard;
    float fade = smoothstep(radius, radius * 0.55, vDist);
    gl_FragColor = vec4(vec3(bright), 0.82 * fade);
    #include <colorspace_fragment>
  }`;

function cloudTexture(): THREE.DataTexture {
  const size = 32;
  const data = new Uint8Array(size * size * 4);
  let s = 1234567;
  const rand = () => ((s = (s * 1103515245 + 12345) >>> 0) / 4294967296);
  // Blobs of cells, like the classic cloud layer.
  const cells = new Uint8Array(size * size);
  for (let k = 0; k < 26; k++) {
    const cx = Math.floor(rand() * size);
    const cy = Math.floor(rand() * size);
    const w = 2 + Math.floor(rand() * 5);
    const h = 1 + Math.floor(rand() * 3);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) cells[((cy + y) % size) * size + ((cx + x) % size)] = 1;
  }
  for (let i = 0; i < size * size; i++) {
    data[i * 4] = data[i * 4 + 1] = data[i * 4 + 2] = 255;
    data[i * 4 + 3] = cells[i] ? 255 : 0;
  }
  const t = new THREE.DataTexture(data, size, size);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.needsUpdate = true;
  return t;
}

function moonTexture(): THREE.DataTexture {
  const size = 8;
  const px = [
    "..####..",
    ".#####o.",
    "##o#####",
    "######o#",
    "#o######",
    "####o###",
    ".######.",
    "..####..",
  ];
  const data = new Uint8Array(size * size * 4);
  px.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      const i = ((size - 1 - y) * size + x) * 4;
      const v = ch === "o" ? 170 : 225;
      data[i] = v;
      data[i + 1] = v;
      data[i + 2] = v + 15;
      data[i + 3] = ch === "." ? 0 : 255;
    }),
  );
  const t = new THREE.DataTexture(data, size, size);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.needsUpdate = true;
  return t;
}

export function Sky() {
  const { scene, camera } = useThree();
  const renderDistance = useBlock((s) => s.renderDistance);

  const objects = useMemo(() => {
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(480, 32, 16),
      new THREE.ShaderMaterial({
        vertexShader: SKY_VERT,
        fragmentShader: SKY_FRAG,
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          zenith: { value: DAY_ZENITH.clone() },
          horizon: { value: DAY_HORIZON.clone() },
          sunset: { value: SUNSET.clone() },
          sunDir: { value: new THREE.Vector3(1, 0, 0) },
          sunsetAmount: { value: 0 },
        },
      }),
    );
    dome.renderOrder = -10;
    dome.frustumCulled = false;

    const sun = new THREE.Group();
    const sunCore = new THREE.Mesh(new THREE.PlaneGeometry(34, 34), new THREE.MeshBasicMaterial({ color: "#fff4c8", fog: false, depthWrite: false }));
    const sunHalo = new THREE.Mesh(new THREE.PlaneGeometry(64, 64), new THREE.MeshBasicMaterial({ color: "#ffe9a0", fog: false, transparent: true, opacity: 0.22, depthWrite: false }));
    sun.add(sunHalo, sunCore);
    const moon = new THREE.Mesh(new THREE.PlaneGeometry(26, 26), new THREE.MeshBasicMaterial({ map: moonTexture(), transparent: true, fog: false, depthWrite: false }));
    for (const m of [sunCore, sunHalo, moon]) m.renderOrder = -9;

    const starGeo = new THREE.BufferGeometry();
    const pos: number[] = [];
    let s = 42;
    const rand = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 700; i++) {
      const u = rand() * 2 - 1;
      const th = rand() * Math.PI * 2;
      const r = Math.sqrt(1 - u * u);
      pos.push(r * Math.cos(th) * 420, Math.abs(u) * 420, r * Math.sin(th) * 420);
    }
    starGeo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: "#ffffff", size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false }));
    stars.renderOrder = -9;
    stars.frustumCulled = false;

    const clouds = new THREE.Mesh(
      new THREE.PlaneGeometry(900, 900).rotateX(-Math.PI / 2),
      new THREE.ShaderMaterial({
        vertexShader: CLOUD_VERT,
        fragmentShader: CLOUD_FRAG,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        uniforms: { map: { value: cloudTexture() }, drift: { value: 0 }, bright: { value: 1 }, radius: { value: 300 } },
      }),
    );
    clouds.frustumCulled = false;
    clouds.renderOrder = 3;

    const fog = new THREE.Fog(DAY_HORIZON.clone(), 40, 80);
    return { dome, sun, moon, stars, clouds, fog };
  }, []);

  useEffect(() => {
    const { dome, sun, moon, stars, clouds, fog } = objects;
    scene.add(dome, sun, moon, stars, clouds);
    scene.fog = fog;
    return () => {
      scene.remove(dome, sun, moon, stars, clouds);
      scene.fog = null;
    };
  }, [scene, objects]);

  useFrame((_, dt) => {
    const st = useBlock.getState();
    runtime.time = (runtime.time + Math.min(dt, 0.1) / (st.dayLengthMin * 60)) % 1;
    const t = runtime.time;
    const day = daylight(t);
    const angle = t * Math.PI * 2;
    const sunDir = new THREE.Vector3(Math.cos(angle), Math.sin(angle), 0.18).normalize();
    const { dome, sun, moon, stars, clouds, fog } = objects;
    const u = (dome.material as THREE.ShaderMaterial).uniforms;
    (u.zenith.value as THREE.Color).copy(NIGHT_ZENITH).lerp(DAY_ZENITH, day);
    (u.horizon.value as THREE.Color).copy(NIGHT_HORIZON).lerp(DAY_HORIZON, day);
    (u.sunDir.value as THREE.Vector3).copy(sunDir);
    u.sunsetAmount.value = Math.max(0, 1 - Math.abs(Math.sin(angle)) * 3.2) * 0.9;

    const cam = camera.position;
    dome.position.copy(cam);
    sun.position.copy(cam).addScaledVector(sunDir, 400);
    sun.lookAt(cam);
    moon.position.copy(cam).addScaledVector(sunDir, -400);
    moon.lookAt(cam);
    stars.position.copy(cam);
    (stars.material as THREE.PointsMaterial).opacity = Math.max(0, 1 - day * 1.6);

    clouds.position.set(cam.x, 108, cam.z);
    const cu = (clouds.material as THREE.ShaderMaterial).uniforms;
    cu.drift.value += dt * 1.2;
    cu.bright.value = 0.35 + day * 0.65;
    cu.radius.value = Math.max(160, renderDistance * 16 * 2.2);

    fog.color.copy(u.horizon.value as THREE.Color);
    fog.near = renderDistance * 16 * 0.55;
    fog.far = renderDistance * 16 * 0.98;
  });

  return null;
}
