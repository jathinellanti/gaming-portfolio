import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { neonRuntime, useNeon } from "../store";
import { stepWalker, EYE } from "./walker";
import { BOUND, COLLIDERS, POIS } from "../world/city";
import { prefersReducedMotion } from "../../../platform/webgl";
import { sfx } from "../../../platform/audio";

const INTERACT = 3.4;
const DISCOVER = 14;

export function Player() {
  const { camera } = useThree();
  const fov = useNeon((s) => s.fov);
  const reduce = useMemo(() => prefersReducedMotion(), []);
  const bob = useRef(0);
  const tick = useRef(0);

  useEffect(() => {
    neonRuntime.camera = camera;
    return () => {
      neonRuntime.camera = null;
    };
  }, [camera]);

  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    cam.fov = fov;
    cam.near = 0.08;
    cam.far = 1200;
    cam.updateProjectionMatrix();
  }, [camera, fov]);

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.1);
    const rt = neonRuntime;
    rt.fps = rt.fps * 0.95 + (1 / Math.max(dtRaw, 1e-3)) * 0.05;
    const st = useNeon.getState();
    const input = rt.input;

    const tp = st.consumeTeleport();
    if (tp) {
      rt.walker = { x: tp[0], y: 0, z: tp[1], vy: 0, onGround: true };
      rt.yaw = tp[2];
      rt.pitch = 0;
    }

    const playing = st.screen === null;
    if (playing) {
      const sens = 0.0022 * st.sensitivity;
      rt.yaw -= input.lookDX * sens;
      rt.pitch -= input.lookDY * sens;
      const k = 2.2 * dt;
      if (input.has("ArrowLeft")) rt.yaw += k;
      if (input.has("ArrowRight")) rt.yaw -= k;
      if (input.has("ArrowUp")) rt.pitch += k;
      if (input.has("ArrowDown")) rt.pitch -= k;
      rt.pitch = Math.max(-1.45, Math.min(1.45, rt.pitch));
    }
    input.lookDX = input.lookDY = 0;

    const { forward, strafe } = playing ? input.axes() : { forward: 0, strafe: 0 };
    const sprint = playing && (input.has("ShiftLeft") || input.touchSprint);
    const before = rt.walker;
    rt.walker = stepWalker(before, { forward, strafe, yaw: rt.yaw, sprint, jump: playing && (input.has("Space") || input.touchJump) }, dt, COLLIDERS, BOUND);
    const moved = Math.hypot(rt.walker.x - before.x, rt.walker.z - before.z);
    if (rt.walker.onGround && moved > 0.001 && !reduce) bob.current += moved * 2.4;

    const bobY = reduce ? 0 : Math.sin(bob.current) * 0.045;
    camera.rotation.order = "YXZ";
    camera.position.set(rt.walker.x, rt.walker.y + EYE + bobY, rt.walker.z);
    camera.rotation.set(rt.pitch, rt.yaw, reduce ? 0 : Math.sin(bob.current * 0.5) * 0.004);

    st.setScanning(playing && (input.has("Tab") || input.has("KeyQ")));

    if ((tick.current += dt) < 0.15) return;
    tick.current = 0;
    let near: string | null = null;
    for (const p of POIS) {
      const d = Math.hypot(p.at[0] - rt.walker.x, p.at[1] - rt.walker.z);
      if (d < INTERACT) near = p.id;
      if (d < DISCOVER && st.discover(p.id)) {
        st.toast("LOCATION DISCOVERED", p.name);
        sfx("toast");
      }
    }
    rt.nearPoi = near;
  });

  return null;
}
