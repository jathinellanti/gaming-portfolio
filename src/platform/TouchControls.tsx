import { useRef, type ReactNode } from "react";

// Shared touch layer for the games: left thumb joystick, right-side drag to look,
// and a column of action buttons. Shown only on coarse pointers.

export interface TouchAction {
  id: string;
  label: string;
  icon?: ReactNode;
  onDown(): void;
  onUp?(): void;
}

export function TouchControls({ onMove, onLook, actions }: { onMove(x: number, y: number): void; onLook(dx: number, dy: number): void; actions: TouchAction[] }) {
  const knob = useRef<HTMLDivElement>(null);
  const stick = useRef<{ id: number; x: number; y: number } | null>(null);
  const look = useRef<{ id: number; x: number; y: number } | null>(null);
  const R = 52;

  return (
    <div className="pointer-events-none absolute inset-0 z-20 select-none" style={{ touchAction: "none" }}>
      {/* Look area: right 60% of the screen */}
      <div
        className="pointer-events-auto absolute right-0 top-0 h-full w-[60%]"
        onPointerDown={(e) => {
          look.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          const l = look.current;
          if (!l || l.id !== e.pointerId) return;
          onLook((e.clientX - l.x) * 2.2, (e.clientY - l.y) * 2.2);
          l.x = e.clientX;
          l.y = e.clientY;
        }}
        onPointerUp={() => (look.current = null)}
        onPointerCancel={() => (look.current = null)}
      />
      {/* Joystick */}
      <div
        className="pointer-events-auto absolute bottom-24 left-6 grid size-[132px] place-items-center rounded-full border-2 border-white/30 bg-black/25"
        aria-label="Movement joystick"
        role="application"
        onPointerDown={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          stick.current = { id: e.pointerId, x: r.left + r.width / 2, y: r.top + r.height / 2 };
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          const s = stick.current;
          if (!s || s.id !== e.pointerId) return;
          let dx = e.clientX - s.x;
          let dy = e.clientY - s.y;
          const d = Math.hypot(dx, dy);
          if (d > R) {
            dx = (dx / d) * R;
            dy = (dy / d) * R;
          }
          if (knob.current) knob.current.style.transform = `translate(${dx}px, ${dy}px)`;
          onMove(dx / R, dy / R);
        }}
        onPointerUp={() => {
          stick.current = null;
          if (knob.current) knob.current.style.transform = "";
          onMove(0, 0);
        }}
        onPointerCancel={() => {
          stick.current = null;
          onMove(0, 0);
        }}
      >
        <div ref={knob} className="size-14 rounded-full border-2 border-white/60 bg-white/25" />
      </div>
      {/* Actions */}
      <div className="pointer-events-auto absolute bottom-24 right-4 flex flex-col gap-2">
        {actions.map((a) => (
          <button
            key={a.id}
            type="button"
            aria-label={a.label}
            className="grid size-14 place-items-center rounded-full border-2 border-white/50 bg-black/40 text-xs font-semibold text-white active:bg-white/30"
            onPointerDown={(e) => {
              e.preventDefault();
              a.onDown();
            }}
            onPointerUp={() => a.onUp?.()}
            onPointerCancel={() => a.onUp?.()}
          >
            {a.icon ?? a.label}
          </button>
        ))}
      </div>
    </div>
  );
}
