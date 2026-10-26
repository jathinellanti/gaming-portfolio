import { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { buildAvatar, GUIDE_SKIN } from "./Avatar";
import { GUIDE_POS } from "../world/structures";
import { runtime } from "../runtime";

// The plaza guide: turns to face the player, with a floating name tag.
function nameTag(text: string) {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 32;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.fillRect(0, 0, 128, 32);
  ctx.font = '600 20px "Pixelify Sans", monospace';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(text, 64, 17);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthWrite: false }));
  s.scale.set(1.2, 0.3, 1);
  return s;
}

export function Guide() {
  const { scene } = useThree();
  const parts = useMemo(() => buildAvatar(GUIDE_SKIN), []);
  const tag = useMemo(() => nameTag("Guide"), []);

  useEffect(() => {
    parts.root.position.set(GUIDE_POS[0], GUIDE_POS[1], GUIDE_POS[2]);
    tag.position.set(GUIDE_POS[0], GUIDE_POS[1] + 2.25, GUIDE_POS[2]);
    scene.add(parts.root, tag);
    return () => {
      scene.remove(parts.root, tag);
    };
  }, [scene, parts, tag]);

  useFrame((state) => {
    const dx = runtime.body.x - GUIDE_POS[0];
    const dz = runtime.body.z - GUIDE_POS[2];
    const target = Math.atan2(-dx, -dz);
    let d = target - parts.root.rotation.y;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    parts.root.rotation.y += d * 0.08;
    const t = state.clock.elapsedTime;
    parts.armL.rotation.x = Math.sin(t * 1.3) * 0.08;
    parts.armR.rotation.x = -Math.sin(t * 1.3) * 0.08;
    parts.head.rotation.x = Math.sin(t * 0.7) * 0.05;
  });

  return null;
}
