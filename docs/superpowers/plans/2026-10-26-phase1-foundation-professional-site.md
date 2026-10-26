# Phase 1: Foundation + Professional Site, Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task by task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A deployable, recruiter-ready professional portfolio for Ellanti Jathin. It is built on a tested content and platform foundation that the three games (Phases 2–4) will plug into.

**Architecture:**
- A Vite + React 19 single-page app with react-router in data mode.
- All personal data lives in `src/content/`. It is validated with zod and read through a `ContentSource` interface.
- `src/platform/` holds cross-cutting services: faults, log, settings, save and WebGL detection.
- `src/site/` is the professional site. `src/play/` holds World Select; games are shown as "In development" this phase.

**Tech stack:**
| Package | Version |
|---|---|
| vite | 8.3.5 |
| react / react-dom | 19.3.1 |
| typescript | 6.0.3 (pinned: typescript-eslint needs a version below 6.1) |
| react-router | 8.5.0 |
| tailwindcss + @tailwindcss/vite | 4.3.3 |
| motion | 14.6.0 |
| zustand | 5.0.16 |
| zod | 4.6.7 |
| lucide-react | 1.61.0 |
| cmdk | 1.1.1 |
| vitest | 5.0.5 |
| jsdom | 30.1.3 |
| @testing-library/react | 16.3.3 |
| @playwright/test | 1.64.1 |
| eslint | 10.13.0 |
| typescript-eslint | 8.72.0 |
| eslint-plugin-react-hooks | 7.1.1 |

**Spec:** `docs/superpowers/specs/2026-10-26-dual-realm-portfolio-design.md`

## Global Constraints

- **No fabrication.**
  - Every personal fact comes from the resume PDF or the two repos (spec §2).
  - Unknown values use the spec §2.1 defaults.
  - Never "Unity Certified Programmer". Always "Unity Certified User: Programmer".
  - ELMS: never claim JWT or Nodemailer; they are not in its dependencies.
- **No secrets.** Never write the Weatherapp API key or the ELMS `MONGODB_URI` anywhere.
- **Not shown on the site:** phone number and street address.
- **Icons:** Lucide SVG only, never emoji, in the UI.
- **Motion:** 150–250 ms for UI and one easing curve, `cubic-bezier(0.2, 0, 0, 1)`. Honour `prefers-reduced-motion` via `<MotionConfig reducedMotion="user">` plus CSS.
- **Themes:** dark by default, light supported. The theme is set on `<html data-theme="dark|light">`.
- **Interaction states:** every interactive element has hover, focus-visible, active and disabled. Every async or optional panel has loading, empty (says why) and error.
- **Layout:** no horizontal page scroll at 360 px.
- **Imports:** no `three` and no `games/*` imports in this phase.
- **Tests:** `npm test` = `eslint . && tsc -b && vitest run`, never bypassed.
- **Git:** the owner opted out of git for now. "Checkpoint" steps run the suite instead of committing.
- **API knowledge:** any library API not shown in this plan must be checked with context7 before use.

---

## File Structure

```
package.json, vite.config.ts, tsconfig*.json, eslint.config.js, playwright.config.ts, index.html, vercel.json
tools/vite-dev-log.ts            dev-only middleware: POST /__log → logs/app.log
src/main.tsx                     mounts RouterProvider inside MotionConfig
src/router.tsx                   route table
src/content/
  schema.ts                      zod schemas, types, cross-reference checks
  data/profile.ts education.ts experience.ts skills.ts projects.ts achievements.ts caseStudies.ts skillTree.ts
  source.ts                      ContentSource, StaticContentSource, publicView()
  useContent.ts                  hook + provider
src/platform/
  faults.ts                      registry + raise()
  log.ts                         ring buffer + sinks
  storage.ts                     safe localStorage + versioned stores
  settings.ts                    zustand settings store (theme, sound, quality, lite)
  webgl.ts                       capability checks
  theme.ts                       applies data-theme
src/site/
  styles/index.css               Tailwind import, tokens (light/dark), base
  components/                    Button, Section, Chip, Card, CopyButton, EmptyState, Monogram, ThemeToggle, Palette
  layout/SiteLayout.tsx, Nav.tsx, Footer.tsx
  sections/Hero.tsx About.tsx Education.tsx Experience.tsx Skills.tsx Projects.tsx Certifications.tsx Contact.tsx
  sections/HeroPoster.tsx        hand-built SVG illustration of the three worlds
  pages/Home.tsx CvPage.tsx ProjectPage.tsx NotFound.tsx
  meta.tsx                       <PageMeta title description>
src/play/WorldSelect.tsx, worlds.ts, RealmTransition.tsx
tests/unit/*.test.ts(x)          Vitest
tests/e2e/*.spec.ts              Playwright
docs/UI_SPEC.md, ARCHITECTURE.md, README.md, docs/content-drafts/case-studies.md, public/assets/LICENSES.md
```

---

### Task 1: Scaffold, toolchain and the dev log sink

**Files:**
- Create:
  - `package.json`
  - `vite.config.ts`
  - `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`
  - `eslint.config.js`
  - `index.html`
  - `src/main.tsx` (temporary)
  - `src/vite-env.d.ts`
  - `tools/vite-dev-log.ts`
  - `.gitignore`
- Test: `tests/unit/devlog.test.ts`

**Interfaces:**
- Produces:
  - `devLogPlugin(): Plugin`, which accepts POST `/__log` with a JSON body of 64 KB at most.
  - It appends one line per entry to `logs/app.log`.
  - It responds 204 on success, 400 on bad JSON and 413 on an oversized body.
  - Exported helper `formatLogLines(body: unknown): string | null`, which returns null when the body isn't an array of objects.

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "jathin-portfolio",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview --port 4173 --strictPort",
    "lint": "eslint .",
    "typecheck": "tsc -b",
    "test": "eslint . && tsc -b && vitest run",
    "e2e": "playwright test"
  }
}
```

Install the dependencies, pinned to the versions in the header (`--save-exact`):

```bash
npm i --save-exact react@19.3.1 react-dom@19.3.1 react-router@8.5.0 motion@14.6.0 zustand@5.0.16 zod@4.6.7 lucide-react@1.61.0 cmdk@1.1.1 clsx@2.1.1
npm i -D --save-exact vite@8.3.5 @vitejs/plugin-react@6.1.2 typescript@6.0.3 tailwindcss@4.3.3 @tailwindcss/vite@4.3.3 vitest@5.0.5 jsdom@30.1.3 @testing-library/react@16.3.3 @testing-library/jest-dom@7.0.1 @testing-library/user-event eslint@10.13.0 typescript-eslint@8.72.0 eslint-plugin-react-hooks@7.1.1 globals@17.13.0 @playwright/test@1.64.1 @types/react@19.3.0 @types/react-dom@19.3.0 @types/node
```

- [ ] **Step 2: Write the failing test `tests/unit/devlog.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { formatLogLines } from "../../tools/vite-dev-log";

describe("formatLogLines", () => {
  it("formats an array of entries as JSON lines", () => {
    const out = formatLogLines([{ level: "info", event: "boot" }, { level: "warn", event: "x" }]);
    expect(out).toBe('{"level":"info","event":"boot"}\n{"level":"warn","event":"x"}\n');
  });
  it("rejects non-arrays", () => {
    expect(formatLogLines({ level: "info" })).toBeNull();
    expect(formatLogLines("boom")).toBeNull();
  });
  it("rejects arrays containing non-objects", () => {
    expect(formatLogLines([1, 2])).toBeNull();
  });
  it("accepts an empty array as no output", () => {
    expect(formatLogLines([])).toBe("");
  });
});
```

- [ ] **Step 3: Run it.** `npx vitest run tests/unit/devlog.test.ts`. Expected: FAIL, module not found.

- [ ] **Step 4: Implement `tools/vite-dev-log.ts`**

```ts
import type { Plugin } from "vite";
import { appendFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

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
        if (req.method !== "POST") { res.statusCode = 405; res.end(); return; }
        let size = 0;
        const chunks: Buffer[] = [];
        let aborted = false;
        req.on("data", (c: Buffer) => {
          size += c.length;
          if (size > MAX_BODY) { aborted = true; res.statusCode = 413; res.end(); req.destroy(); return; }
          chunks.push(c);
        });
        req.on("end", () => {
          if (aborted) return;
          let parsed: unknown;
          try { parsed = JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch { res.statusCode = 400; res.end(); return; }
          const lines = formatLogLines(parsed);
          if (lines === null) { res.statusCode = 400; res.end(); return; }
          appendFileSync(LOG_PATH, lines);
          res.statusCode = 204; res.end();
        });
      });
    },
  };
}
```

- [ ] **Step 5: Write `vite.config.ts`**, plus the tsconfigs, `eslint.config.js`, `index.html` and `.gitignore`.

```ts
// vite.config.ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { devLogPlugin } from "./tools/vite-dev-log";

