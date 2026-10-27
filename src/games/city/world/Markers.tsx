import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { MARKERS, MARKER_RADIUS, groundY } from "./layout";
import { useCity } from "../store";

// Mission markers: a translucent glowing column with a ground ring and a turning
// diamond above it. Yellow until passed, then a cool green.

const columnMat = (color: string) =>
  new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    uniforms: { color: { value: new THREE.Color(color) } },
    vertexShader: `varying float vY; void main(){ vY = uv.y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `uniform vec3 color; varying float vY; void main(){ gl_FragColor = vec4(color, (1.0 - vY) * 0.55); }`,
  });

export function Markers() {
  const passed = useCity((s) => s.passed);
  const diamonds = useRef<(THREE.Mesh | null)[]>([]);
  const mats = useMemo(() => ({ open: columnMat("#ffd400"), done: columnMat("#5df2a8") }), []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    diamonds.current.forEach((d, i) => {
      if (!d) return;
      d.rotation.y = t * 1.6 + i;
      d.position.y = 3.3 + Math.sin(t * 2 + i) * 0.18; // relative to the marker group
    });
  });
  return (
    <group>
      {MARKERS.map((m, i) => {
        const done = passed.includes(m.id);
        const color = done ? "#5df2a8" : "#ffd400";
        const y = groundY(m.at[0], m.at[1]);
        return (
          <group key={m.id} position={[m.at[0], y, m.at[1]]}>
            <mesh position={[0, 1.4, 0]} material={done ? mats.done : mats.open}>
              <cylinderGeometry args={[MARKER_RADIUS * 0.62, MARKER_RADIUS * 0.62, 2.8, 32, 1, true]} />
            </mesh>
            <mesh rotation-x={-Math.PI / 2} position={[0, 0.03, 0]}>
              <ringGeometry args={[MARKER_RADIUS * 0.55, MARKER_RADIUS * 0.66, 40]} />
              <meshBasicMaterial color={color} toneMapped={false} transparent opacity={0.9} />
            </mesh>
            <mesh
              ref={(d) => {
                diamonds.current[i] = d;
              }}
              position={[0, 3.3, 0]}
            >
              <octahedronGeometry args={[0.42]} />
              <meshBasicMaterial color={color} toneMapped={false} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
