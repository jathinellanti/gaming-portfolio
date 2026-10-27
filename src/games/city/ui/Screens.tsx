import { useEffect, useRef, type ReactNode } from "react";
import { Link } from "react-router";
import { ArrowUpRight, Check, Code2, FileText, LogOut, Mail, Map as MapIcon, Settings as Cog, Target, X } from "lucide-react";
import { useContent } from "../../../content/useContent";
import { skillById, SKILL_CATEGORIES, SKILL_CATEGORY_LABELS } from "../../../content/model";
import { useSettings } from "../../../platform/settings";
import { cityRuntime } from "../runtime";
import { useCity } from "../store";
import { MISSIONS, missionById, type Mission } from "../content";
import { MARKERS, type MissionId } from "../world/layout";
import { drawMap } from "./mapDraw";

// Full-screen panels: the mission briefing (real CV content), the phone, the pause
// menu, the city map (fast travel) and settings.

function Panel({ title, kicker, onClose, children, wide = false }: { title: string; kicker?: string; onClose(): void; children: ReactNode; wide?: boolean }) {
  return (
    <div className="ct-screen" role="dialog" aria-modal="true" aria-labelledby="ct-panel-title">
      <div className={`ct-panel ${wide ? "is-wide" : ""}`}>
        <header className="ct-panel-head">
          <div>
            {kicker && <p className="ct-kicker">{kicker}</p>}
            <h2 id="ct-panel-title" className="ct-title">
              {title}
            </h2>
          </div>
          <button type="button" className="ct-icon" onClick={onClose} aria-label="Close">
            <X size={18} aria-hidden />
          </button>
        </header>
        <div className="ct-panel-body">{children}</div>
      </div>
    </div>
  );
}