export default defineConfig({
  plugins: [react(), tailwindcss(), devLogPlugin()],
  test: {
    environment: "jsdom",
    include: ["tests/unit/**/*.test.{ts,tsx}"],
    setupFiles: ["tests/unit/setup.ts"],
  },
});
```

```js
// eslint.config.js: narrow and bug-driven, per the owner's rules
import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";

export default tseslint.config(
  { ignores: ["dist", "node_modules", "playwright-report", "test-results", "logs"] },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: { parser: tseslint.parser, globals: { ...globals.browser, ...globals.node } },
    plugins: { "react-hooks": reactHooks, "@typescript-eslint": tseslint.plugin },
    rules: {
      "@typescript-eslint/no-use-before-define": ["error", { functions: false, classes: true, variables: true }],
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error",
      "no-restricted-imports": ["error", { patterns: [
        { group: ["three", "three/*", "@react-three/*"], message: "No 3D on the professional site (spec §5.2 invariant 6)." },
      ] }],
    },
  },
);
```

`no-undef` is enforced by `tsc` for TypeScript files, as typescript-eslint recommends. Plain `.js` config files get `js.configs.recommended`:

```js
  { files: ["**/*.js"], ...js.configs.recommended, languageOptions: { globals: globals.node } },
```

- `index.html` includes a pre-paint theme script. It reads `jp.settings.v1` inside try/catch and sets `data-theme`, falling back to `dark`.
- It also includes the meta description, Open Graph tags and `<div id="root">`.
- `.gitignore`: `node_modules`, `dist`, `logs`, `test-results`, `playwright-report`.

- [ ] **Step 6: Run** `npx vitest run tests/unit/devlog.test.ts`. Expected: PASS (4 tests).
- [ ] **Step 7: Checkpoint.** `npm test` passes, and `npm run dev` serves a page.

---

### Task 2: Fault registry and logger

**Files:**
- Create: `src/platform/faults.ts`, `src/platform/log.ts`
- Test: `tests/unit/faults.test.ts`, `tests/unit/log.test.ts`

**Interfaces:**
- Produces:
  - `type FaultId`, which is the keys of `FAULTS`.
  - `FAULTS: Record<FaultId, FaultInfo>`, where `FaultInfo = { what: string; why: string; action: string }`.
  - `raise(id: FaultId, context?: Record<string, unknown>): RaisedFault`, where `RaisedFault = FaultInfo & { id: FaultId; at: string; context?: Record<string, unknown> }`.
  - `onFault(listener): () => void`.
  - `log(level: LogLevel, event: string, data?: Record<string, unknown>): void`, where `LogLevel = "debug" | "info" | "warn" | "error"`.
  - `getLogEntries(): LogEntry[]`, `getLogText(): string`, `clearLog(): void`.

- [ ] **Step 1: Failing tests**

```ts
// tests/unit/faults.test.ts
import { describe, it, expect, vi } from "vitest";
import { FAULTS, raise, onFault } from "../../src/platform/faults";
import { getLogEntries, clearLog } from "../../src/platform/log";

describe("fault registry", () => {
  it("every fault has what/why/action, and action is concrete", () => {
    for (const [id, f] of Object.entries(FAULTS)) {
      expect(f.what.length, id).toBeGreaterThan(8);
      expect(f.why.length, id).toBeGreaterThan(8);
      expect(f.action.length, id).toBeGreaterThan(8);
      expect(f.action.toLowerCase(), id).not.toMatch(/investigate|contact support|try again later/);
    }
  });
  it("contains every id the spec registers", () => {
    expect(Object.keys(FAULTS).sort()).toEqual([
      "asset.load_failed", "audio.blocked", "chunk.load_failed", "content.invalid", "cv.missing",
      "save.corrupt", "storage.unavailable", "webgl.context_lost", "webgl.unsupported", "worker.failed",
    ]);
  });
  it("raise() logs at error level and notifies listeners", () => {
    clearLog();
    const spy = vi.fn();
    const off = onFault(spy);
    const f = raise("cv.missing", { path: "/cv/x.pdf" });
    off();
    expect(f.id).toBe("cv.missing");
    expect(spy).toHaveBeenCalledWith(f);
    const last = getLogEntries().at(-1)!;
    expect(last.level).toBe("error");
    expect(last.event).toBe("fault:cv.missing");
  });
  it("a listener that throws does not break raise()", () => {
    const off = onFault(() => { throw new Error("bad listener"); });
    expect(() => raise("audio.blocked")).not.toThrow();
    off();
  });
});
```

```ts
// tests/unit/log.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { log, getLogEntries, getLogText, clearLog, LOG_CAPACITY } from "../../src/platform/log";

