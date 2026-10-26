import * as THREE from "three";

// An original block-character: 8×8-pixel face, teal jacket, navy trousers.
// Proportions follow the classic 8/12/4-pixel body plan (1 px = 1/16 block × 2).
const PX = 1 / 16;
const SHADE = [0.62, 0.62, 1, 0.5, 0.82, 0.82]; // +x, -x, +y, -y, +z(front), -z

function pixelTexture(rows: string[], palette: Record<string, string>): THREE.CanvasTexture {
  const h = rows.length;
  const w = rows[0].length;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  rows.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      ctx.fillStyle = palette[ch] ?? "#ff00ff";
      ctx.fillRect(x, y, 1, 1);
    }),
  );
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export interface Skin {
  skin: string;
  hair: string;
  shirt: string;
  pants: string;
  shoes: string;
  eye: string;
}

export const PLAYER_SKIN: Skin = { skin: "#c8946b", hair: "#2b1d14", shirt: "#1f8a7a", pants: "#2f3a5a", shoes: "#3a3a3a", eye: "#2d4f8f" };
export const GUIDE_SKIN: Skin = { skin: "#b9825a", hair: "#7a7a7a", shirt: "#8f2d2d", pants: "#4a3520", shoes: "#2a1d10", eye: "#2f7a3a" };

function faceMaterials(skin: Skin) {
  const pal = { s: skin.skin, h: skin.hair, w: "#f2f2f2", e: skin.eye, m: "#8a5a3c", d: "#a8724e" };
  const front = pixelTexture(["hhhhhhhh", "hhhhhhhh", "hssssssh", "ssssssss", "swessews", "ssssssss", "ssdmmdss", "ssssssss"], pal);
  const side = pixelTexture(["hhhhhhhh", "hhhhhhhh", "hhhhhsss", "hhhhssss", "hhhsssss", "hhssssss", "hsssssss", "ssssssss"], pal);
  const back = pixelTexture(Array(8).fill("hhhhhhhh"), pal);
  const top = pixelTexture(Array(8).fill("hhhhhhhh"), pal);
  const chin = pixelTexture(Array(8).fill("ssssssss"), pal);
  const maps = [side, side, top, chin, front, back];
  return maps.map((map, i) => new THREE.MeshBasicMaterial({ map, color: new THREE.Color().setScalar(SHADE[i]) }));
}

function colorMaterials(color: string) {
  return SHADE.map((s) => new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(s) }));
}

export interface AvatarParts {
  root: THREE.Group;
  head: THREE.Group;
  armL: THREE.Group;
  armR: THREE.Group;
  legL: THREE.Group;
  legR: THREE.Group;
}

/** Build the model; feet at y=0, facing -Z. Joints are groups so limbs swing from the shoulder/hip. */
export function buildAvatar(skin: Skin): AvatarParts {
  const root = new THREE.Group();
  const box = (w: number, h: number, d: number, mats: THREE.Material[]) => new THREE.Mesh(new THREE.BoxGeometry(w * PX * 2, h * PX * 2, d * PX * 2), mats);
  const head = new THREE.Group();
  head.position.y = 24 * PX * 2;
  const headMesh = box(8, 8, 8, faceMaterials(skin));
  headMesh.position.y = 4 * PX * 2;
  headMesh.rotation.y = Math.PI; // face texture on -Z (forward)
  head.add(headMesh);

  const body = box(8, 12, 4, colorMaterials(skin.shirt));
  body.position.y = 18 * PX * 2;

  const limb = (x: number, color: string, top: number, h: number, cuff?: string) => {
    const g = new THREE.Group();
    g.position.set(x * PX * 2, top * PX * 2, 0);
    const m = box(4, h, 4, colorMaterials(color));
    m.position.y = (-h / 2) * PX * 2;
    g.add(m);
    if (cuff) {
      const c = box(4.1, 3, 4.1, colorMaterials(cuff));
      c.position.y = (-h + 1.5) * PX * 2;
      g.add(c);
    }
    return g;
  };
  const armL = limb(-6, skin.shirt, 24, 12, skin.skin);
  const armR = limb(6, skin.shirt, 24, 12, skin.skin);
  const legL = limb(-2, skin.pants, 12, 12, skin.shoes);
  const legR = limb(2, skin.pants, 12, 12, skin.shoes);
  root.add(head, body, armL, armR, legL, legR);
  return { root, head, armL, armR, legL, legR };
}

/** Animate a walk cycle: phase advances with distance walked. */
export function poseAvatar(p: AvatarParts, phase: number, amount: number, swing = 0) {
  const a = Math.sin(phase) * 0.7 * amount;
  p.legL.rotation.x = a;
  p.legR.rotation.x = -a;
  p.armL.rotation.x = -a;
  p.armR.rotation.x = a - swing * 1.2;
}
