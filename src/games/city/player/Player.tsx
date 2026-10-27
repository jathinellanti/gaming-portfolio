import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { cityRuntime } from "../runtime";
import { useCity } from "../store";
import { BOUNDS, BUILDINGS, CAR_COLORS, CAR_SPAWNS, MARKERS, MARKER_RADIUS, SAND, SOLIDS, groundY, type Box2 } from "../world/layout";
import { forwardSpeed, resolveCircle, stepCar, stepWalker, CAR } from "./physics";
import { CarModel } from "./CarModel";
import { advanceSteps, footstep, land, newStepState, sfx, startEngine, type EngineHandle } from "../../../platform/audio";
import { prefersReducedMotion } from "../../../platform/webgl";

// The player: on foot (third person, run cycle) or driving one of the parked cars,
// plus the camera rig, mission markers and contextual help.

const REACH = 3.6;
const EXIT_MAX_SPEED = 8;

/** Static solids, this frame's traffic, and every drivable car except `exclude` (the one being driven). */
const solids = (exclude = -1): Box2[] => [
  ...SOLIDS,
  ...cityRuntime.trafficBoxes,
  ...cityRuntime.cars.filter((_, k) => k !== exclude).map((c) => ({ minX: c.x - 1.2, maxX: c.x + 1.2, minZ: c.z - 1.2, maxZ: c.z + 1.2 })),
];

/** Camera collision: pull the camera in front of any building between it and the target. */
function clipToBuildings(target: THREE.Vector3, desired: THREE.Vector3): THREE.Vector3 {
  const dir = desired.clone().sub(target);
  const len = dir.length();
  dir.divideScalar(len || 1);
  for (let d = 0.6; d < len; d += 0.35) {
    const p = target.clone().addScaledVector(dir, d);
    for (const b of BUILDINGS) {
      if (p.y < b.h + 0.5 && Math.abs(p.x - b.x) < b.w / 2 + 0.3 && Math.abs(p.z - b.z) < b.d / 2 + 0.3) return target.clone().addScaledVector(dir, Math.max(0.6, d - 0.5));
    }
  }
  return desired;
}

function Character({ group }: { group: React.RefObject<THREE.Group | null> }) {
  const skin = "#c68b59";
  return (
    <group ref={group}>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, 0]}>
        <circleGeometry args={[0.55, 20]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.25} depthWrite={false} />
      </mesh>
      <group name="hips" position={[0, 0.95, 0]}>
        {/* Legs pivot at the hips. */}
        {[0.13, -0.13].map((z, i) => (
          <group key={z} name={`leg-${i}`} position={[0, 0, z]}>
            <mesh position={[0, -0.44, 0]}>
              <boxGeometry args={[0.2, 0.88, 0.2]} />
              <meshStandardMaterial color="#26304a" roughness={0.85} />
            </mesh>
            <mesh position={[0.05, -0.9, 0]}>
              <boxGeometry args={[0.32, 0.12, 0.2]} />
              <meshStandardMaterial color="#f4f4f4" roughness={0.6} />
            </mesh>
          </group>
        ))}
        <mesh position={[0, 0.36, 0]}>
          <boxGeometry args={[0.32, 0.72, 0.5]} />
          <meshStandardMaterial color="#2a9d8f" roughness={0.7} />
        </mesh>
        <mesh position={[0.165, 0.32, 0]}>
          <boxGeometry args={[0.02, 0.5, 0.18]} />
          <meshStandardMaterial color="#f7f3ea" roughness={0.7} />
        </mesh>
        {/* Arms pivot at the shoulders. */}
        {[0.33, -0.33].map((z, i) => (
          <group key={z} name={`arm-${i}`} position={[0, 0.66, z]}>
            <mesh position={[0, -0.32, 0]}>
              <boxGeometry args={[0.16, 0.62, 0.16]} />
              <meshStandardMaterial color="#2a9d8f" roughness={0.7} />
            </mesh>
            <mesh position={[0, -0.68, 0]}>
              <boxGeometry args={[0.12, 0.14, 0.12]} />
              <meshStandardMaterial color={skin} roughness={0.7} />
            </mesh>
          </group>
        ))}
        <mesh position={[0, 0.88, 0]}>
          <boxGeometry args={[0.28, 0.32, 0.28]} />
          <meshStandardMaterial color={skin} roughness={0.7} />
        </mesh>
        <mesh position={[-0.02, 1.06, 0]}>
          <boxGeometry args={[0.32, 0.1, 0.32]} />
          <meshStandardMaterial color="#1b1b1f" roughness={0.9} />
        </mesh>
      </group>
    </group>
  );
}

