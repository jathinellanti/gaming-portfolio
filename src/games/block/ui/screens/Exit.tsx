import { useState } from "react";
import { useNavigate } from "react-router";
import { useContent } from "../../../../content/useContent";
import { GuiWindow } from "../Window";
import { useBlock } from "../../store";

// The Exit Gate: contact details first, then the way out.
export function ExitScreen() {
  const { profile } = useContent();
  const close = useBlock((s) => s.close);
  const navigate = useNavigate();
  const [copied, setCopied] = useState<"idle" | "ok" | "fail">("idle");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopied("ok");
    } catch {
      setCopied("fail");
    }
  };

  return (
    <GuiWindow title="The Exit Gate" width={480}>
      <p className="text-[15px]">Leaving already? Here's how to reach me.</p>
      <div className="mt-3 rounded border-2 border-[#8b8b8b] bg-[#b4b4b4] p-3">
        <p className="text-sm opacity-75">Email</p>
        <p className="select-text break-all text-lg">{profile.email}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <a className="jc-btn" href={`mailto:${profile.email}`} style={{ fontSize: 15 }}>
            Send an email
          </a>
          <button type="button" className="jc-btn" onClick={copy} style={{ fontSize: 15 }}>
            Copy address
          </button>
          <span aria-live="polite" className="self-center text-sm">
            {copied === "ok" ? "Copied!" : copied === "fail" ? "Select the address and press Ctrl+C" : ""}
          </span>
        </div>
        <p className="mt-3 text-sm opacity-75">Elsewhere</p>
        <div className="mt-1 flex flex-wrap gap-2">
          <a className="jc-btn" href={profile.links.github} target="_blank" rel="noopener noreferrer" style={{ fontSize: 15 }}>
            GitHub
          </a>
          {profile.links.linkedin && (
            <a className="jc-btn" href={profile.links.linkedin} target="_blank" rel="noopener noreferrer" style={{ fontSize: 15 }}>
              LinkedIn
            </a>
          )}
          <button type="button" className="jc-btn" onClick={() => navigate("/cv")} style={{ fontSize: 15 }}>
            View CV
          </button>
        </div>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <button type="button" className="jc-btn" onClick={close} data-autofocus>
          Stay in the world
        </button>
        <button type="button" className="jc-btn" onClick={() => navigate("/")}>
          Return to Professional Portfolio
        </button>
      </div>
    </GuiWindow>
  );
}