describe("log ring buffer", () => {
  beforeEach(() => clearLog());
  it("records entries with timestamps", () => {
    log("info", "boot", { a: 1 });
    const [e] = getLogEntries();
    expect(e).toMatchObject({ level: "info", event: "boot", data: { a: 1 } });
    expect(typeof e.at).toBe("string");
  });
  it("keeps only the last LOG_CAPACITY entries", () => {
    for (let i = 0; i < LOG_CAPACITY + 5; i++) log("debug", `e${i}`);
    const entries = getLogEntries();
    expect(entries).toHaveLength(LOG_CAPACITY);
    expect(entries[0].event).toBe("e5");
  });
  it("survives localStorage throwing", () => {
    const orig = Storage.prototype.setItem;
    Storage.prototype.setItem = () => { throw new Error("QuotaExceeded"); };
    expect(() => log("warn", "x")).not.toThrow();
    Storage.prototype.setItem = orig;
  });
  it("getLogText is one JSON line per entry", () => {
    log("info", "a"); log("info", "b");
    expect(getLogText().trim().split("\n")).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run them.** Expected: FAIL, modules missing.
- [ ] **Step 3: Implement**

```ts
// src/platform/log.ts
export type LogLevel = "debug" | "info" | "warn" | "error";
export interface LogEntry { at: string; level: LogLevel; event: string; data?: Record<string, unknown> }

export const LOG_CAPACITY = 200;
const STORAGE_KEY = "jp.log";
let buffer: LogEntry[] = [];
let pending: LogEntry[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function persist() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(buffer)); } catch { /* storage blocked: buffer stays in memory */ }
}

function flushToDevServer() {
  flushTimer = null;
  if (!import.meta.env.DEV || pending.length === 0) return;
  const body = JSON.stringify(pending);
  pending = [];
  fetch("/__log", { method: "POST", body, headers: { "content-type": "application/json" } }).catch(() => {});
}

export function log(level: LogLevel, event: string, data?: Record<string, unknown>): void {
  const entry: LogEntry = { at: new Date().toISOString(), level, event, ...(data ? { data } : {}) };
  buffer.push(entry);
  if (buffer.length > LOG_CAPACITY) buffer = buffer.slice(-LOG_CAPACITY);
  persist();
  if (import.meta.env.DEV) {
    pending.push(entry);
    flushTimer ??= setTimeout(flushToDevServer, 250);
  }
  const sink = level === "error" ? console.error : level === "warn" ? console.warn : level === "info" ? console.info : console.debug;
  if (import.meta.env.MODE !== "test") sink(`[${level}] ${event}`, data ?? "");
}

export const getLogEntries = (): LogEntry[] => [...buffer];
export const getLogText = (): string => buffer.map((e) => JSON.stringify(e)).join("\n") + (buffer.length ? "\n" : "");
export function clearLog(): void { buffer = []; persist(); }
```

```ts
// src/platform/faults.ts
import { log } from "./log";

export interface FaultInfo { what: string; why: string; action: string }

export const FAULTS = {
  "webgl.unsupported": { what: "This device can't run the 3D worlds.", why: "The browser could not create a WebGL2 graphics context.", action: "You were returned to the professional site; the full CV is available there and via the CV button." },
  "webgl.context_lost": { what: "Graphics were interrupted.", why: "The GPU reset or the tab ran low on graphics memory.", action: "Press 'Restore graphics', or open Settings and switch on Lite mode." },
  "asset.load_failed": { what: "Some 3D models didn't load.", why: "A model or texture request failed (network error or missing file).", action: "A built-in stand-in is shown. Developer: check the file exists under public/assets/<game>/ and is listed in public/assets/LICENSES.md." },
  "chunk.load_failed": { what: "The game files are out of date.", why: "The site was updated while this tab was open, so an older file no longer exists.", action: "Press 'Reload' to load the latest version." },
  "worker.failed": { what: "World building slowed down.", why: "The background terrain builder stopped responding.", action: "Building continues on the main thread. Lower 'Render distance' in Settings if it stutters." },
  "storage.unavailable": { what: "Progress and preferences won't be saved.", why: "This browser is blocking site storage (often private browsing).", action: "Keep playing normally; allow site data for this site to keep progress next time." },
  "save.corrupt": { what: "Saved progress was reset.", why: "The saved data was from an older version or was damaged.", action: "Nothing to do: a fresh save was created automatically." },
  "audio.blocked": { what: "Sound needs a click to start.", why: "Browsers block audio until you interact with the page.", action: "Press the sound toggle (speaker icon) to start audio." },
  "cv.missing": { what: "The PDF CV is unavailable.", why: "The file public/cv/Ellanti_Jathin_CV.pdf is missing from this build.", action: "Use the 'View CV' page instead. Developer: add the PDF at public/cv/Ellanti_Jathin_CV.pdf and redeploy." },
  "content.invalid": { what: "Portfolio content failed validation.", why: "An entry in src/content/data/ breaks the content schema.", action: "Open the file and field named in the error details and correct it, then run npm test." },
} as const satisfies Record<string, FaultInfo>;

export type FaultId = keyof typeof FAULTS;
export type RaisedFault = FaultInfo & { id: FaultId; at: string; context?: Record<string, unknown> };
type Listener = (f: RaisedFault) => void;
const listeners = new Set<Listener>();

export function onFault(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function raise(id: FaultId, context?: Record<string, unknown>): RaisedFault {
  const fault: RaisedFault = { id, at: new Date().toISOString(), ...FAULTS[id], ...(context ? { context } : {}) };
  log("error", `fault:${id}`, { ...FAULTS[id], ...(context ?? {}) });
  for (const l of listeners) { try { l(fault); } catch (err) { log("error", "fault-listener-threw", { id, err: String(err) }); } }
  return fault;
}
```

An unregistered id is a compile error: `FaultId` is a union, and `tsc -b` runs inside `npm test`.

- [ ] **Step 4: Run.** `npx vitest run tests/unit/faults.test.ts tests/unit/log.test.ts`. Expected: PASS.
- [ ] **Step 5: Checkpoint.** `npm test` is green.

---

### Task 3: Content schema, real data, `ContentSource` and the `verified` gate

**Files:**
- Create:
  - `src/content/schema.ts`
  - `src/content/data/{profile,education,experience,skills,projects,achievements,caseStudies,skillTree}.ts`
  - `src/content/data/index.ts`
  - `src/content/source.ts`
  - `src/content/useContent.tsx`
- Test: `tests/unit/content.test.ts`

**Interfaces:**
- Consumes: `raise("content.invalid")` from Task 2.
- Produces:
  - Types `Content`, `Profile`, `Education`, `Experience`, `Skill`, `SkillCategory`, `Project`, `Achievement`, `CaseStudy`, `SkillTreeNode`, `EvidenceRef`.
  - `contentSchema` (zod, including cross-reference checks).
  - `validateContent(raw: unknown): { ok: true; content: Content } | { ok: false; issues: string[] }`. Each issue is formatted `"<path>: <message>"`.
  - `publicView(c: Content): Content`, which drops `caseStudies` where `verified === false`.
  - `interface ContentSource { load(): Promise<Content> }` and `class StaticContentSource implements ContentSource`.
  - `<ContentProvider content={Content}>` and `useContent(): Content`.
  - `SKILL_CATEGORY_LABELS: Record<SkillCategory, string>`.
  - Helper `skillById(c: Content, id: string): Skill | undefined`.

- [ ] **Step 1: Failing tests**

```ts
// tests/unit/content.test.ts
import { describe, it, expect } from "vitest";
import { rawContent } from "../../src/content/data";
import { validateContent, publicView } from "../../src/content/schema";

const clone = <T,>(v: T): T => structuredClone(v);

describe("real content", () => {
  it("passes the schema and every cross-reference", () => {
    const r = validateContent(rawContent);
    if (!r.ok) throw new Error(r.issues.join("\n"));
    expect(r.ok).toBe(true);
  });
  it("uses the exact certificate name and never the higher Unity certification", () => {
    const text = JSON.stringify(rawContent);
    expect(text).toContain("Unity Certified User: Programmer");
    expect(text).not.toMatch(/Unity Certified Programmer/);
  });
  it("never claims JWT or Nodemailer for ELMS", () => {
    const elms = rawContent.projects.find((p) => p.slug === "employee-leave-management")!;
    expect(JSON.stringify(elms)).not.toMatch(/jwt|nodemailer/i);
  });
  it("does not publish phone or street address", () => {
    const text = JSON.stringify(rawContent);
    expect(text).not.toMatch(/9182951536|VSN STREET|AYYAPPANAGAR/i);
  });
});

describe("validation failures carry a path (what to fix)", () => {
  it("reports a bad email with its path", () => {
    const c = clone(rawContent); c.profile.email = "not-an-email";
    const r = validateContent(c);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.issues.join()).toMatch(/profile\.email/);
  });
  it("reports dangling evidence references", () => {
    const c = clone(rawContent); c.skills[0].evidence = [{ kind: "project", id: "does-not-exist" }];
    const r = validateContent(c);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.issues.join()).toMatch(/skills\.0\.evidence\.0.*does-not-exist/);
  });
  it("reports a project tech id that is not a skill", () => {
    const c = clone(rawContent); c.projects[0].tech.push("cobol");
    const r = validateContent(c);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.issues.join()).toMatch(/projects\.0\.tech.*cobol/);
  });
  it("reports duplicate project slugs", () => {
    const c = clone(rawContent); c.projects.push(clone(c.projects[0]));
    const r = validateContent(c);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.issues.join()).toMatch(/duplicate/i);
  });
  it("reports end before start", () => {
    const c = clone(rawContent); c.education[0].end = "2000-01";
    const r = validateContent(c);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.issues.join()).toMatch(/education\.0/);
  });
  it("accepts empty optional collections", () => {
    const c = clone(rawContent); c.caseStudies = []; c.achievements = [];
    expect(validateContent(c).ok).toBe(true);
  });
});

describe("verified gate", () => {
  it("publicView drops unverified case studies and keeps verified ones", () => {
    const c = clone(rawContent);
    c.caseStudies = [
      { id: "a", title: "A", verified: false, encounter: "e", challenge: "c", strategy: ["s"], arsenal: ["react"], outcome: "o", evidence: [] },
      { id: "b", title: "B", verified: true, encounter: "e", challenge: "c", strategy: ["s"], arsenal: ["react"], outcome: "o", evidence: [] },
    ];
    const r = validateContent(c);
    if (!r.ok) throw new Error(r.issues.join("\n"));
    expect(publicView(r.content).caseStudies.map((x) => x.id)).toEqual(["b"]);
  });
});
```

- [ ] **Step 2: Run them.** Expected: FAIL, modules missing.
- [ ] **Step 3: Implement `schema.ts`**

```ts
import { z } from "zod";

const month = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "use YYYY-MM");
const id = z.string().regex(/^[a-z0-9][a-z0-9-]*$/, "lowercase-kebab id");
const sitePath = z.string().startsWith("/");

export const SKILL_CATEGORIES = ["languages", "frameworks", "engines", "databases", "tools"] as const;
export const SKILL_CATEGORY_LABELS = {
  languages: "Programming Languages", frameworks: "Libraries & Frameworks", engines: "Game Engines",
  databases: "Databases", tools: "Tools & Platforms",
} as const satisfies Record<(typeof SKILL_CATEGORIES)[number], string>;

export const evidenceRef = z.object({ kind: z.enum(["project", "achievement", "experience", "education"]), id: z.string() });

export const profileSchema = z.object({
  name: z.string().min(1), shortName: z.string().min(1),
  title: z.string().min(1), subtitle: z.string().min(1).optional(),
  intro: z.string().min(20), about: z.array(z.string().min(20)).min(1),
  location: z.string().min(1), email: z.email(),
  links: z.object({ github: z.url(), linkedin: z.url().optional(), codechef: z.url().optional() }),
  cvPdf: sitePath, portrait: sitePath.optional(), lastUpdated: month,
});

const dated = { start: month, end: month.optional() };
export const educationSchema = z.object({ id, institution: z.string(), programme: z.string(), location: z.string(), ...dated, result: z.object({ label: z.string(), value: z.string() }).optional() });
export const experienceSchema = z.object({ id, organisation: z.string(), role: z.string(), location: z.string(), ...dated, summary: z.string().min(20), responsibilities: z.array(z.string()), skillsGained: z.array(z.string()), outcomes: z.array(z.string()) });
export const skillSchema = z.object({ id, name: z.string(), category: z.enum(SKILL_CATEGORIES), level: z.enum(["learning", "working", "proficient", "expert"]).optional(), evidence: z.array(evidenceRef) });
export const imageSchema = z.object({ src: sitePath, alt: z.string().min(5), width: z.number().int().positive(), height: z.number().int().positive() });
export const projectSchema = z.object({
  slug: id, title: z.string(), summary: z.string().min(20), description: z.array(z.string().min(20)).min(1),
  kind: z.enum(["web", "game", "tool"]), context: z.enum(["personal", "academic-team", "team", "professional"]),
  role: z.string(), contribution: z.array(z.string()), features: z.array(z.string()).min(1),
  status: z.enum(["completed", "in-progress", "archived"]).optional(), ...dated,
  tech: z.array(id).min(1), links: z.object({ repo: z.url().optional(), live: z.url().optional() }),
  images: z.array(imageSchema), game: z.object({ genre: z.string(), engine: z.string() }).optional(),
});
export const achievementSchema = z.object({ id, title: z.string(), issuer: z.string(), kind: z.enum(["certification", "award", "milestone"]), date: month.optional(), credentialUrl: z.url().optional(), description: z.string().optional() });
export const caseStudySchema = z.object({ id, title: z.string(), projectSlug: id.optional(), verified: z.boolean(), encounter: z.string(), challenge: z.string(), strategy: z.array(z.string()).min(1), arsenal: z.array(id), outcome: z.string(), evidence: z.array(z.object({ label: z.string(), href: z.url().optional(), image: imageSchema.optional() })) });
export const skillTreeNodeSchema = z.object({ id, branch: z.string(), title: z.string(), summary: z.string().min(20), evidence: z.array(evidenceRef).min(1), requires: z.array(id) });

const baseContent = z.object({
  profile: profileSchema, education: z.array(educationSchema).min(1), experience: z.array(experienceSchema),
  skills: z.array(skillSchema).min(1), projects: z.array(projectSchema), achievements: z.array(achievementSchema),
  caseStudies: z.array(caseStudySchema), skillTree: z.array(skillTreeNodeSchema),
});

export const contentSchema = baseContent.superRefine((c, ctx) => {
  const ids = {
    project: new Set(c.projects.map((p) => p.slug)), achievement: new Set(c.achievements.map((a) => a.id)),
    experience: new Set(c.experience.map((e) => e.id)), education: new Set(c.education.map((e) => e.id)),
  };
  const skillIds = new Set(c.skills.map((s) => s.id));
  const nodeIds = new Set(c.skillTree.map((n) => n.id));
  const dup = (list: string[], path: string) => {
    const seen = new Set<string>();
    list.forEach((v, i) => { if (seen.has(v)) ctx.addIssue({ code: "custom", path: [path, i], message: `duplicate id "${v}"` }); seen.add(v); });
  };
  dup(c.projects.map((p) => p.slug), "projects"); dup(c.skills.map((s) => s.id), "skills");
  dup(c.achievements.map((a) => a.id), "achievements"); dup(c.education.map((e) => e.id), "education");
  dup(c.experience.map((e) => e.id), "experience"); dup(c.caseStudies.map((x) => x.id), "caseStudies"); dup(c.skillTree.map((n) => n.id), "skillTree");
  const checkEvidence = (refs: { kind: keyof typeof ids; id: string }[], path: (string | number)[]) =>
    refs.forEach((r, i) => { if (!ids[r.kind].has(r.id)) ctx.addIssue({ code: "custom", path: [...path, "evidence", i], message: `unknown ${r.kind} "${r.id}"` }); });
  c.skills.forEach((s, i) => checkEvidence(s.evidence, ["skills", i]));
  c.skillTree.forEach((n, i) => {
    checkEvidence(n.evidence, ["skillTree", i]);
    n.requires.forEach((r, j) => { if (!nodeIds.has(r)) ctx.addIssue({ code: "custom", path: ["skillTree", i, "requires", j], message: `unknown node "${r}"` }); });
  });
  c.projects.forEach((p, i) => p.tech.forEach((t, j) => { if (!skillIds.has(t)) ctx.addIssue({ code: "custom", path: ["projects", i, "tech", j], message: `"${t}" is not a skill id in skills.ts` }); }));
  c.caseStudies.forEach((x, i) => {
    x.arsenal.forEach((t, j) => { if (!skillIds.has(t)) ctx.addIssue({ code: "custom", path: ["caseStudies", i, "arsenal", j], message: `"${t}" is not a skill id` }); });
    if (x.projectSlug && !ids.project.has(x.projectSlug)) ctx.addIssue({ code: "custom", path: ["caseStudies", i, "projectSlug"], message: `unknown project "${x.projectSlug}"` });
  });
  const order = (list: { start: string; end?: string }[], path: string) =>
    list.forEach((e, i) => { if (e.end && e.end < e.start) ctx.addIssue({ code: "custom", path: [path, i, "end"], message: "end is before start" }); });
  order(c.education, "education"); order(c.experience, "experience"); order(c.projects, "projects");
});

export type Content = z.infer<typeof baseContent>;
export type Profile = Content["profile"]; export type Education = Content["education"][number];
export type Experience = Content["experience"][number]; export type Skill = Content["skills"][number];
export type SkillCategory = Skill["category"]; export type Project = Content["projects"][number];
export type Achievement = Content["achievements"][number]; export type CaseStudy = Content["caseStudies"][number];
export type SkillTreeNode = Content["skillTree"][number]; export type EvidenceRef = z.infer<typeof evidenceRef>;

export function validateContent(raw: unknown): { ok: true; content: Content } | { ok: false; issues: string[] } {
  const r = contentSchema.safeParse(raw);
  if (r.success) return { ok: true, content: r.data };
  return { ok: false, issues: r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`) };
}

export const publicView = (c: Content): Content => ({ ...c, caseStudies: c.caseStudies.filter((x) => x.verified) });
export const skillById = (c: Content, sid: string) => c.skills.find((s) => s.id === sid);
```

- [ ] **Step 4: Write the data files**, using exact values from spec §2.

`profile.ts`:
```ts
import type { Profile } from "../schema";
export const profile: Profile = {
  name: "Ellanti Jathin", shortName: "Jathin",
  title: "Software Developer", subtitle: "Unity Certified User: Programmer",
  intro: "Computer Science & Engineering at KL University (2022–2026, CGPA 9.02). I build full-stack web apps with React, Node and Django, and I'm growing into game development with Unity and C#.",
  about: [
    "I studied Computer Science and Engineering at KL University, Vijayawada, graduating with a CGPA of 9.02.",
    "My projects so far are full-stack web applications: a Django weather app backed by the OpenWeatherMap API, and a team-built MERN employee leave management system with separate Admin, HR and Employee dashboards.",
    "I interned at Drone Entry in Bangkok, working hands-on with UAV systems, and I hold the Unity Certified User: Programmer certification.",
  ],
  location: "Vijayawada, India", email: "jathinellanti@gmail.com",
  links: { github: "https://github.com/jathinellanti" },
  cvPdf: "/cv/Ellanti_Jathin_CV.pdf", lastUpdated: "2026-10",
};
```

`education.ts`:
- `kl-university`: "KL University", "B.Tech, Computer Science and Engineering", "Vijayawada", 2022-07 → 2026-05, result `{ label: "CGPA", value: "9.02" }`.
- `sri-bhavishya`: "Sri Bhavishya Junior College", "Intermediate (BiPC)", "Vijayawada", 2020-07 → 2022-06, result `{ label: "Percentage", value: "89%" }`.
- `kkr-gowtham`: "KKR's Gowtham High School", "SSC (CBSE)", "Vijayawada", 2019-07 → 2020-04, result `{ label: "Percentage", value: "91%" }`.

`experience.ts`:
- `drone-entry`: organisation "Drone Entry", role "Intern", location "Bangkok, Thailand", 2024-07 → 2024-07.
- summary: "Internship at a drone technology company, gaining hands-on experience with UAV (unmanned aerial vehicle) systems in a fast-paced, innovative environment."
- responsibilities: `["Hands-on work with UAV (unmanned aerial vehicle) systems."]`
- skillsGained: `["UAV systems", "Problem solving", "Working in a fast-paced team"]`
- outcomes: `["Completed the internship (July 2024)."]`

`skills.ts`. Ids and names in order:

| Category | Skills (`id` → name) |
|---|---|
| languages | `csharp`→C#, `python`→Python, `c`→C, `java`→Java, `javascript`→JavaScript |
| frameworks | `react`→React, `django`→Django, `nodejs`→Node.js, `express`→Express, `mongoose`→Mongoose, `material-ui`→Material UI, `bootstrap`→Bootstrap, `html`→HTML, `css`→CSS |
| engines | `unity`→Unity |
| databases | `sql`→SQL, `mongodb`→MongoDB, `sqlite`→SQLite |
| tools | `git`→Git, `vscode`→VS Code |

No `level` on any skill. Evidence links:
- `python`, `django`, `sqlite`, `html`, `css` → project `weather-information-system`.
- `react`, `javascript`, `nodejs`, `express`, `mongoose`, `mongodb`, `material-ui`, `bootstrap`, `html`, `css` → project `employee-leave-management`.
- `unity`, `csharp` → achievement `unity-certified-user-programmer`.
- All other skills: empty evidence array.

`projects.ts`:

**1. Weather Information System**
- slug `weather-information-system`; kind "web"; context "personal"; role "Developer".
- start 2024-01; tech `["python", "django", "sqlite", "html", "css"]`; repo `https://github.com/jathinellanti/Weatherapp`; images `[]`.
- summary: "A Django web app that shows real-time weather and forecasts using the OpenWeatherMap API."
- description:
  - "Built with Python and Django, the app requests current conditions and forecast data from the OpenWeatherMap API and renders them in server-side templates."
  - "It includes dedicated pages for Mumbai, Delhi, Bangalore and Kolkata, a forecast view, login and registration pages, and a Django model that stores each city's temperature, humidity and conditions in SQLite."
- contribution: `["Built the Django backend, API integration and HTML/CSS templates."]`
- features: `["Real-time weather and forecast via OpenWeatherMap", "City pages for Mumbai, Delhi, Bangalore and Kolkata", "Login and registration pages", "City weather model stored in SQLite"]`

**2. Employee Leave Management System**
- slug `employee-leave-management`; kind "web"; context "academic-team"; role "Team member".
- start 2024-04; tech `["react", "javascript", "nodejs", "express", "mongoose", "mongodb", "material-ui", "bootstrap"]`; repo `https://github.com/jathinellanti/ELMS-sdp-s12-team-13`; images `[]`.
- summary: "A MERN-stack web app for managing employee leave, with separate Admin, HR and Employee dashboards."
- description:
  - "An academic team project built on MongoDB, Express, React and Node.js. The Express server exposes separate routes and controllers for login, admin, HR and employee operations, with Mongoose models for each role."
  - "The React front end (Material UI and Bootstrap) gives each role its own dashboard: admins add, view and delete employees; HR staff manage leave requests and review leave history; employees apply for leave and track their balances and leaves taken."
- contribution: `[]` (owner to supply; the UI shows "Team project").
- features: `["Role-based dashboards for Admin, HR and Employee", "Apply for leave, view balances and leave history", "Admin employee management (add, view, delete)", "Express REST API with Mongoose models"]`

`achievements.ts`:
- `unity-certified-user-programmer`: title "Unity Certified User: Programmer", issuer "Unity Technologies", kind "certification".
- No date and no credential URL.

`caseStudies.ts`: `[]`.

`skillTree.ts`:
| id | branch | title | requires | evidence | summary |
|---|---|---|---|---|---|
| `programming-foundations` | Foundations | Programming foundations | `[]` | education `kl-university` | "Core programming in C, Java, Python and C# from a Computer Science & Engineering degree." |
| `unity-programming` | Game Development | Unity programming | `["programming-foundations"]` | achievement `unity-certified-user-programmer` | "Scripting gameplay in Unity with C#, certified as Unity Certified User: Programmer." |
| `fullstack-mern` | Web Development | Full-stack MERN | `["programming-foundations"]` | project `employee-leave-management` | "Building role-based web apps with MongoDB, Express, React and Node.js." |
| `python-web-backends` | Web Development | Python web backends | `["programming-foundations"]` | project `weather-information-system` | "Server-rendered Django apps that integrate third-party REST APIs." |
| `uav-systems` | Hardware & Systems | UAV systems | `[]` | experience `drone-entry` | "Hands-on experience with unmanned aerial vehicle systems during an internship." |

`data/index.ts` exports `rawContent = { profile, education, experience, skills, projects, achievements, caseStudies, skillTree }`.

- [ ] **Step 5: Implement `source.ts` and `useContent.tsx`**

```ts
// source.ts
import { rawContent } from "./data";
import { validateContent, publicView, type Content } from "./schema";
import { raise } from "../platform/faults";

export interface ContentSource { load(): Promise<Content> }

export class StaticContentSource implements ContentSource {
  async load(): Promise<Content> {
    const r = validateContent(rawContent);
    if (!r.ok) { raise("content.invalid", { issues: r.issues }); throw new Error(`Invalid content:\n${r.issues.join("\n")}`); }
    return publicView(r.content);
  }
}
export const contentSource: ContentSource = new StaticContentSource();
```

```tsx
// useContent.tsx
import { createContext, useContext, type ReactNode } from "react";
import type { Content } from "./schema";
const Ctx = createContext<Content | null>(null);
export function ContentProvider({ content, children }: { content: Content; children: ReactNode }) {
  return <Ctx.Provider value={content}>{children}</Ctx.Provider>;
}
export function useContent(): Content {
  const c = useContext(Ctx);
  if (!c) throw new Error("useContent must be used inside <ContentProvider>");
  return c;
}
```

`main.tsx` awaits `contentSource.load()` before rendering. On failure it renders a plain error page that lists the issues.

- [ ] **Step 6: Run** `npx vitest run tests/unit/content.test.ts`. Expected: PASS (11 tests).
- [ ] **Step 7: Checkpoint.** `npm test` is green.

---

### Task 4: Platform: safe storage, settings, theme and WebGL checks

**Files:**
- Create: `src/platform/storage.ts`, `src/platform/settings.ts`, `src/platform/theme.ts`, `src/platform/webgl.ts`
- Test: `tests/unit/storage.test.ts`, `tests/unit/settings.test.ts`

**Interfaces:**
- Consumes: `raise` from Task 2.
- Produces:
  - `versionedStore<T>(key: string, version: number, schema: z.ZodType<T>, fallback: T): { load(): T; save(v: T): void }`.
    - `storage.unavailable` is raised at most once per session.
    - `save.corrupt` is raised on parse, schema or version mismatch. The fallback is returned and overwritten.
  - `useSettings` (zustand): `{ theme: "dark" | "light"; sound: boolean; quality: "auto" | "low" | "medium" | "high" | "ultra"; lite: boolean; welcomeDismissed: boolean; set(patch: Partial<SettingsState>): void }`. It persists to `jp.settings.v1`.
  - `applyTheme(theme)` sets `document.documentElement.dataset.theme` and `style.colorScheme`.
  - `hasWebGL2(): boolean`, `prefersReducedMotion(): boolean`, `saveDataOn(): boolean`.

- [ ] **Step 1: Failing tests**

```ts
// tests/unit/storage.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { z } from "zod";
import { versionedStore, __resetStorageFaultOnce } from "../../src/platform/storage";
import * as faults from "../../src/platform/faults";

const schema = z.object({ n: z.number() });
describe("versionedStore", () => {
  beforeEach(() => { localStorage.clear(); __resetStorageFaultOnce(); vi.restoreAllMocks(); });
  it("returns fallback when empty, then round-trips", () => {
    const s = versionedStore("t", 1, schema, { n: 0 });
    expect(s.load()).toEqual({ n: 0 });
    s.save({ n: 5 });
    expect(s.load()).toEqual({ n: 5 });
  });
  it("treats corrupt JSON as save.corrupt and returns fallback", () => {
    const spy = vi.spyOn(faults, "raise");
    localStorage.setItem("t", "{not json");
    expect(versionedStore("t", 1, schema, { n: 0 }).load()).toEqual({ n: 0 });
    expect(spy).toHaveBeenCalledWith("save.corrupt", expect.objectContaining({ key: "t" }));
  });
  it("treats an old version as save.corrupt", () => {
    const spy = vi.spyOn(faults, "raise");
    localStorage.setItem("t", JSON.stringify({ v: 0, data: { n: 9 } }));
    expect(versionedStore("t", 1, schema, { n: 0 }).load()).toEqual({ n: 0 });
    expect(spy).toHaveBeenCalledWith("save.corrupt", expect.anything());
  });
  it("treats schema mismatch as save.corrupt", () => {
    localStorage.setItem("t", JSON.stringify({ v: 1, data: { n: "x" } }));
    expect(versionedStore("t", 1, schema, { n: 0 }).load()).toEqual({ n: 0 });
  });
  it("raises storage.unavailable once when storage throws, and never throws itself", () => {
    const spy = vi.spyOn(faults, "raise");
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("SecurityError"); });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("SecurityError"); });
    const s = versionedStore("t", 1, schema, { n: 0 });
    expect(s.load()).toEqual({ n: 0 });
    expect(() => s.save({ n: 1 })).not.toThrow();
    s.load();
    expect(spy.mock.calls.filter(([id]) => id === "storage.unavailable")).toHaveLength(1);
  });
});
```

```ts
// tests/unit/settings.test.ts
import { describe, it, expect } from "vitest";
import { useSettings } from "../../src/platform/settings";
import { applyTheme } from "../../src/platform/theme";

describe("settings", () => {
  it("defaults: dark theme, sound off, auto quality", () => {
    const s = useSettings.getState();
    expect([s.theme, s.sound, s.quality, s.lite]).toEqual(["dark", false, "auto", false]);
  });
  it("set() persists to jp.settings.v1", () => {
    useSettings.getState().set({ theme: "light" });
    expect(JSON.parse(localStorage.getItem("jp.settings.v1")!).data.theme).toBe("light");
  });
  it("applyTheme sets data-theme and color-scheme", () => {
    applyTheme("light");
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(document.documentElement.style.colorScheme).toBe("light");
  });
});
```

- [ ] **Step 2: Run them.** Expected: FAIL.
- [ ] **Step 3: Implement**

```ts
// storage.ts
import type { z } from "zod";
import { raise } from "./faults";
let storageFaultRaised = false;
export const __resetStorageFaultOnce = () => { storageFaultRaised = false; };
function storageFault(err: unknown) { if (!storageFaultRaised) { storageFaultRaised = true; raise("storage.unavailable", { err: String(err) }); } }

export function versionedStore<T>(key: string, version: number, schema: z.ZodType<T>, fallback: T) {
  return {
    load(): T {
      let raw: string | null;
      try { raw = localStorage.getItem(key); } catch (err) { storageFault(err); return fallback; }
      if (raw === null) return fallback;
      try {
        const parsed = JSON.parse(raw) as { v?: unknown; data?: unknown };
        if (parsed.v !== version) throw new Error(`version ${String(parsed.v)} ≠ ${version}`);
        return schema.parse(parsed.data);
      } catch (err) {
        raise("save.corrupt", { key, err: String(err) });
        this.save(fallback);
        return fallback;
      }
    },
    save(value: T): void {
      try { localStorage.setItem(key, JSON.stringify({ v: version, data: value })); } catch (err) { storageFault(err); }
    },
  };
}
```

```ts
// settings.ts
import { create } from "zustand";
import { z } from "zod";
import { versionedStore } from "./storage";
const schema = z.object({
  theme: z.enum(["dark", "light"]), sound: z.boolean(),
  quality: z.enum(["auto", "low", "medium", "high", "ultra"]), lite: z.boolean(), welcomeDismissed: z.boolean(),
});
export type Settings = z.infer<typeof schema>;
export const DEFAULT_SETTINGS: Settings = { theme: "dark", sound: false, quality: "auto", lite: false, welcomeDismissed: false };
const store = versionedStore("jp.settings.v1", 1, schema, DEFAULT_SETTINGS);
export type SettingsState = Settings & { set(patch: Partial<Settings>): void };
export const useSettings = create<SettingsState>((setState, get) => ({
  ...store.load(),
  set(patch) {
    setState(patch);
    const { set: _omit, ...data } = { ...get() };
    store.save(data);
  },
}));
```

```ts
// theme.ts
export function applyTheme(theme: "dark" | "light") {
  const el = document.documentElement;
  el.dataset.theme = theme;
  el.style.colorScheme = theme;
}
```

```ts
// webgl.ts
export function hasWebGL2(): boolean {
  try { return !!document.createElement("canvas").getContext("webgl2"); } catch { return false; }
}
export const prefersReducedMotion = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
export const saveDataOn = () => (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;
```

- [ ] **Step 4: Run.** Expected: PASS.
- [ ] **Step 5: Checkpoint.** `npm test` is green.

---

### Task 5: UI design pass (frontend-ui skill), tokens and owner picks

This task's output is the token system and the owner's component choices. That is why the later UI tasks specify structure, data, states and tests, while their visual code follows from this task's decisions (owner rule: three candidates per key component, chosen by the owner).

**Files:**
- Create: `docs/UI_SPEC.md`, `src/site/styles/index.css`

- [ ] **Step 1:** Invoke the `frontend-ui` skill and follow its workflow.
- [ ] **Step 2:** Open real references:
  - Linear's homepage
  - Vercel's homepage
  - Bruno Simon's portfolio
  - rauno.me
  - one premium personal portfolio
  - registries: 21st.dev via `mcp__magic__search`, Aceternity, Magic UI, React Bits
- [ ] **Step 3:** Write a **Reference notes** block in `docs/UI_SPEC.md`: what each reference does well (type scale, spacing rhythm, hero composition, card treatment, motion) and what to borrow.
- [ ] **Step 4:** Define the tokens in `src/site/styles/index.css` for both themes:
  - **Colour:** `--bg`, `--bg-elev`, `--surface`, `--border`, `--text`, `--text-muted`, `--accent`, `--accent-contrast`, `--focus`, `--danger`.
  - **Type:** display serif plus body sans, a fluid type scale from `--step--1` to `--step-5`.
  - **Spacing:** `--space-1` to `--space-10`.
  - **Radius, shadow, motion:** `--ease: cubic-bezier(0.2, 0, 0, 1)`, `--dur-fast: 150ms`, `--dur: 200ms`, `--dur-slow: 250ms`.
  - Expose them through Tailwind 4 `@theme`, and add `@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));`.
  - Every text/background pair must reach WCAG AA (4.5:1 for body text, 3:1 for large text and UI). Record the measured ratios in `UI_SPEC.md`.
- [ ] **Step 5:** For **Hero layout**, **Project card** and **Nav**, present **three candidates each** to the owner (via AskUserQuestion with previews) and record the picks in `UI_SPEC.md`.
- [ ] **Step 6:** Self-host fonts via `@fontsource-variable/*` and record the choices.
- [ ] **Step 7: Checkpoint.** `npm test` is green, and `UI_SPEC.md` holds the reference notes, tokens, contrast table and picks.

---

### Task 6: App shell: router, layout, nav, ⌘K palette, footer, metadata, 404

**Files:**
- Create:
  - `src/router.tsx`
  - `src/main.tsx` (final version)
  - `src/site/layout/{SiteLayout,Nav,Footer}.tsx`
  - `src/site/components/{Button,ThemeToggle,Palette,Monogram,Section,Chip,Card,CopyButton,EmptyState}.tsx`
  - `src/site/meta.tsx`
  - `src/site/pages/NotFound.tsx`
- Test: `tests/unit/shell.test.tsx`, `tests/unit/setup.ts`

**Interfaces:**
- Consumes: `useContent`, `useSettings`, `applyTheme`.
- Produces:
  - `SECTIONS: { id: string; label: string }[]` (exported from `Nav.tsx`), in this order: about, education, experience, skills, projects, certifications, contact.
  - `<PageMeta title description />`, which renders React 19 `<title>` and `<meta>`.
  - Routes:
    - `/` → Home
    - `/cv` → CvPage
    - `/projects/:slug` → ProjectPage
    - `/play` → WorldSelect, loaded with `lazy`
    - `*` → NotFound

- [ ] **Step 1: Failing tests**

```tsx
// tests/unit/setup.ts
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
afterEach(() => { cleanup(); localStorage.clear(); });
```

```tsx
// tests/unit/shell.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { routes } from "../../src/router";
import { ContentProvider } from "../../src/content/useContent";
import { rawContent } from "../../src/content/data";
import { validateContent, publicView } from "../../src/content/schema";

const content = (() => { const r = validateContent(rawContent); if (!r.ok) throw new Error(); return publicView(r.content); })();
const renderAt = (path: string) => render(<ContentProvider content={content}><RouterProvider router={createMemoryRouter(routes, { initialEntries: [path] })} /></ContentProvider>);

describe("shell", () => {
  it("nav has every section link and a CV download", async () => {
    renderAt("/");
    const nav = await screen.findByRole("navigation", { name: /primary/i });
    for (const label of ["About", "Education", "Experience", "Skills", "Projects", "Certifications", "Contact"])
      expect(nav).toHaveTextContent(label);
    expect(screen.getAllByRole("link", { name: /download cv/i })[0]).toHaveAttribute("href", "/cv/Ellanti_Jathin_CV.pdf");
  });
  it("theme toggle flips data-theme and is a labelled button", async () => {
    renderAt("/");
    const btn = await screen.findByRole("button", { name: /switch to light theme/i });
    await userEvent.click(btn);
    expect(document.documentElement.dataset.theme).toBe("light");
  });
  it("Ctrl+K opens the jump palette", async () => {
    renderAt("/");
    await screen.findByRole("navigation", { name: /primary/i });
    await userEvent.keyboard("{Control>}k{/Control}");
    expect(await screen.findByRole("dialog", { name: /jump to/i })).toBeInTheDocument();
  });
  it("unknown route renders 404 with links home, CV and play", async () => {
    renderAt("/nope");
    expect(await screen.findByRole("heading", { name: /not found/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /home/i })).toHaveAttribute("href", "/");
  });
});
```

- [ ] **Step 2: Run them.** Expected: FAIL.
- [ ] **Step 3: Implement** to the Task 5 picks.
  - **Nav:**
    - `aria-label="Primary"`, sticky.
    - Links are anchors to `/#<id>`.
    - On mobile (below 768 px) a menu button opens a sheet dialog with focus trap, Esc to close, and focus restored afterwards.
  - **ThemeToggle:** a button labelled "Switch to light theme" / "Switch to dark theme" with Sun/Moon Lucide icons.
  - **Palette:** `cmdk` `Command.Dialog` labelled "Jump to". Ctrl/⌘+K toggles it. Items are the sections plus "View CV", "Download CV" and "Enter the Developer's Realm".
  - **Download CV:**
    - A HEAD probe at mount checks `profile.cvPdf`.
    - If it isn't a 200 PDF, the link is swapped for "View CV" (`/cv`) and `raise("cv.missing")` runs once.
    - A test mocks fetch for both branches.
  - **Router:** `ScrollRestoration`. Hash links scroll smoothly unless reduced motion is on.
- [ ] **Step 4: Run.** Expected: PASS. Add tests for the cv-probe success and failure branches with a mocked `fetch`.
- [ ] **Step 5: Checkpoint.** `npm test` is green.

---

### Task 7: Hero with SVG poster and realm CTA

**Files:**
- Create: `src/site/sections/Hero.tsx`, `src/site/sections/HeroPoster.tsx`, `src/play/RealmTransition.tsx`
- Test: `tests/unit/hero.test.tsx`

**Interfaces:**
- Consumes: `useContent().profile`, the router.
- Produces:
  - `<HeroPoster />`: a pure SVG of three isometric mini-worlds, with `role="img"` and a descriptive `aria-label`.
    - A block island made of voxel cubes with grass and dirt pixel shading.
    - A neon tower with lit windows and a sign glow.
    - A coastal city block with palms and a road.
  - `useRealmTransition(): (to: string) => void`:
    - Plays an overlay fade and scale of ≤ 600 ms via Motion, then navigates.
    - Navigates immediately when reduced motion is on.

- [ ] **Step 1: Failing tests:**
  - The hero shows the name as `h1`, the title and the intro.
  - "View My CV" links to `/cv`.
  - "Explore My Projects" links to `#projects`.
  - "Enter the Developer's Realm" is a button that navigates to `/play` (memory router: assert location after click).
  - The poster has `role="img"` and a non-empty `aria-label`.
- [ ] **Step 2: Run them.** Expected: FAIL.
- [ ] **Step 3: Implement** to the picked hero candidate.
  - Pointer-follow light: CSS variables updated on `pointermove`, throttled with `requestAnimationFrame`, disabled on reduced motion and on coarse pointers.
  - Film grain: an inline SVG `feTurbulence` data URI at low opacity.
  - Subline: `profile.subtitle`.
- [ ] **Step 4: Run.** Expected: PASS.
- [ ] **Step 5: Checkpoint.**

---

### Task 8: Content sections

**Files:**
- Create: `src/site/sections/{About,Education,Experience,Skills,Projects,Certifications,Contact}.tsx`, `src/site/pages/Home.tsx`
- Test: `tests/unit/sections.test.tsx`

**Interfaces:**
- Consumes: `useContent()`, `SKILL_CATEGORY_LABELS`, the `CopyButton` and `EmptyState` components.
- Produces: each section renders `<section id={SECTIONS[i].id} aria-labelledby>`.

- [ ] **Step 1: Failing tests:**
  - **Education:** renders three entries in date-descending order, showing "CGPA 9.02", "89%" and "91%" and their date ranges formatted "Jul 2022 – May 2026".
  - **Experience:** renders Drone Entry, Intern, Bangkok, Thailand, "Jul 2024". When `start === end`, it shows a single month, not a range.
  - **Skills:**
    - Groups skills under the five category labels.
    - Shows no proficiency meter when `level` is absent.
    - A skill with evidence renders an "Evidence" link to `/projects/<slug>` or `#certifications`.
    - With `skills` mocked to one item, there is one group and no empty groups.
  - **Projects:**
    - Two cards, each linking to `/projects/<slug>`.
    - ELMS shows a "Team project" chip.
    - With `images: []`, the card shows a designed preview (stack monogram tiles), not a broken image.
    - With `projects: []`, an EmptyState reads "No projects published yet".
  - **Certifications:**
    - "Unity Certified User: Programmer", "Unity Technologies", with no date element when the date is absent.
    - With `achievements: []`, the EmptyState shows.
  - **Contact:**
    - A mailto link plus a copy button (navigator.clipboard mocked; shows "Copied" and announces it via `aria-live`).
    - Clipboard rejection shows "Press Ctrl+C to copy", with the email selected.
    - The GitHub link is present. LinkedIn and CodeChef are absent when undefined, never rendered as `href="#"`.
- [ ] **Step 2: Run them.** Expected: FAIL.
- [ ] **Step 3: Implement** with a shared `formatMonth(m: string): string` ("2022-07" → "Jul 2022") and `formatRange(start, end?)` in `src/site/format.ts`. Unit-test both for: same month, open-ended ("– Present"), and a December/January boundary.
- [ ] **Step 4: Run.** Expected: PASS.
- [ ] **Step 5: Checkpoint.**

---

### Task 9: `/cv` print page and `/projects/:slug` pages

**Files:**
- Create: `src/site/pages/CvPage.tsx`, `src/site/pages/ProjectPage.tsx`
- Test: `tests/unit/pages.test.tsx`

**Interfaces:**
- Consumes: `useContent()`, `formatRange`, `PageMeta`.

- [ ] **Step 1: Failing tests:**
  - **`/cv`:**
    - Renders every section in a single `<article>`: name, contact (email and GitHub only), education, experience, skills, projects, certifications.
    - Has a "Print / Save as PDF" button that calls `window.print` (mocked), plus a Download PDF link.
  - **`/projects/weather-information-system`:**
    - `h1` is the title.
    - Shows all description paragraphs and features.
    - The tech chips use the skill names.
    - The repo link has `rel="noopener noreferrer"` and `target="_blank"`.
    - The page title is "Weather Information System · Ellanti Jathin".
  - **`/projects/employee-leave-management`:** with empty `contribution`, it shows "Team project. Individual contribution details coming soon." and nothing claimed.
  - **`/projects/unknown`:** shows the "Project not found" heading and a link back to `/#projects`.
- [ ] **Step 2: Run them.** Expected: FAIL.
- [ ] **Step 3: Implement.** In `@media print`, hide the nav, footer and buttons, use black on white and a serif body, and avoid page breaks inside entries.
- [ ] **Step 4: Run.** Expected: PASS.
- [ ] **Step 5: Checkpoint.**

---

### Task 10: `/play` World Select (Phase 1 state)

**Files:**
- Create: `src/play/worlds.ts`, `src/play/WorldSelect.tsx`, `src/platform/ExitBar.tsx`
- Test: `tests/unit/play.test.tsx`

**Interfaces:**
- Produces:
  - `WORLDS: { id: "block" | "neon" | "city"; title: string; pitch: string; controls: string; status: "available" | "in-development" }[]`.
    - Titles: "JATHINCRAFT", "NEON//SPRAWL", "SUNSET BAY".
    - All three have status `"in-development"` in Phase 1.
  - `<ExitBar />`: fixed, with "Exit to Professional" (→ `/`) and "CV" (→ `/cv`) links. Rendered on `/play`.

- [ ] **Step 1: Failing tests:**
  - Three world cards render, each with title and pitch.
  - In-development cards show an "In development" badge, and their Play button has `aria-disabled="true"`. Activating it doesn't navigate.
  - ArrowRight and ArrowLeft move focus between cards.
  - ExitBar links point to `/` and `/cv`.
  - The welcome note is dismissible, and dismissal persists via `useSettings().welcomeDismissed`.
  - "Open CV instead" links to `/cv`.
- [ ] **Step 2: Run them.** Expected: FAIL.
- [ ] **Step 3: Implement.**
  - Cards use the matching `HeroPoster` world vignettes, exported as `BlockVignette`, `NeonVignette` and `CityVignette` from `HeroPoster.tsx`.
  - The background is a dark atmospheric gradient with slow drifting fog (CSS, paused on reduced motion).
- [ ] **Step 4: Run.** Expected: PASS.
- [ ] **Step 5: Checkpoint.**

---

### Task 11: Bundle invariant, static files and docs

**Files:**
- Create:
  - `tests/unit/bundle.test.ts`
  - `vercel.json`
  - `public/robots.txt`, `public/favicon.svg`, `public/og.png`
  - `public/assets/LICENSES.md`
  - `public/cv/README.md`
  - `ARCHITECTURE.md`, `README.md`
  - `docs/content-drafts/case-studies.md`

- [ ] **Step 1: Bundle test.** It reads `dist/.vite/manifest.json` (enable `build.manifest: true`) and asserts that the entry chunk and its static imports contain no `three` module id. It is skipped with a clear message when `dist` is absent. `npm run build` runs before e2e.
- [ ] **Step 2: `vercel.json`:**

```json
{
  "rewrites": [{ "source": "/((?!assets/|cv/|projects/.*\\.|favicon|robots|og).*)", "destination": "/index.html" }],
  "headers": [{ "source": "/assets/(.*)", "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }] }]
}
```

- [ ] **Step 3: Docs:**
  - **`ARCHITECTURE.md`** (from spec §5): the file map, the six invariants, the fault table, "How to add a project" and "How to swap in a backend".
  - **`README.md`:** setup (`npm i`, `npm run dev`), test, e2e, build, deploy to Vercel, and replacing content and assets (CV PDF path, project images path, content files).
  - **`docs/content-drafts/case-studies.md`:** two drafts from repo code, each marked `verified: false`, with "Owner: confirm or rewrite" prompts.
    - "Three roles, one API": ELMS's per-role Express routes and controllers.
    - "Many cities, one view": Weatherapp's per-city Django views calling OpenWeatherMap (current + forecast).
  - **`public/cv/README.md`:** "Place Ellanti_Jathin_CV.pdf here."
- [ ] **Step 4: OG image.** `og.png` is 1200×630, rendered from the hero via Playwright screenshot.
- [ ] **Step 5: Checkpoint.** `npm test && npm run build`.

---

### Task 12: End-to-end and render verification

**Files:**
- Create: `playwright.config.ts`, `tests/e2e/site.spec.ts`, `tests/e2e/play.spec.ts`

- [ ] **Step 1: Config.**
  - The webServer runs `npm run build && npm run preview` on 4173.
  - Projects run Chromium only.
  - Reporter: list.
- [ ] **Step 2: `site.spec.ts`:**
  - **Layout:** for each width in [360, 768, 1280, 1920] × theme [dark, light], set the theme via localStorage, load `/`, and assert `document.documentElement.scrollWidth <= innerWidth`. Take a full-page screenshot to `test-results/site-<w>-<theme>.png`.
  - **Keyboard:** Tab reaches the skip link first, then the nav links. Every focused element has a visible outline (computed `outline-style !== "none"` or `box-shadow` set).
  - **⌘K:** opens, filters, and Enter jumps to `#contact`.
  - **CV:** with `public/cv/Ellanti_Jathin_CV.pdf` present, the request returns 200 `application/pdf`. When absent, the nav shows "View CV".
  - **Project pages:** both slugs render. An unknown slug shows "Project not found".
  - **404:** `/nope` shows "Not found".
  - **Reduced motion:** with `reducedMotion: "reduce"` emulated, clicking "Enter the Developer's Realm" reaches `/play` within 100 ms.
- [ ] **Step 3: `play.spec.ts`:**
  - `/play` renders three cards.
  - The ExitBar is visible at all four widths.
  - Arrow-key focus works.
  - Disabled Play doesn't navigate.
- [ ] **Step 4: Run** `npx playwright install chromium`, then `npm run e2e`. Expected: all pass. Review every screenshot by eye, and fix any spacing, overflow or contrast issue found.
- [ ] **Step 5: Final verification:**
  - `npm test`, `npm run build` and `npm run e2e` are all green.
  - Re-read the whole diff as a reviewer: naming, dead code, duplication, missing tests.
  - Update `ARCHITECTURE.md` if reality drifted.
  - Report what is done, what is untested (real devices, live deploy) and the remaining risks.
