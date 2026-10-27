import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import sharp from "sharp";
import { rawContent } from "../../src/content/data";
import { validateContent, publicView, type Content } from "../../src/content/schema";
import { StaticContentSource } from "../../src/content/source";

const clone = (): Content => structuredClone(rawContent);

describe("real content", () => {
  it("passes the schema and every cross-reference", () => {
    const r = validateContent(rawContent);
    if (!r.ok) throw new Error(r.issues.join("\n"));
    expect(r.ok).toBe(true);
  });

  it("every project image exists in public/ at its declared size", async () => {
    for (const p of rawContent.projects) {
      for (const img of p.images) {
        const file = resolve("public", img.src.slice(1));
        expect(existsSync(file), img.src).toBe(true);
        const meta = await sharp(file).metadata();
        expect([meta.width, meta.height], img.src).toEqual([img.width, img.height]);
      }
    }
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

  it("assigns no proficiency levels (none were supplied)", () => {
    expect(rawContent.skills.every((s) => s.level === undefined)).toBe(true);
  });
});

describe("validation failures carry a path (what to fix)", () => {
  it("reports a bad email with its path", () => {
    const c = clone();
    c.profile.email = "not-an-email";
    const r = validateContent(c);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.issues.join()).toMatch(/profile\.email/);
  });

  it("reports dangling evidence references", () => {
    const c = clone();
    c.skills[0].evidence = [{ kind: "project", id: "does-not-exist" }];
    const r = validateContent(c);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.issues.join()).toMatch(/skills\.0\.evidence\.0.*does-not-exist/);
  });

  it("reports a project tech id that is not a skill", () => {
    const c = clone();
    c.projects[0].tech.push("cobol");
    const r = validateContent(c);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.issues.join()).toMatch(/projects\.0\.tech.*cobol/);
  });

  it("reports duplicate project slugs", () => {
    const c = clone();
    c.projects.push(structuredClone(c.projects[0]));
    const r = validateContent(c);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.issues.join()).toMatch(/duplicate/i);
  });

  it("reports end before start", () => {
    const c = clone();
    c.education[0].end = "2000-01";
    const r = validateContent(c);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.issues.join()).toMatch(/education\.0\.end/);
  });

  it("reports a malformed month", () => {
    const c = clone();
    c.experience[0].start = "2024-13";
    const r = validateContent(c);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.issues.join()).toMatch(/experience\.0\.start: use YYYY-MM/);
  });

  it("reports an unknown skill-tree prerequisite", () => {
    const c = clone();
    c.skillTree[1].requires = ["ghost"];
    const r = validateContent(c);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.issues.join()).toMatch(/skillTree\.1\.requires\.0.*ghost/);
  });

  it("accepts empty optional collections", () => {
    const c = clone();
    c.caseStudies = [];
    c.achievements = [];
    c.projects = [];
    c.skills = c.skills.map((s) => ({ ...s, evidence: s.evidence.filter((e) => e.kind !== "project" && e.kind !== "achievement") }));
    c.skillTree = c.skillTree.filter((n) => n.evidence.every((e) => e.kind === "education" || e.kind === "experience"));
    c.skillTree = c.skillTree.map((n) => ({ ...n, requires: n.requires.filter((r) => c.skillTree.some((x) => x.id === r)) }));
    const r = validateContent(c);
    if (!r.ok) throw new Error(r.issues.join("\n"));
    expect(r.ok).toBe(true);
  });
});

describe("verified gate", () => {
  it("publicView drops unverified case studies and keeps verified ones", () => {
    const c = clone();
    c.caseStudies = [
      { id: "a", title: "A", verified: false, encounter: "e", challenge: "c", strategy: ["s"], arsenal: ["react"], outcome: "o", evidence: [] },
      { id: "b", title: "B", verified: true, encounter: "e", challenge: "c", strategy: ["s"], arsenal: ["react"], outcome: "o", evidence: [] },
    ];
    const r = validateContent(c);
    if (!r.ok) throw new Error(r.issues.join("\n"));
    expect(publicView(r.content).caseStudies.map((x) => x.id)).toEqual(["b"]);
  });

  it("StaticContentSource returns the public view and rejects invalid content", async () => {
    await expect(new StaticContentSource().load()).resolves.toMatchObject({ profile: { name: "Ellanti Jathin" } });
    const bad = clone();
    bad.profile.email = "x";
    await expect(new StaticContentSource(bad).load()).rejects.toThrow(/profile\.email/);
  });
});
