import { useState } from "react";
import { useNavigate } from "react-router";
import { PhoneIncoming, X } from "lucide-react";
import { useContent } from "../../../content/useContent";
import { useNeon, type HubTab } from "../store";
import { useSettings } from "../../../platform/settings";

const ENTRIES: [HubTab, string][] = [
  ["character", "Character"],
  ["lifepath", "Life Path"],
  ["cyberware", "Cyberware · Skills"],
  ["perks", "Perks · Skill Tree"],
  ["jobs", "Jobs · Projects"],
  ["gigs", "Gigs · Case Studies"],
  ["shards", "Shards · Achievements"],
  ["map", "Map · Fast Travel"],
];

export function Pause() {
  const close = useNeon((s) => s.close);
  const openHub = useNeon((s) => s.openHub);
  const open = useNeon((s) => s.open);
  const navigate = useNavigate();
  return (
    <div className="nc-screen" role="dialog" aria-modal="true" aria-labelledby="nc-pause">
      <div className="w-[min(460px,100%)]">
        <h2 id="nc-pause" className="nc-display mb-1 text-3xl text-[var(--nc-yellow)]">
          Paused
        </h2>
        <p className="nc-label mb-5">NEON//SPRAWL · every section, one click away</p>
        <div className="grid gap-2">
          <button type="button" className="nc-btn w-full" onClick={close} data-autofocus autoFocus>
            Resume
          </button>
          <div className="grid grid-cols-2 gap-2">
            {ENTRIES.map(([tab, label]) => (
              <button key={tab} type="button" className="nc-btn" style={{ fontSize: 13 }} onClick={() => openHub(tab)}>
                {label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" className="nc-btn" onClick={() => open("settings")}>
              Settings
            </button>
            <button type="button" className="nc-btn" onClick={() => open("exit")}>
              Contact
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" className="nc-btn is-ghost" onClick={() => navigate("/cv")}>
              Open CV
            </button>
            <button type="button" className="nc-btn is-ghost" onClick={() => navigate("/")}>
              Exit to Portfolio
            </button>
          </div>
        </div>
        <p className="mt-5 text-[14px] text-[var(--nc-dim)]">WASD move · Mouse/Arrows look · Shift sprint · Space jump · Hold Tab scan · F enter · J journal · C character · P perks · M map</p>
      </div>
    </div>
  );
}

export function Settings() {
  const s = useNeon();
  const sound = useSettings((x) => x.sound);
  const music = useSettings((x) => x.music);
  const setSettings = useSettings((x) => x.set);
  return (
    <div className="nc-screen" role="dialog" aria-modal="true" aria-labelledby="nc-settings">
      <div className="nc-panel nc-cut w-[min(460px,100%)] p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="nc-settings" className="nc-display text-xl">
            Settings
          </h2>
          <button type="button" className="nc-btn is-ghost" onClick={s.close} aria-label="Close settings" style={{ minHeight: 32 }}>
            <X size={16} aria-hidden />
          </button>
        </div>
        <div className="grid gap-4 text-[16px]">
          <div>
            <p className="nc-label mb-2">Graphics quality</p>
            <div className="flex gap-2" role="radiogroup" aria-label="Graphics quality">
              {(["low", "medium", "high"] as const).map((q) => (
                <button key={q} type="button" role="radio" aria-checked={s.quality === q} aria-selected={s.quality === q} className="nc-btn" onClick={() => s.setOption({ quality: q })}>
                  {q}
                </button>
              ))}
            </div>
            <p className="mt-1 text-[14px] text-[var(--nc-dim)]">Low skips post-processing; High adds mirror-wet streets.</p>
          </div>
          <label className="grid gap-1">
            <span className="flex justify-between">
              <span>Field of view</span>
              <span>{s.fov}°</span>
            </span>
            <input type="range" min={50} max={110} value={s.fov} onChange={(e) => s.setOption({ fov: Number(e.target.value) })} />
          </label>
          <label className="grid gap-1">
            <span className="flex justify-between">
              <span>Mouse sensitivity</span>
              <span>{Math.round(s.sensitivity * 100)}%</span>
            </span>
            <input type="range" min={20} max={300} value={Math.round(s.sensitivity * 100)} onChange={(e) => s.setOption({ sensitivity: Number(e.target.value) / 100 })} />
          </label>
          <label className="flex items-center justify-between">
            <span>Sound</span>
            <input type="checkbox" checked={sound} onChange={(e) => setSettings({ sound: e.target.checked })} />
          </label>
          <label className="flex items-center justify-between">
            <span>Music</span>
            <input type="checkbox" checked={music} disabled={!sound} onChange={(e) => setSettings({ music: e.target.checked })} />
          </label>
        </div>
      </div>
    </div>
  );
}

export function Exit() {
  const { profile } = useContent();
  const close = useNeon((s) => s.close);
  const navigate = useNavigate();
  const [copied, setCopied] = useState("");
  return (
    <div className="nc-screen" role="dialog" aria-modal="true" aria-labelledby="nc-exit">
      <div className="nc-panel nc-cut w-[min(520px,100%)] p-5">
        <p className="nc-label">Metro · last train out</p>
        <h2 id="nc-exit" className="nc-display mt-1 text-2xl text-[var(--nc-yellow)]">
          Contact
        </h2>
        <p className="mt-3 select-text break-all text-xl">{profile.email}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <a href={`mailto:${profile.email}`} className="nc-btn">
            Send email
          </a>
          <button
            type="button"
            className="nc-btn is-ghost"
            onClick={() =>
              navigator.clipboard?.writeText(profile.email).then(
                () => setCopied("Copied"),
                () => setCopied("Select the address and press Ctrl+C"),
              )
            }
          >
            Copy
          </button>
          <a href={profile.links.github} target="_blank" rel="noopener noreferrer" className="nc-btn is-ghost">
            GitHub
          </a>
          <button type="button" className="nc-btn is-ghost" onClick={() => navigate("/cv")}>
            View CV
          </button>
          <span aria-live="polite" className="self-center text-[14px] text-[var(--nc-cyan)]">
            {copied}
          </span>
        </div>
        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          <button type="button" className="nc-btn is-ghost" onClick={close} autoFocus>
            Stay in the city
          </button>
          <button type="button" className="nc-btn" onClick={() => navigate("/")}>
            Return to Professional Portfolio
          </button>
        </div>
      </div>
    </div>
  );
}

/** Optional, skippable welcome "holo-call" on first visit. */
export function HoloCall() {
  const { profile } = useContent();
  const callOpen = useNeon((s) => s.callOpen);
  const setCall = useNeon((s) => s.setCall);
  const openHub = useNeon((s) => s.openHub);
  const [answered, setAnswered] = useState(false);
  if (!callOpen) return null;
  return (
    <div className="absolute bottom-16 left-3 z-20 w-[min(360px,calc(100vw-24px))] sm:left-5" role="dialog" aria-label="Incoming holo-call">
      <div className="nc-panel nc-cut p-4">
        <p className="nc-label flex items-center gap-2">
          <PhoneIncoming size={14} aria-hidden /> Incoming call · Guide
        </p>
        {!answered ? (
          <div className="mt-3 flex gap-2">
            <button type="button" className="nc-btn" onClick={() => setAnswered(true)}>
              Answer
            </button>
            <button type="button" className="nc-btn is-ghost" onClick={() => setCall(false)}>
              Ignore
            </button>
          </div>
        ) : (
          <>
            <p className="mt-2 text-[16px] leading-snug">
              Welcome to the Sprawl. This block is {profile.shortName}&apos;s CV. Every neon storefront is a part of it. Hold Tab to scan, F to walk in, or open any of it right now.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className="nc-btn" style={{ fontSize: 12 }} onClick={() => (setCall(false), openHub("map"))}>
                Show me the map
              </button>
              <button type="button" className="nc-btn is-ghost" style={{ fontSize: 12 }} onClick={() => setCall(false)}>
                Hang up
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
