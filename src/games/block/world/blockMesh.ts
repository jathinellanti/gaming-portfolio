import * as THREE from "three";
import { blockDef } from "./blocks";
import { tileUV } from "./tiles";

// A single textured block (held item, hand). Faces get the same fixed shading
// as the world mesher so held blocks match placed ones.
const FACE_SHADE = [0.6, 0.6, 1, 0.5, 0.8, 0.8]; // BoxGeometry order: +x, -x, +y, -y, +z, -z

export function blockGeometry(id: number, size = 1): THREE.BoxGeometry {
  const def = blockDef(id);
  return tiledBox([def.side, def.side, def.top, def.bottom, def.side, def.side], size);
}

/** Box with one atlas tile on every face (crack overlay). */
export function tileBoxGeometry(tile: number, size = 1): THREE.BoxGeometry {
  return tiledBox([tile, tile, tile, tile, tile, tile], size, false);
}

function tiledBox(tiles: number[], size: number, shade = true): THREE.BoxGeometry {
  const g = new THREE.BoxGeometry(size, size, size);
  const uv = g.getAttribute("uv") as THREE.BufferAttribute;
  const colors = new Float32Array(24 * 3);
  for (let f = 0; f < 6; f++) {
    const [u0, v0, u1, v1] = tileUV(tiles[f]);
    for (let k = 0; k < 4; k++) {
      const i = f * 4 + k;
      uv.setXY(i, u0 + uv.getX(i) * (u1 - u0), v0 + uv.getY(i) * (v1 - v0));
      colors[i * 3] = colors[i * 3 + 1] = colors[i * 3 + 2] = shade ? FACE_SHADE[f] : 1;
    }
  }
  uv.needsUpdate = true;
  g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  return g;
}
