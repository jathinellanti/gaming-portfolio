import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ChunkManager, type Materials } from "./ChunkManager";
import { getAtlasTexture } from "./atlas";
import { runtime, daylight } from "../runtime";
import { useBlock } from "../store";

// Mounts the streamed chunk meshes. Materials are unlit; day/night scales their
// colour (emissive blocks are exempt), the way classic block games light the world.
export function WorldView() {
  const renderDistance = useBlock((s) => s.renderDistance);
  const materials = useMemo<Materials>(() => {
    const map = getAtlasTexture();
    return {
      opaque: new THREE.MeshBasicMaterial({ map, vertexColors: true }),
      cutout: new THREE.MeshBasicMaterial({ map, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide }),
      water: new THREE.MeshBasicMaterial({ map, vertexColors: true, transparent: true, opacity: 0.78, depthWrite: false, side: THREE.DoubleSide }),
      emissive: new THREE.MeshBasicMaterial({ map, vertexColors: true }),
    };
  }, []);

  const [manager, setManager] = useState<ChunkManager | null>(null);
  useEffect(() => {
    const m = new ChunkManager(materials);
    runtime.manager = m;
    runtime.ready = false;
    setManager(m);
    return () => {
      m.dispose();
      if (runtime.manager === m) runtime.manager = null;
    };
  }, [materials]);

  useEffect(() => {
    if (manager) manager.radius = renderDistance;
  }, [manager, renderDistance]);

  const frame = useRef(0);
  useFrame(() => {
    if (!manager) return;
    if (frame.current++ % 3 === 0) manager.update(runtime.body.x, runtime.body.z);
    const d = 0.2 + daylight(runtime.time) * 0.8;
    (materials.opaque as THREE.MeshBasicMaterial).color.setScalar(d);
    (materials.cutout as THREE.MeshBasicMaterial).color.setScalar(d);
    (materials.water as THREE.MeshBasicMaterial).color.setScalar(d);
    if (!runtime.ready && manager.isLoaded(runtime.body.x, runtime.body.z)) runtime.ready = true;
  });

  return manager ? <primitive object={manager.group} /> : null;
}
