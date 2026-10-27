import { Check, LayoutDashboard, CalendarDays, Users, Settings, Bell, X } from "lucide-react";

// Illustration for the Employee Leave Management System, after HR dashboard shots:
// leave-type balance cards, a month calendar with leave marked, a usage donut and
// requests awaiting HR approval. The app really has Admin, HR and Employee views;
// the figures and initials here are illustrative (the cover says "Illustration").

const TYPES = [
  { name: "Annual", used: 12, of: 18, tone: "#7c5cff", soft: "#efeaff" },
  { name: "Sick", used: 3, of: 10, tone: "#ff8a3d", soft: "#fff0e5" },
  { name: "Casual", used: 2, of: 6, tone: "#14b8a6", soft: "#e2f8f5" },
];
// Days of a 5-week month carrying a leave chip, and which type.
const LEAVE: Record<number, number> = { 3: 0, 4: 0, 10: 1, 17: 2, 18: 2, 24: 0, 25: 0, 26: 0 };
const REQUESTS = [
  { who: "AK", tone: "#7c5cff", what: "Annual · 3 days", approved: true },
  { who: "RS", tone: "#ff8a3d", what: "Sick · 1 day", approved: false },
  { who: "PM", tone: "#14b8a6", what: "Casual · 2 days", approved: false },
];

