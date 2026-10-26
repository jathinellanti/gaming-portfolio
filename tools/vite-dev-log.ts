import type { Plugin } from "vite";
import { appendFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

// Dev-only sink: the browser logger POSTs batches here and they land in one fixed file.
const MAX_BODY = 64 * 1024;
export const LOG_PATH = resolve(process.cwd(), "logs/app.log");

export function formatLogLines(body: unknown): string | null {
  if (!Array.isArray(body)) return null;
  if (!body.every((e) => typeof e === "object" && e !== null && !Array.isArray(e))) return null;
  return body.map((e) => JSON.stringify(e) + "\n").join("");
}

export function devLogPlugin(): Plugin {
  return {
    name: "jp-dev-log",
    apply: "serve",
    configureServer(server) {
      mkdirSync(resolve(process.cwd(), "logs"), { recursive: true });
      server.middlewares.use("/__log", (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end();
          return;
        }
        let size = 0;
        let aborted = false;
        const chunks: Buffer[] = [];
        req.on("data", (c: Buffer) => {
          if (aborted) return;
          size += c.length;
          if (size > MAX_BODY) {
            aborted = true;
            res.statusCode = 413;
            res.end();
            req.destroy();
            return;
          }
          chunks.push(c);
        });
        req.on("end", () => {
          if (aborted) return;
          let parsed: unknown;
          try {
            parsed = JSON.parse(Buffer.concat(chunks).toString("utf8"));
          } catch {
            res.statusCode = 400;
            res.end();
            return;
          }
          const lines = formatLogLines(parsed);
          if (lines === null) {
            res.statusCode = 400;
            res.end();
            return;
          }
          appendFileSync(LOG_PATH, lines);
          res.statusCode = 204;
          res.end();
        });
      });
    },
  };
}
