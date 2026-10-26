import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router";
import { ArrowUpRight, X } from "lucide-react";
import { useContent } from "../../../content/useContent";
import { skillById, SKILL_CATEGORY_LABELS } from "../../../content/model";
import type { Skill } from "../../../content/schema";
import { neonRuntime, useNeon, type HubTab } from "../store";
import { CYBER_SLOTS, installedIn, lifePath, perkColumns } from "../content";
import { COLLIDERS, POIS, BOUND, type Poi } from "../world/city";
import { CONTEXT_LABEL, evidenceLink } from "../../../site/evidence";
import { formatMonth } from "../../../site/format";

const TABS: { id: HubTab; label: string; key: string }[] = [
  { id: "character", label: "Character", key: "C" },
  { id: "lifepath", label: "Life Path", key: "" },
  { id: "cyberware", label: "Cyberware", key: "" },
  { id: "perks", label: "Perks", key: "P" },
  { id: "jobs", label: "Jobs", key: "J" },
  { id: "gigs", label: "Gigs", key: "" },
  { id: "shards", label: "Shards", key: "" },
  { id: "map", label: "Map", key: "M" },
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <p className="nc-label mb-2">{title}</p>
      {children}
    </section>
  );
}

function Character() {
  const { profile, education } = useContent();
  return (
    <div className="grid gap-6 md:grid-cols-[220px_1fr]">
      <div className="nc-panel nc-cut grid aspect-[3/4] place-items-center bg-[radial-gradient(circle_at_50%_30%,rgb(255_59_79_/_0.25),transparent_60%)]">
        <span className="nc-display text-6xl text-[var(--nc-yellow)]">{profile.name.split(" ").map((w) => w[0]).join("")}</span>
      </div>
      <div className="space-y-5">
        <div>
          <h3 className="nc-display text-2xl text-[var(--nc-yellow)]">{profile.name}</h3>
          <p className="text-lg">{profile.title}</p>
          {profile.subtitle && <span className="nc-tag mt-2">{profile.subtitle}</span>}
        </div>
        <Section title="Bio">
          <div className="space-y-2 text-[17px] leading-snug text-[var(--nc-dim)]">
            {profile.about.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </Section>
        <Section title="Background">
          <ul className="space-y-1 text-[16px]">
            {education.map((e) => (
              <li key={e.id}>
                {e.programme} <span className="text-[var(--nc-dim)]">· {e.institution}</span> {e.result && <span className="text-[var(--nc-yellow)]">· {e.result.label} {e.result.value}</span>}
              </li>
            ))}
          </ul>
        </Section>
        <p className="text-[15px] text-[var(--nc-dim)]">Based in {profile.location}.</p>
      </div>
    </div>
  );
}

function LifePath() {
  const content = useContent();
  const entries = useMemo(() => lifePath(content), [content]);
  return (
    <ol className="relative space-y-4 border-l border-[var(--nc-line)] pl-6">
      {entries.map((e) => (
        <li key={e.id} className="relative">
          <span className="absolute -left-[31px] top-2 size-2.5 rotate-45 bg-[var(--nc-red)]" aria-hidden />
          <p className="nc-label">{e.kind === "education" ? "Education" : "Experience"} · {e.when}</p>
          <p className="text-xl">{e.title}</p>
          <p className="text-[var(--nc-dim)]">{e.org}</p>
          {e.detail.map((d) => (
            <p key={d} className="mt-1 text-[16px]">
              {d}
            </p>
          ))}
        </li>
      ))}
    </ol>
  );
}

function SkillChip({ s }: { s: Skill }) {
  const content = useContent();
  const ev = s.evidence[0];
  const link = ev ? evidenceLink(content, ev) : null;
  return (
    <li className="nc-panel nc-cut flex items-center justify-between gap-3 px-3 py-2">
      <span className="text-[17px]">{s.name}</span>
      {link ? <span className="text-[13px] text-[var(--nc-cyan)]">↳ {link.label}</span> : <span className="text-[13px] text-[var(--nc-dim)]">On CV</span>}
    </li>
  );
}

function Cyberware() {
  const content = useContent();
  const [slotId, setSlot] = useState(CYBER_SLOTS[0].id);
  const slot = CYBER_SLOTS.find((s) => s.id === slotId)!;
  return (
    <div className="grid gap-6 md:grid-cols-[260px_1fr]">
      <div className="relative mx-auto aspect-[3/5] w-[220px]" aria-label="Cyberware slots">
        <svg viewBox="0 0 100 160" className="absolute inset-0 h-full w-full" aria-hidden>
          <g fill="none" stroke="rgba(62,240,255,0.55)" strokeWidth="1">
            <circle cx="50" cy="16" r="10" />
            <path d="M38 30 L62 30 L68 70 L60 72 L58 100 L64 152 L54 152 L50 108 L46 152 L36 152 L42 100 L40 72 L32 70 Z" />
            <path d="M38 32 L22 66 L18 90 M62 32 L78 66 L84 92" />
          </g>
        </svg>
        {CYBER_SLOTS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSlot(s.id)}
            aria-pressed={s.id === slotId}
            aria-label={`${s.label}: ${installedIn(content, s).length} installed`}
            className="absolute size-5 -translate-x-1/2 -translate-y-1/2 rotate-45 border-2 transition-colors"
            style={{ left: `${s.anchor[0]}%`, top: `${s.anchor[1]}%`, borderColor: s.id === slotId ? "#f3e600" : "#ff3b4f", background: s.id === slotId ? "#f3e600" : "rgba(255,59,79,0.25)" }}
          />
        ))}
      </div>
      <div>
        <div className="mb-3 flex flex-wrap gap-2" role="tablist" aria-label="Body slots">
          {CYBER_SLOTS.map((s) => (
            <button key={s.id} type="button" role="tab" aria-selected={s.id === slotId} className="nc-btn" style={{ minHeight: 34, fontSize: 13 }} onClick={() => setSlot(s.id)}>
              {s.label}
            </button>
          ))}
        </div>
        <p className="nc-display text-lg text-[var(--nc-yellow)]">{slot.label}</p>
        <p className="mb-3 text-[var(--nc-dim)]">
          {slot.blurb} · {SKILL_CATEGORY_LABELS[slot.category]}
        </p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {installedIn(content, slot).map((s) => (
            <SkillChip key={s.id} s={s} />
          ))}
        </ul>
        {installedIn(content, slot).length === 0 && <p className="text-[var(--nc-dim)]">Slot empty: nothing listed in this category yet.</p>}
      </div>
    </div>
  );
}