export function Player() {
  const { camera } = useThree();
  const body = useRef<THREE.Group>(null);
  const carRefs = useRef<(THREE.Group | null)[]>([]);
  const reduce = useMemo(() => prefersReducedMotion(), []);
  const s = useRef({ phase: 0, lastLook: 0, steps: newStepState(), wheelSpin: CAR_SPAWNS.map(() => 0), lastImpact: 0 });
  const engine = useRef<EngineHandle | null>(null);

  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    cam.fov = 64;
    cam.near = 0.1;
    cam.far = 1600;
    cam.updateProjectionMatrix();
    return () => engine.current?.stop();
  }, [camera]);

  useFrame(({ clock }, dtRaw) => {
    const dt = Math.min(dtRaw, 0.1);
    const rt = cityRuntime;
    rt.fps = rt.fps * 0.95 + (1 / Math.max(dtRaw, 1e-3)) * 0.05;
    const st = useCity.getState();
    const input = rt.input;
    const playing = st.screen === null;

    const tp = st.consumeTeleport();
    if (tp) {
      if (rt.driving >= 0) {
        const c = rt.cars[rt.driving];
        rt.cars[rt.driving] = { ...c, x: tp[0], z: tp[1], vx: 0, vz: 0 };
      } else rt.player = { ...rt.player, x: tp[0], z: tp[1], speed: 0 };
    }

    // Mouse / arrow look.
    if (playing) {
      const sens = 0.0024 * st.sensitivity;
      if (input.lookDX || input.lookDY) s.current.lastLook = clock.elapsedTime;
      rt.camYaw += input.lookDX * sens;
      rt.camPitch = Math.max(-0.15, Math.min(1.15, rt.camPitch + input.lookDY * sens));
      if (input.has("ArrowLeft")) rt.camYaw -= 2 * dt;
      if (input.has("ArrowRight")) rt.camYaw += 2 * dt;
    }
    input.lookDX = input.lookDY = 0;

    // Enter / leave a car.
    if (rt.useQueued) {
      rt.useQueued = false;
      if (playing && rt.driving < 0 && rt.nearCar >= 0) {
        rt.driving = rt.nearCar;
        sfx("door");
        engine.current = startEngine();
        st.setHelp(null);
      } else if (playing && rt.driving >= 0) {
        const c = rt.cars[rt.driving];
        if (Math.abs(forwardSpeed(c)) < EXIT_MAX_SPEED) {
          const lx = -Math.sin(c.heading);
          const lz = Math.cos(c.heading);
          const r = resolveCircle(c.x - lx * 2.2, c.z - lz * 2.2, 0.45, solids(rt.driving));
          rt.player = { ...rt.player, x: r.x, z: r.z, y: 0, vy: 0, speed: 0, facing: c.heading };
          rt.driving = -1;
          sfx("door");
          engine.current?.stop();
          engine.current = null;
        } else st.setHelp("Slow down to get out of the car.");
      }
    }

    const camTarget = new THREE.Vector3();
    let camDist = 4.6;
    let moving = false;

    if (rt.driving >= 0) {
      // ------------------------------------------------ driving
      const i = rt.driving;
      const { forward, strafe } = playing ? input.axes() : { forward: 0, strafe: 0 };
      const res = stepCar(rt.cars[i], { throttle: forward, steer: strafe, handbrake: playing && input.has("Space") }, dt, solids(i), BOUNDS);
      rt.cars[i] = res.car;
      const v = forwardSpeed(res.car);
      rt.speedKmh = Math.abs(v) * 3.6;
      if (res.impact > 7 && clock.elapsedTime - s.current.lastImpact > 0.4) {
        s.current.lastImpact = clock.elapsedTime;
        sfx("crash");
      }
      engine.current?.set(Math.abs(v) / CAR.maxForward, Math.max(0, forward));
      rt.player.x = res.car.x;
      rt.player.z = res.car.z;
      camTarget.set(res.car.x, 1.7, res.car.z);
      camDist = 8.6;
      // Chase camera: swing behind the car unless the player is steering the view.
      if (clock.elapsedTime - s.current.lastLook > 1.2 && Math.abs(v) > 2) {
        let d = res.car.heading - rt.camYaw;
        d = Math.atan2(Math.sin(d), Math.cos(d));
        rt.camYaw += d * Math.min(1, dt * 2.4);
        rt.camPitch += (0.2 - rt.camPitch) * Math.min(1, dt * 1.5);
      }
      if (body.current) body.current.visible = false;
      moving = Math.abs(v) > 1;
    } else {
      // ------------------------------------------------ on foot
      const { forward, strafe } = playing ? input.axes() : { forward: 0, strafe: 0 };
      const before = rt.player;
      rt.player = stepWalker(before, { forward, strafe, camYaw: rt.camYaw, sprint: playing && (input.has("ShiftLeft") || input.touchSprint), jump: playing && (input.has("Space") || input.touchJump) }, dt, solids(), BOUNDS);
      const p = rt.player;
      const moved = Math.hypot(p.x - before.x, p.z - before.z);
      const surface = p.x > SAND.minX ? "sand" : "stone";
      const ev = advanceSteps(s.current.steps, moved, p.onGround, p.vy > 0, dt, p.speed > 6 ? 2.2 : 1.5);
      if (ev.landed) land(surface, ev.landed);
      else if (ev.step) footstep(surface, p.speed > 6 ? 0.85 : 0.55);
      if (ev.jumped) sfx("jump");
      rt.speedKmh = 0;
      const gy = groundY(p.x, p.z);
      camTarget.set(p.x, 1.55 + gy + p.y, p.z);
      moving = p.speed > 0.2;

      // Body pose: face the way we move; swing limbs with speed.
      if (body.current) {
        body.current.visible = true;
        body.current.position.set(p.x, gy + p.y, p.z);
        body.current.rotation.y = -p.facing;
        s.current.phase += p.speed * dt * 2.1;
        const swing = reduce ? 0 : Math.sin(s.current.phase) * Math.min(1, p.speed / 4) * (p.speed > 6 ? 0.95 : 0.7);
        const hips = body.current.getObjectByName("hips");
        if (hips) hips.position.y = 0.95 + (reduce ? 0 : Math.abs(Math.sin(s.current.phase)) * 0.05 * Math.min(1, p.speed / 4));
        for (const [name, k] of [
          ["leg-0", 1],
          ["leg-1", -1],
          ["arm-0", -0.8],
          ["arm-1", 0.8],
        ] as const) {
          const limb = body.current.getObjectByName(name);
          if (limb) limb.rotation.z = p.onGround ? swing * k : k * 0.5;
        }
      }

      // Nearest car within reach.
      let best = -1;
      let bestD = REACH;
      rt.cars.forEach((c, k) => {
        const d = Math.hypot(c.x - p.x, c.z - p.z);
        if (d < bestD) {
          bestD = d;
          best = k;
        }
      });
      rt.nearCar = best;
      if (playing) st.setHelp(best >= 0 ? "Press F to get in the car." : st.helpSeen ? null : "WASD to run · Shift to sprint · Space to jump · F near a car to drive · ↑ phone");
    }

    // Cars: place every model, spin wheels, steer the front pair.
    rt.cars.forEach((c, k) => {
      const g = carRefs.current[k];
      if (!g) return;
      g.position.set(c.x, 0, c.z);
      g.rotation.y = -c.heading;
      s.current.wheelSpin[k] += forwardSpeed(c) * dt / 0.36;
      for (let w = 0; w < 4; w++) {
        const wheel = g.getObjectByName(`wheel-${w}`);
        if (!wheel) continue;
        wheel.rotation.z = -s.current.wheelSpin[k];
        wheel.rotation.y = w < 2 ? -c.steer * 0.5 : 0;
      }
    });

    // Mission markers: open on entry (walking, or driving slowly).
    const px = rt.player.x;
    const pz = rt.player.z;
    let inside: string | null = null;
    for (const m of MARKERS) {
      const d = Math.hypot(m.at[0] - px, m.at[1] - pz);
      if (d < MARKER_RADIUS) inside = m.id;
      if (d < MARKER_RADIUS && rt.inMarker !== m.id && playing && rt.speedKmh < 35) {
        rt.inMarker = m.id;
        st.openMission(m.id);
      }
    }
    if (!inside) rt.inMarker = null;

    // Camera rig.
    const cy = Math.cos(rt.camYaw);
    const sy = Math.sin(rt.camYaw);
    const desired = new THREE.Vector3(camTarget.x - cy * camDist * Math.cos(rt.camPitch), camTarget.y + camDist * Math.sin(rt.camPitch) + 0.4, camTarget.z - sy * camDist * Math.cos(rt.camPitch));
    const clipped = clipToBuildings(camTarget, desired);
    camera.position.lerp(clipped, 1 - Math.exp(-dt * (moving ? 10 : 6)));
    camera.lookAt(camTarget);
  });

  return (
    <group>
      <Character group={body} />
      {CAR_SPAWNS.map((c, k) => (
        <CarModel
          key={k}
          ref={(g) => {
            carRefs.current[k] = g;
          }}
          color={CAR_COLORS[c.color]}
          hero={c.hero}
        />
      ))}
    </group>
  );
}
