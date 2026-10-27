import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { runtime } from "../runtime";
import { useBlock } from "../store";
import { stepBody, PLAYER } from "./physics";
import { raycastVoxels } from "./raycast";
import { breakTime, screenForBlock } from "./interact";
import { buildAvatar, poseAvatar, PLAYER_SKIN } from "./Avatar";
import { B, PLACEABLE, blockDef, isSolid } from "../world/blocks";
import { GUIDE_POS, PORTAL_BOX, REGIONS, inBox, isProtected, regionAt, regionById } from "../world/structures";
import { blockGeometry, tileBoxGeometry } from "../world/blockMesh";
import { getAtlasTexture } from "../world/atlas";
import { TILE_INDEX } from "../world/tiles";
import { spawnBreakParticles } from "../world/Particles";
import { prefersReducedMotion } from "../../../platform/webgl";
import { advanceSteps, footstep, land, newStepState, sfx } from "../../../platform/audio";
import { surfaceFor } from "../audio";

const REACH = 5;
const PLAZA_SPAWN = REGIONS[0].spawn;

function lookDir(yaw: number, pitch: number): [number, number, number] {
  return [-Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch)];
}

export function Player() {
  const { camera, scene } = useThree();
  const fov = useBlock((s) => s.fov);
  const hotbar = useBlock((s) => s.hotbar);
  const cameraMode = useBlock((s) => s.cameraMode);
  const reduce = useMemo(() => prefersReducedMotion(), []);

  // First-person hand + held block, parented to the camera and drawn on top.
  const hand = useMemo(() => {
    const g = new THREE.Group();
    const armMat = new THREE.MeshBasicMaterial({ color: "#c8946b", depthTest: false });
    const sleeveMat = new THREE.MeshBasicMaterial({ color: "#1f8a7a", depthTest: false });
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.62), armMat);
    const sleeve = new THREE.Mesh(new THREE.BoxGeometry(0.215, 0.215, 0.25), sleeveMat);
    sleeve.position.z = 0.22;
    arm.add(sleeve);
    arm.position.set(0.42, -0.36, -0.5);
    arm.rotation.set(0.25, -0.15, 0.1);
    const heldMat = new THREE.MeshBasicMaterial({ map: getAtlasTexture(), vertexColors: true, depthTest: false, transparent: true, alphaTest: 0.4 });
    const held = new THREE.Mesh(blockGeometry(PLACEABLE[0], 0.22), heldMat);
    held.position.set(0.4, -0.3, -0.68);
    held.rotation.set(0.1, Math.PI / 4 + 0.3, 0);
    for (const m of [arm, sleeve, held]) m.renderOrder = 20;
    g.add(arm, held);
    return { group: g, arm, held };
  }, []);

  const outline = useMemo(() => {
    const l = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.004, 1.004, 1.004)), new THREE.LineBasicMaterial({ color: "#000000", transparent: true, opacity: 0.55 }));
    l.visible = false;
    return l;
  }, []);

  const crack = useMemo(() => {
    const m = new THREE.Mesh(
      tileBoxGeometry(TILE_INDEX.destroy_0, 1.006),
      new THREE.MeshBasicMaterial({ map: getAtlasTexture(), vertexColors: true, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1 }),
    );
    m.visible = false;
    return m;
  }, []);

  const avatar = useMemo(() => buildAvatar(PLAYER_SKIN), []);

  useEffect(() => {
    camera.add(hand.group);
    scene.add(camera, outline, crack, avatar.root);
    return () => {
      camera.remove(hand.group);
      scene.remove(camera, outline, crack, avatar.root);
    };
  }, [camera, scene, hand, outline, crack, avatar]);

  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    cam.fov = fov;
    cam.near = 0.05;
    cam.far = 1000;
    cam.updateProjectionMatrix();
  }, [camera, fov]);

  useEffect(() => {
    hand.held.geometry.dispose();
    hand.held.geometry = blockGeometry(PLACEABLE[hotbar] ?? B.PLANKS, 0.22);
  }, [hotbar, hand]);

  const state = useRef({ breakKey: "", crackStage: -1, regionTick: 0, inPortal: false, walkPhase: 0 });
  const steps = useRef(newStepState());

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.1);
    runtime.fps = runtime.fps * 0.95 + (1 / Math.max(dtRaw, 1e-3)) * 0.05;
    const st = useBlock.getState();
    const input = runtime.input;
    const world = runtime.manager;
    const s = state.current;

    const tp = st.consumeTeleport();
    if (tp) {
      runtime.body = { ...runtime.body, x: tp[0], y: tp[1], z: tp[2], vx: 0, vy: 0, vz: 0 };
      runtime.yaw = tp[3];
      runtime.pitch = 0;
      runtime.ready = !!world?.isLoaded(tp[0], tp[2]);
    }

    const playing = st.screen === null;
    if (playing) {
      const sens = 0.0022 * st.sensitivity;
      runtime.yaw -= input.lookDX * sens;
      runtime.pitch -= input.lookDY * sens;
      const k = 2.4 * dt;
      if (input.has("ArrowLeft")) runtime.yaw += k;
      if (input.has("ArrowRight")) runtime.yaw -= k;
      if (input.has("ArrowUp")) runtime.pitch += k;
      if (input.has("ArrowDown")) runtime.pitch -= k;
      runtime.pitch = Math.max(-1.55, Math.min(1.55, runtime.pitch));
    }
    input.lookDX = input.lookDY = 0;
    if (input.wheel) {
      st.setHotbar(st.hotbar + input.wheel);
      input.wheel = 0;
    }
    if (input.flyToggleQueued) {
      input.flyToggleQueued = false;
      if (playing) {
        runtime.fly = !runtime.fly;
        st.say(runtime.fly ? "Flight on · double-tap Space to land" : "Flight off");
      }
    }

    // Freeze until the ground under the player exists.
    if (!world || !runtime.ready) {
      placeCamera(camera, hand, avatar, 0);
      return;
    }

    // Movement
    const fwd = playing ? (input.has("KeyW") ? 1 : 0) - (input.has("KeyS") ? 1 : 0) - input.touchMove[1] : 0;
    const strafe = playing ? (input.has("KeyD") ? 1 : 0) - (input.has("KeyA") ? 1 : 0) + input.touchMove[0] : 0;
    const sneak = playing && (input.has("ShiftLeft") || input.has("ShiftRight") || input.touchSneak);
    const sprint = playing && fwd > 0 && !sneak && (input.has("ControlLeft") || input.sprintLatched);
    const jump = playing && (input.has("Space") || input.touchJump);
    runtime.sneaking = sneak;
    runtime.sprinting = sprint;
    const before = runtime.body;
    runtime.body = stepBody(before, { forward: Math.max(-1, Math.min(1, fwd)), strafe: Math.max(-1, Math.min(1, strafe)), jump, sneak, sprint, fly: runtime.fly, yaw: runtime.yaw }, dt, {
      solid: world.isSolidAt,
      water: world.isWaterAt,
    });
    const b = runtime.body;
    if (b.y < -16) {
      st.requestTeleport([PLAZA_SPAWN[0], PLAZA_SPAWN[1], PLAZA_SPAWN[2], PLAZA_SPAWN[3]]);
      st.say("You fell out of the world. Back to spawn.");
    }
    const moved = Math.hypot(b.x - before.x, b.z - before.z);
    s.walkPhase += moved * 2.6;

    // Footsteps, jumps and landings, by the block underfoot (swimming splashes).
    if (!runtime.fly) {
      const grounded = b.onGround || b.inWater;
      const stride = b.inWater ? 1.4 : sprint ? 2.1 : sneak ? 1.1 : 1.6;
      const ev = advanceSteps(steps.current, moved, grounded, b.vy > 0, dt, stride);
      if (ev.step || ev.landed) {
        const surface = b.inWater ? "water" : surfaceFor(world.getBlock(Math.floor(b.x), Math.floor(b.y - 0.05), Math.floor(b.z)));
        if (ev.landed) land(surface, ev.landed);
        else footstep(surface, sprint ? 0.9 : sneak ? 0.2 : 0.6);
      }
      if (ev.jumped && !b.inWater) sfx("jump");
    }

    placeCamera(camera, hand, avatar, cameraMode, s.walkPhase, b.onGround && moved > 0.001 && !reduce);

    // Targeting
    const eye: [number, number, number] = [b.x, b.y + (sneak ? PLAYER.sneakEye : PLAYER.eye), b.z];
    const dir = lookDir(runtime.yaw, runtime.pitch);
    const hit = playing
      ? raycastVoxels(eye, dir, REACH, (x, y, z) => {
          const id = world.getBlock(x, y, z);
          return id > 0 && id !== B.WATER;
        })
      : null;
    runtime.target = hit;
    runtime.targetBlock = hit ? world.getBlock(hit.x, hit.y, hit.z) : 0;
    outline.visible = !!hit;
    if (hit) outline.position.set(hit.x + 0.5, hit.y + 0.5, hit.z + 0.5);

    // Breaking
    const key = hit ? `${hit.x},${hit.y},${hit.z}` : "";
    if (playing && hit && input.breaking) {
      if (key !== s.breakKey) {
        s.breakKey = key;
        runtime.breakProgress = 0;
      }
      const id = runtime.targetBlock;
      const protectedHere = isProtected(hit.x, hit.y, hit.z);
      if (protectedHere || !blockDef(id).breakable) {
        if (runtime.breakProgress === 0) st.say(protectedHere ? "This building is protected: it holds part of my CV." : `${blockDef(id).name} can't be broken.`);
        runtime.breakProgress = 0.0001;
      } else {
        runtime.breakProgress += dt / breakTime(id);
        runtime.swing = Math.max(runtime.swing, 0.6);
        if (runtime.breakProgress >= 1) {
          world.setBlock(hit.x, hit.y, hit.z, B.AIR);
          const above = world.getBlock(hit.x, hit.y + 1, hit.z);
          if (blockDef(above).bucket === "cross") world.setBlock(hit.x, hit.y + 1, hit.z, B.AIR);
          spawnBreakParticles(hit.x, hit.y, hit.z, id);
          sfx("break");
          runtime.breakProgress = 0;
          s.breakKey = "";
        }
      }
    } else {
      runtime.breakProgress = 0;
      s.breakKey = "";
    }
    const stage = runtime.breakProgress > 0.001 ? Math.min(9, Math.floor(runtime.breakProgress * 10)) : -1;
    crack.visible = stage >= 0 && !!hit;
    if (hit) crack.position.set(hit.x + 0.5, hit.y + 0.5, hit.z + 0.5);
    if (stage !== s.crackStage && stage >= 0) {
      crack.geometry.dispose();
      crack.geometry = tileBoxGeometry(TILE_INDEX[`destroy_${stage}` as keyof typeof TILE_INDEX], 1.006);
    }
    s.crackStage = stage;

    // Use (right click): interact or place
    while (input.useQueued > 0) {
      input.useQueued--;
      if (!playing || !hit) continue;
      runtime.swing = 1;
      const open = screenForBlock(runtime.targetBlock, hit.x, hit.y, hit.z);
      if (open) {
        st.open(open.screen, open.arg);
        continue;
      }
      const px = hit.x + hit.normal[0];
      const py = hit.y + hit.normal[1];
      const pz = hit.z + hit.normal[2];
      const existing = world.getBlock(px, py, pz);
      const replaceable = existing === B.AIR || existing === B.WATER || blockDef(existing).bucket === "cross";
      const intersects = px + 1 > b.x - 0.3 && px < b.x + 0.3 && pz + 1 > b.z - 0.3 && pz < b.z + 0.3 && py + 1 > b.y && py < b.y + PLAYER.height;
      if (!replaceable || intersects) continue;
      if (isProtected(px, py, pz)) {
        st.say("You can't build inside a CV building.");
        continue;
      }
      world.setBlock(px, py, pz, PLACEABLE[st.hotbar] ?? B.PLANKS);
      sfx("place");
    }
    runtime.swing = Math.max(0, runtime.swing - dt * 4);

    // Regions, portal, guide (a few times a second)
    if ((s.regionTick += dt) > 0.2) {
      s.regionTick = 0;
      const region = regionAt(b.x, b.y, b.z)?.id ?? null;
      if (region !== runtime.region) {
        runtime.region = region;
        st.setRegion(region);
        if (region && region !== "spawn") {
          const r = regionById(region);
          st.showTitle(r.name, r.subtitle);
          if (st.discover(region)) {
            st.pushToast("Region discovered!", r.name);
            st.chat(`You discovered ${r.name}.`);
          }
        }
      }
      const inPortal = inBox(Math.floor(b.x), Math.floor(b.y), Math.floor(b.z), PORTAL_BOX) || inBox(Math.floor(b.x), Math.floor(b.y + 1), Math.floor(b.z), PORTAL_BOX);
      if (inPortal && !s.inPortal && playing) {
        sfx("portal");
        st.open("exit");
      }
      s.inPortal = inPortal;
      const nearGuide = Math.hypot(b.x - GUIDE_POS[0], b.z - GUIDE_POS[2]) < 3 && Math.abs(b.y - GUIDE_POS[1]) < 2;
      if (nearGuide && playing) st.say("Press F to talk to the Guide", 400);
    }
  });

  // Hide the hand while a screen is open or in third person.
  useEffect(() => {
    hand.group.visible = cameraMode === 0;
  }, [cameraMode, hand]);

  return null;
}