function Perks() {
  const content = useContent();
  const cols = useMemo(() => perkColumns(content.skillTree), [content.skillTree]);
  const [sel, setSel] = useState(content.skillTree[0]?.id ?? null);
  const node = content.skillTree.find((n) => n.id === sel);
  if (!cols.length) return <p className="text-[var(--nc-dim)]">No perks yet: each perk must be backed by a project, role or certificate.</p>;
  return (
    <div>
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols.length}, minmax(140px, 1fr))` }}>
        {cols.map((c) => (
          <div key={c.branch} className="nc-panel nc-cut p-3">
            <p className="nc-display mb-3 text-[13px] text-[var(--nc-cyan)]">{c.branch}</p>
            <ul className="flex flex-col items-center gap-3">
              {c.nodes.map((n) => (
                <li key={n.id}>
                  <button type="button" onClick={() => setSel(n.id)} aria-pressed={sel === n.id} className="flex flex-col items-center gap-1 text-center">
                    <span className="grid size-12 rotate-45 place-items-center border-2" style={{ borderColor: sel === n.id ? "#f3e600" : "#ff3b4f", background: sel === n.id ? "rgba(243,230,0,0.2)" : "rgba(255,59,79,0.12)" }}>
                      <span className="-rotate-45 text-[13px] text-[var(--nc-yellow)]" aria-hidden>
                        ✓
                      </span>
                    </span>
                    <span className="max-w-[130px] text-[14px] leading-tight">{n.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {node && (
        <div className="nc-panel nc-cut mt-4 p-4" aria-live="polite">
          <p className="nc-label">{node.branch}</p>
          <p className="text-xl text-[var(--nc-yellow)]">{node.title}</p>
          <p className="text-[17px]">{node.summary}</p>
          <p className="mt-2 text-[15px] text-[var(--nc-cyan)]">Unlocked by: {node.evidence.map((e) => evidenceLink(content, e).label).join(", ")}</p>
        </div>
      )}
    </div>
  );
}

function Jobs() {
  const content = useContent();
  const arg = useNeon((s) => s.tabArg);
  const [slug, setSlug] = useState(arg ?? content.projects[0]?.slug ?? null);
  const p = content.projects.find((x) => x.slug === slug);
  if (!content.projects.length) return <p className="text-[var(--nc-dim)]">No jobs on the board yet.</p>;
  return (
    <div className="grid gap-5 md:grid-cols-[240px_1fr]">
      <ul className="space-y-2">
        {content.projects.map((x) => (
          <li key={x.slug}>
            <button type="button" className="nc-btn w-full !justify-start text-left" aria-current={x.slug === slug} onClick={() => setSlug(x.slug)} style={{ letterSpacing: "0.04em", textTransform: "none", fontSize: 16 }}>
              {x.title}
            </button>
          </li>
        ))}
      </ul>
      {p && (
        <article>
          <p className="nc-label">Job · {CONTEXT_LABEL[p.context]} · {formatMonth(p.start)}</p>
          <h3 className="nc-display mt-1 text-xl text-[var(--nc-yellow)]">{p.title}</h3>
          <p className="mt-2 text-[17px]">{p.summary}</p>
          <p className="nc-label mt-4">Objectives completed</p>
          <ul className="mt-1 space-y-1 text-[16px]">
            {p.features.map((f) => (
              <li key={f}>▸ {f}</li>
            ))}
          </ul>
          <p className="nc-label mt-4">Loadout</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {p.tech.map((t) => (
              <span key={t} className="nc-tag">
                {skillById(content, t)?.name ?? t}
              </span>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link to={`/projects/${p.slug}`} className="nc-btn">
              Case study
            </Link>
            {p.links.repo && (
              <a href={p.links.repo} target="_blank" rel="noopener noreferrer" className="nc-btn is-ghost">
                Source <ArrowUpRight size={14} aria-hidden />
                <span className="sr-only">(opens GitHub in a new tab)</span>
              </a>
            )}
          </div>
        </article>
      )}
    </div>
  );
}

function Gigs() {
  const { caseStudies } = useContent();
  if (!caseStudies.length)
    return (
      <div className="py-6 text-center">
        <p className="nc-display text-xl text-[var(--nc-yellow)]">No gigs posted</p>
        <p className="mx-auto mt-2 max-w-[52ch] text-[17px] text-[var(--nc-dim)]">
          Gigs are real technical case studies: the problem, the obstacles, the approach, the tools and the outcome. None are published yet, and none will be invented.
        </p>
      </div>
    );
  return (
    <ul className="space-y-4">
      {caseStudies.map((c) => (
        <li key={c.id} className="nc-panel nc-cut p-4">
          <p className="nc-display text-lg text-[var(--nc-yellow)]">{c.title}</p>
          <p className="mt-1">{c.encounter}</p>
          <p className="text-[var(--nc-dim)]">{c.challenge}</p>
          <p className="mt-2">{c.outcome}</p>
        </li>
      ))}
    </ul>
  );
}

function Shards() {
  const { achievements } = useContent();
  if (!achievements.length) return <p className="text-[var(--nc-dim)]">No shards collected yet.</p>;
  return (
    <ul className="grid gap-3 md:grid-cols-2">
      {achievements.map((a) => (
        <li key={a.id} className="nc-panel nc-cut p-4">
          <p className="nc-label">Shard · {a.kind}</p>
          <p className="mt-1 text-xl text-[var(--nc-yellow)]">{a.title}</p>
          <p>{a.issuer}</p>
          <p className="text-[var(--nc-dim)]">{a.date ? formatMonth(a.date) : "Date not listed"}</p>
          {a.credentialUrl && (
            <a href={a.credentialUrl} target="_blank" rel="noopener noreferrer" className="nc-btn mt-3">
              Verify <ArrowUpRight size={14} aria-hidden />
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}

export function fastTravel(p: Poi) {
  const st = useNeon.getState();
  const yaw = p.facade.nx === 1 ? Math.PI / 2 : p.facade.nx === -1 ? -Math.PI / 2 : p.facade.nz === 1 ? 0 : Math.PI;
  st.requestTeleport([p.at[0] + p.facade.nx * 1.5, p.at[1] + p.facade.nz * 1.5, yaw]);
  st.close();
}

function MapTab() {
  const discovered = useNeon((s) => s.discovered);
  const openHub = useNeon((s) => s.openHub);
  const scale = 1.6;
  const size = BOUND * 2 * scale;
  const toMap = (v: number) => (v + BOUND) * scale;
  const me = neonRuntime.walker;
  return (
    <div className="grid gap-5 lg:grid-cols-[auto_1fr]">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="max-w-full" role="img" aria-label="District map with the eight locations">
        <rect width={size} height={size} fill="#07070d" stroke="#ff3b4f" />
        {COLLIDERS.map((b, i) => (
          <rect key={i} x={toMap(b.minX)} y={toMap(b.minZ)} width={(b.maxX - b.minX) * scale} height={(b.maxZ - b.minZ) * scale} fill="#1b1f30" stroke="rgba(62,240,255,0.3)" />
        ))}
        {POIS.map((p) => (
          <g key={p.id}>
            <rect x={toMap(p.at[0]) - 5} y={toMap(p.at[1]) - 5} width={10} height={10} fill={p.color} transform={`rotate(45 ${toMap(p.at[0])} ${toMap(p.at[1])})`} />
          </g>
        ))}
        <circle cx={toMap(me.x)} cy={toMap(me.z)} r={5} fill="#f3e600" />
      </svg>
      <ul className="space-y-2">
        {POIS.map((p) => (
          <li key={p.id} className="flex flex-wrap items-center gap-2">
            <span className="size-3 rotate-45" style={{ background: p.color }} aria-hidden />
            <span className="min-w-[150px] flex-1 text-[17px]">
              {p.name} {!discovered.includes(p.id) && <span className="text-[13px] text-[var(--nc-dim)]">· undiscovered</span>}
            </span>
            <button type="button" className="nc-btn" style={{ minHeight: 32, fontSize: 12 }} onClick={() => fastTravel(p)}>
              Fast travel
            </button>
            {p.screen !== "exit" ? (
              <button type="button" className="nc-btn is-ghost" style={{ minHeight: 32, fontSize: 12 }} onClick={() => openHub(p.screen as HubTab)} aria-label={`Open ${p.name} without travelling`}>
                Open
              </button>
            ) : (
              <button type="button" className="nc-btn is-ghost" style={{ minHeight: 32, fontSize: 12 }} onClick={() => useNeon.getState().open("exit")} aria-label={`Open ${p.name} without travelling`}>
                Open
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

const PANES: Record<HubTab, () => ReactNode> = {
  character: Character,
  lifepath: LifePath,
  cyberware: Cyberware,
  perks: Perks,
  jobs: Jobs,
  gigs: Gigs,
  shards: Shards,
  map: MapTab,
};

export function Hub() {
  const tab = useNeon((s) => s.tab);
  const openHub = useNeon((s) => s.openHub);
  const close = useNeon((s) => s.close);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => ref.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.focus(), []);
  const Pane = PANES[tab];
  const label = TABS.find((t) => t.id === tab)!.label;
  return (
    <div className="nc-screen" role="dialog" aria-modal="true" aria-label={`Terminal: ${label}`}>
      <div ref={ref} className="nc-panel nc-cut w-[min(1100px,100%)] p-4 sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div role="tablist" aria-label="Terminal sections" className="flex flex-wrap gap-1.5">
            {TABS.map((t) => (
              <button key={t.id} type="button" role="tab" aria-selected={t.id === tab} className="nc-btn" style={{ minHeight: 34, fontSize: 13 }} onClick={() => openHub(t.id)}>
                {t.label}
                {t.key && <span className="text-[11px] opacity-60">[{t.key}]</span>}
              </button>
            ))}
          </div>
          <button type="button" className="nc-btn is-ghost" onClick={close} aria-label="Close terminal" style={{ minHeight: 34 }}>
            <X size={16} aria-hidden />
          </button>
        </div>
        <h2 className="nc-display mb-4 text-2xl">{label}</h2>
        <Pane />
      </div>
    </div>
  );
}