function MissionBody({ mission }: { mission: Mission }) {
  const content = useContent();
  const { profile, projects, skills, education, experience, achievements } = content;
  switch (mission.kind) {
    case "profile":
      return (
        <>
          <p className="ct-lead">
            {profile.name} · {profile.title}
          </p>
          {profile.subtitle && <p className="ct-dim">{profile.subtitle}</p>}
          <p className="ct-dim">{profile.location}</p>
          {profile.about.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </>
      );
    case "project": {
      const p = projects.find((x) => x.slug === mission.project);
      if (!p) return <p>This project isn&apos;t in the CV any more.</p>;
      return (
        <>
          <p className="ct-lead">{p.title}</p>
          <p className="ct-dim">{p.role}</p>
          <p>{p.summary}</p>
          <ul className="ct-list">
            {p.features.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
          <p className="ct-chips">
            {p.tech
              .map((t) => skillById(content, t))
              .filter((s) => s !== undefined)
              .map((s) => (
                <span key={s.id}>{s.name}</span>
              ))}
          </p>
          <p className="ct-links">
            <Link to={`/projects/${p.slug}`}>Read the case study</Link>
            {p.links.repo && (
              <a href={p.links.repo} target="_blank" rel="noopener noreferrer">
                Source code <ArrowUpRight size={14} aria-hidden />
              </a>
            )}
          </p>
        </>
      );
    }
    case "skills":
      return (
        <>
          {SKILL_CATEGORIES.map((c) => {
            const items = skills.filter((s) => s.category === c);
            if (!items.length) return null;
            return (
              <div key={c} className="ct-group">
                <p className="ct-kicker">{SKILL_CATEGORY_LABELS[c]}</p>
                <p className="ct-chips">
                  {items.map((s) => (
                    <span key={s.id}>{s.name}</span>
                  ))}
                </p>
              </div>
            );
          })}
        </>
      );
    case "education":
      return (
        <ul className="ct-entries">
          {education.map((e) => (
            <li key={e.id}>
              <p className="ct-lead">{e.programme}</p>
              <p className="ct-dim">
                {e.institution} · {e.location}
                {e.result && ` · ${e.result.label} ${e.result.value}`}
              </p>
            </li>
          ))}
        </ul>
      );
    case "experience":
      return (
        <ul className="ct-entries">
          {experience.map((e) => (
            <li key={e.id}>
              <p className="ct-lead">
                {e.role} · {e.organisation}
              </p>
              <p className="ct-dim">{e.location}</p>
              <p>{e.summary}</p>
            </li>
          ))}
        </ul>
      );
    case "certifications":
      return (
        <ul className="ct-entries">
          {achievements.map((a) => (
            <li key={a.id}>
              <p className="ct-lead">{a.title}</p>
              <p className="ct-dim">{a.issuer}</p>
            </li>
          ))}
        </ul>
      );
  }
}

export function MissionScreen() {
  const id = useCity((s) => s.mission);
  const passed = useCity((s) => s.passed);
  const close = useCity((s) => s.close);
  const complete = useCity((s) => s.completeMission);
  if (!id) return null;
  const m = missionById(id);
  return (
    <Panel title={m.title} kicker={`Mission · ${m.place}`} onClose={close}>
      <MissionBody mission={m} />
      <div className="ct-actions">
        <button type="button" className="ct-btn is-primary" onClick={complete}>
          <Check size={16} aria-hidden /> {passed.includes(id) ? "Done" : "Complete mission"}
        </button>
        <button type="button" className="ct-btn" onClick={close}>
          Leave
        </button>
      </div>
    </Panel>
  );
}

function teleportTo(id: MissionId) {
  const m = MARKERS.find((k) => k.id === id)!;
  useCity.getState().requestTeleport([m.at[0] + 4, m.at[1] + 4]);
}

export function MapScreen() {
  const ref = useRef<HTMLCanvasElement>(null);
  const passed = useCity((s) => s.passed);
  const close = useCity((s) => s.close);
  useEffect(() => {
    const c = ref.current!;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = c.clientWidth;
    const h = c.clientHeight;
    c.width = w * dpr;
    c.height = h * dpr;
    const g = c.getContext("2d")!;
    g.scale(dpr, dpr);
    const rt = cityRuntime;
    const p = rt.driving >= 0 ? rt.cars[rt.driving] : rt.player;
    drawMap(g, w, h, { cx: 15, cz: 0, scale: Math.min(w / 330, h / 290), rotation: 0 }, { player: { x: p.x, z: p.z, facing: rt.driving >= 0 ? rt.cars[rt.driving].heading : rt.player.facing }, passed });
  }, [passed]);
  return (
    <Panel title="Sunset Bay" kicker="Map · fast travel" onClose={close} wide>
      <div className="ct-map">
        <canvas ref={ref} aria-label="Map of Sunset Bay with mission markers" role="img" />
        <ul className="ct-maplist">
          {MISSIONS.map((m) => (
            <li key={m.id}>
              <button type="button" className="ct-btn" onClick={() => teleportTo(m.id)}>
                <span className={passed.includes(m.id) ? "ct-dot is-done" : "ct-dot"} aria-hidden />
                <span>
                  {m.place}
                  <small>{m.title}</small>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </Panel>
  );
}

export function SettingsScreen() {
  const quality = useCity((s) => s.quality);
  const sensitivity = useCity((s) => s.sensitivity);
  const setOption = useCity((s) => s.setOption);
  const close = useCity((s) => s.close);
  const sound = useSettings((s) => s.sound);
  const music = useSettings((s) => s.music);
  const setSettings = useSettings((s) => s.set);
  return (
    <Panel title="Settings" onClose={close}>
      <p className="ct-kicker">Graphics quality</p>
      <div className="ct-row" role="radiogroup" aria-label="Graphics quality">
        {(["low", "medium", "high"] as const).map((q) => (
          <button key={q} type="button" role="radio" aria-checked={quality === q} className={`ct-btn ${quality === q ? "is-primary" : ""}`} onClick={() => setOption({ quality: q })}>
            {q}
          </button>
        ))}
      </div>
      <label className="ct-field">
        <span>Look sensitivity · {Math.round(sensitivity * 100)}%</span>
        <input type="range" min={20} max={300} value={Math.round(sensitivity * 100)} onChange={(e) => setOption({ sensitivity: Number(e.target.value) / 100 })} />
      </label>
      <label className="ct-check">
        <input type="checkbox" checked={sound} onChange={(e) => setSettings({ sound: e.target.checked })} /> Sound
      </label>
      <label className="ct-check">
        <input type="checkbox" checked={music} disabled={!sound} onChange={(e) => setSettings({ music: e.target.checked })} /> Radio
      </label>
    </Panel>
  );
}

export function PauseScreen() {
  const close = useCity((s) => s.close);
  const open = useCity((s) => s.open);
  const openMission = useCity((s) => s.openMission);
  return (
    <Panel title="Paused" kicker="Sunset Bay · every section, one click away" onClose={close}>
      <div className="ct-grid">
        <button type="button" className="ct-btn is-primary" onClick={close}>
          Resume
        </button>
        {MISSIONS.map((m) => (
          <button key={m.id} type="button" className="ct-btn" onClick={() => openMission(m.id)}>
            {m.place}
          </button>
        ))}
        <button type="button" className="ct-btn" onClick={() => open("map")}>
          Map · fast travel
        </button>
        <button type="button" className="ct-btn" onClick={() => open("settings")}>
          Settings
        </button>
        <Link className="ct-btn" to="/cv">
          Open CV
        </Link>
        <Link className="ct-btn" to="/">
          Exit to portfolio
        </Link>
      </div>
      <p className="ct-dim ct-keys">WASD move/drive · mouse look · Shift sprint · Space jump/handbrake · F get in/out · ↑ or P phone · M map · Esc menu</p>
    </Panel>
  );
}

export function PhoneScreen() {
  const { profile } = useContent();
  const close = useCity((s) => s.close);
  const open = useCity((s) => s.open);
  const passed = useCity((s) => s.passed);
  const apps: { label: string; icon: ReactNode; tone: string; href?: string; to?: string; onClick?(): void }[] = [
    { label: "Email", icon: <Mail size={22} />, tone: "#ff7a59", href: `mailto:${profile.email}` },
    { label: "GitHub", icon: <Code2 size={22} />, tone: "#6c5ce7", href: profile.links.github },
    { label: "CV", icon: <FileText size={22} />, tone: "#2a9d8f", to: "/cv" },
    { label: "Map", icon: <MapIcon size={22} />, tone: "#3a86ff", onClick: () => open("map") },
    { label: "Missions", icon: <Target size={22} />, tone: "#ffbe0b", onClick: () => open("pause") },
    { label: "Settings", icon: <Cog size={22} />, tone: "#8d99ae", onClick: () => open("settings") },
    { label: "Exit", icon: <LogOut size={22} />, tone: "#e63946", to: "/" },
  ];
  return (
    <div className="ct-phone-wrap" role="dialog" aria-modal="true" aria-label="Phone">
      <div className="ct-phone">
        <div className="ct-phone-top">
          <span>{new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
          <button type="button" className="ct-icon" onClick={close} aria-label="Put the phone away">
            <X size={16} aria-hidden />
          </button>
        </div>
        <p className="ct-phone-name">{profile.name}</p>
        <p className="ct-phone-sub">
          {passed.length} of {MARKERS.length} missions passed
        </p>
        <ul className="ct-apps">
          {apps.map((a) => {
            const inner = (
              <>
                <span className="ct-app-icon" style={{ background: a.tone }} aria-hidden>
                  {a.icon}
                </span>
                <span>{a.label}</span>
              </>
            );
            return (
              <li key={a.label}>
                {a.href ? (
                  <a className="ct-app" href={a.href} target={a.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer">
                    {inner}
                  </a>
                ) : a.to ? (
                  <Link className="ct-app" to={a.to}>
                    {inner}
                  </Link>
                ) : (
                  <button type="button" className="ct-app" onClick={a.onClick}>
                    {inner}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
