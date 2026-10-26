import { generateChunk } from "./generate";
import { meshChunk, type ChunkMesh, type Neighborhood } from "./mesher";

// Terrain generation and meshing off the main thread. Messages:
//   { type: "gen", id, cx, cz }            → { type: "gen", id, cx, cz, data }
//   { type: "mesh", id, cx, cz, hood }     → { type: "mesh", id, cx, cz, mesh }
export type WorkerRequest = { type: "gen"; id: number; cx: number; cz: number } | { type: "mesh"; id: number; cx: number; cz: number; hood: Neighborhood };
export type WorkerResponse =
  | { type: "gen"; id: number; cx: number; cz: number; data: Uint8Array }
  | { type: "mesh"; id: number; cx: number; cz: number; mesh: ChunkMesh }
  | { type: "error"; id: number; message: string };

// Minimal worker-scope typing (the app compiles against the DOM lib, which conflicts with the WebWorker lib).
interface WorkerScope {
  onmessage: ((e: MessageEvent<WorkerRequest>) => void) | null;
  postMessage(message: WorkerResponse, transfer?: Transferable[]): void;
}
const ctx = self as unknown as WorkerScope;

ctx.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const m = e.data;
  try {
    if (m.type === "gen") {
      const data = generateChunk(m.cx, m.cz);
      ctx.postMessage({ type: "gen", id: m.id, cx: m.cx, cz: m.cz, data } satisfies WorkerResponse, [data.buffer]);
    } else {
      const mesh = meshChunk(m.hood);
      const transfer = Object.values(mesh).flatMap((a) => [a.positions.buffer, a.uvs.buffer, a.colors.buffer, a.indices.buffer]);
      ctx.postMessage({ type: "mesh", id: m.id, cx: m.cx, cz: m.cz, mesh } satisfies WorkerResponse, transfer);
    }
  } catch (err) {
    ctx.postMessage({ type: "error", id: m.id, message: String(err) } satisfies WorkerResponse);
  }
};