export function ElmsCover() {
  const usedPct = 0.64;
  const r = 15.9;
  const c = 2 * Math.PI * r;
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden bg-[linear-gradient(135deg,#24124f_0%,#5b35c9_52%,#f29a4a_100%)]">
      <div className="absolute -right-[10%] -top-[30%] size-[60cqw] rounded-full bg-[radial-gradient(closest-side,rgb(255_200_140/0.35),transparent)]" />

      <div className="absolute inset-x-[6%] bottom-[-4%] top-[9%] flex overflow-hidden rounded-[1.8cqw] bg-[#f7f6fb] text-[#1d1638] shadow-[0_3cqw_6cqw_-2cqw_rgb(10_5_40/0.6)]">
        {/* Sidebar */}
        <nav className="flex w-[8%] flex-col items-center gap-[1.8cqw] bg-[#1d1638] py-[2cqw] text-white/70">
          <span className="grid size-[3.4cqw] place-items-center rounded-[1cqw] bg-[#7c5cff] text-[1.5cqw] font-bold text-white">L</span>
          <LayoutDashboard className="size-[2.2cqw] text-white" />
          <CalendarDays className="size-[2.2cqw]" />
          <Users className="size-[2.2cqw]" />
          <Settings className="size-[2.2cqw]" />
        </nav>

        <div className="flex-1 p-[2cqw]">
          {/* Top bar */}
          <div className="flex items-center gap-[1.4cqw]">
            <div>
              <p className="text-[2.1cqw] font-semibold leading-tight">Leave overview</p>
              <p className="text-[1.2cqw] text-[#8a84a3]">HR dashboard</p>
            </div>
            <span className="ml-auto h-[2.8cqw] w-[16cqw] rounded-full bg-white shadow-[0_0_0_1px_#e8e5f2]" />
            <Bell className="size-[2cqw] text-[#8a84a3]" />
            <span className="grid size-[3cqw] place-items-center rounded-full bg-[#ffd8b8] text-[1.2cqw] font-semibold text-[#9a4a10]">HR</span>
          </div>

          {/* Leave balances */}
          <div className="mt-[1.6cqw] grid grid-cols-3 gap-[1.2cqw]">
            {TYPES.map((t) => (
              <div key={t.name} className="rounded-[1.3cqw] p-[1.3cqw]" style={{ background: t.soft }}>
                <p className="text-[1.25cqw] font-medium" style={{ color: t.tone }}>
                  {t.name} leave
                </p>
                <p className="mt-[0.3cqw] text-[2.2cqw] font-semibold leading-none">
                  {t.used}
                  <span className="text-[1.3cqw] font-normal text-[#8a84a3]"> / {t.of} days</span>
                </p>
                <span className="mt-[0.9cqw] block h-[0.55cqw] overflow-hidden rounded-full bg-white">
                  <span className="block h-full rounded-full" style={{ width: `${(t.used / t.of) * 100}%`, background: t.tone }} />
                </span>
              </div>
            ))}
          </div>

          <div className="mt-[1.4cqw] grid grid-cols-[1.25fr_1fr] gap-[1.2cqw]">
            {/* Calendar */}
            <div className="rounded-[1.3cqw] bg-white p-[1.2cqw] shadow-[0_0_0_1px_#ece9f5]">
              <p className="text-[1.3cqw] font-semibold">This month</p>
              <div className="mt-[0.8cqw] grid grid-cols-7 gap-[0.45cqw]">
                {Array.from({ length: 35 }, (_, i) => {
                  const day = i - 1;
                  const t = LEAVE[day] !== undefined ? TYPES[LEAVE[day]] : null;
                  return (
                    <span key={i} className="relative grid aspect-square place-items-center rounded-[0.6cqw] text-[1cqw]" style={{ background: t ? t.soft : "#f5f4fa", color: day < 1 || day > 30 ? "#c9c5d8" : "#4b4466" }}>
                      {day >= 1 && day <= 30 ? day : ""}
                      {t && <span className="absolute inset-x-[18%] bottom-[12%] h-[0.35cqw] rounded-full" style={{ background: t.tone }} />}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Usage + requests */}
            <div className="flex flex-col gap-[1.2cqw]">
              <div className="flex items-center gap-[1.2cqw] rounded-[1.3cqw] bg-white p-[1.2cqw] shadow-[0_0_0_1px_#ece9f5]">
                <svg viewBox="0 0 40 40" className="size-[7cqw] -rotate-90">
                  <circle cx="20" cy="20" r={r} fill="none" stroke="#efeaff" strokeWidth="5" />
                  <circle cx="20" cy="20" r={r} fill="none" stroke="#7c5cff" strokeWidth="5" strokeLinecap="round" strokeDasharray={`${c * usedPct} ${c}`} />
                </svg>
                <div>
                  <p className="text-[2.2cqw] font-semibold leading-none">64%</p>
                  <p className="text-[1.15cqw] text-[#8a84a3]">of annual leave used</p>
                </div>
              </div>
              <div className="rounded-[1.3cqw] bg-white p-[1.2cqw] shadow-[0_0_0_1px_#ece9f5]">
                <p className="text-[1.3cqw] font-semibold">Requests</p>
                <ul className="mt-[0.6cqw] space-y-[0.7cqw]">
                  {REQUESTS.map((q) => (
                    <li key={q.who} className="flex items-center gap-[0.8cqw]">
                      <span className="grid size-[2.6cqw] place-items-center rounded-full text-[1cqw] font-semibold text-white" style={{ background: q.tone }}>
                        {q.who}
                      </span>
                      <span className="text-[1.15cqw] text-[#4b4466]">{q.what}</span>
                      {q.approved ? (
                        <span className="showcase-pop ml-auto inline-flex items-center gap-[0.3cqw] rounded-full bg-[#dcfce7] px-[0.8cqw] py-[0.25cqw] text-[1cqw] font-semibold text-[#15803d]">
                          <Check className="size-[1.2cqw]" strokeWidth={3} /> Approved
                        </span>
                      ) : (
                        <span className="ml-auto flex gap-[0.4cqw]">
                          <span className="grid size-[2.2cqw] place-items-center rounded-full bg-[#dcfce7] text-[#15803d]">
                            <Check className="size-[1.2cqw]" strokeWidth={3} />
                          </span>
                          <span className="grid size-[2.2cqw] place-items-center rounded-full bg-[#fee2e2] text-[#b91c1c]">
                            <X className="size-[1.2cqw]" strokeWidth={3} />
                          </span>
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