const tmpV = new THREE.Vector3();

function placeCamera(
  camera: THREE.Camera,
  hand: { group: THREE.Group; arm: THREE.Mesh; held: THREE.Mesh },
  avatar: ReturnType<typeof buildAvatar>,
  mode: 0 | 1 | 2,
  walkPhase = 0,
  bobbing = false,
) {
  const b = runtime.body;
  const eyeH = runtime.sneaking ? PLAYER.sneakEye : PLAYER.eye;
  const bob = bobbing && mode === 0 ? Math.abs(Math.sin(walkPhase)) * 0.06 : 0;
  camera.rotation.order = "YXZ";
  const eye = tmpV.set(b.x, b.y + eyeH + bob, b.z);

  avatar.root.visible = mode !== 0;
  avatar.root.position.set(b.x, b.y, b.z);
  avatar.root.rotation.y = runtime.yaw;
  avatar.head.rotation.x = -runtime.pitch * 0.8;
  poseAvatar(avatar, walkPhase, bobbing || mode !== 0 ? Math.min(1, Math.hypot(b.vx, b.vz) / 4) : 0, runtime.swing);

  if (mode === 0) {
    camera.position.copy(eye);
    camera.rotation.set(runtime.pitch, runtime.yaw, 0);
  } else {
    const dir = lookDir(runtime.yaw, runtime.pitch);
    const sign = mode === 1 ? -1 : 1;
    let dist = 4;
    const world = runtime.manager;
    if (world) {
      const hit = raycastVoxels([eye.x, eye.y, eye.z], [dir[0] * sign, dir[1] * sign, dir[2] * sign], 4, (x, y, z) => isSolid(Math.max(0, world.getBlock(x, y, z))));
      if (hit) dist = Math.max(0.6, hit.distance - 0.25);
    }
    camera.position.set(eye.x + dir[0] * sign * dist, eye.y + dir[1] * sign * dist, eye.z + dir[2] * sign * dist);
    if (mode === 1) camera.rotation.set(runtime.pitch, runtime.yaw, 0);
    else camera.rotation.set(-runtime.pitch, runtime.yaw + Math.PI, 0);
  }

  // Hand sway + swing
  const swing = runtime.swing;
  hand.arm.rotation.x = 0.25 - Math.sin(swing * Math.PI) * 0.9;
  hand.held.rotation.x = 0.1 - Math.sin(swing * Math.PI) * 0.7;
  const sway = bobbing ? Math.sin(walkPhase) * 0.02 : 0;
  hand.group.position.set(sway, -Math.abs(sway), 0);
}
