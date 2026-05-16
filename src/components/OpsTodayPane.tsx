import React from "react";
import { useStore } from "../store";
import { fmtElapsed } from "../utils/clock";

export function OpsTodayPane() {
  const rows = useStore((s) => s.opsRows);
  const visits = useStore((s) => s.visits);
  const clock = useStore((s) => s.clock);
  const setActive = useStore((s) => s.setActiveChannel);
  const channels = useStore((s) => s.channels);

  const entries = Object.values(rows).sort((a, b) => (a.startedAt ?? "").localeCompare(b.startedAt ?? ""));
  const channelForVisit = (visitId: string) => channels.find((c) => c.kind === "visit" && c.visitId === visitId);

  return (
    <div className="flex-1 flex flex-col bg-white min-w-0">
      <div className="h-[60px] border-b border-slack-border bg-white flex items-center px-5 gap-3 flex-shrink-0">
        <div className="flex-1 min-w-0">
          <div className="font-extrabold text-[18px] text-slack-textPrimary flex items-center gap-2">
            <span>📊 #ops-today</span>
            <span className="text-xs bg-acko-sage/20 text-acko-sageDark px-2 py-0.5 rounded">Live dashboard</span>
          </div>
          <div className="text-[12px] text-slack-textSecondary">
            One row per active visit · clock <span className="font-mono font-bold">{clock}</span>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto slack-scroll p-5 bg-acko-warm/30">
        <div className="grid grid-cols-[80px,1fr,90px,1fr,90px] gap-x-3 px-3 py-2 text-[11px] uppercase tracking-wider text-slack-textSecondary font-bold border-b border-slack-border">
          <div>Patient</div>
          <div>Visit</div>
          <div>Room</div>
          <div>Status</div>
          <div className="text-right">Elapsed</div>
        </div>
        {entries.length === 0 ? (
          <div className="text-slack-textSecondary text-center py-12 italic">
            No active visits. Open the control panel and launch a scenario or use “Run the day”.
          </div>
        ) : (
          entries.map((r) => {
            const v = visits[r.visitId];
            const ch = channelForVisit(r.visitId);
            return (
              <button
                key={r.visitId}
                onClick={() => ch && setActive(ch.id)}
                className="grid grid-cols-[80px,1fr,90px,1fr,90px] gap-x-3 px-3 py-2.5 items-center hover:bg-white text-left w-full border-b border-slack-divider/70"
              >
                <div className="font-bold text-[14px]">{r.patientInitial}</div>
                <div className="text-[13px]">
                  <div>
                    <span className="font-semibold capitalize">{r.visitType.replace("-", " ")}</span>
                    {v?.package && <span className="text-slack-textSecondary"> · {v.package}</span>}
                    {v?.concern && <span className="text-slack-textSecondary"> · {v.concern}</span>}
                  </div>
                  <div className="text-[11px] text-slack-textSecondary">
                    {ch ? `#${ch.name}` : ""}{r.currentStep ? ` · ${r.currentStep}` : ""}
                  </div>
                </div>
                <div className="text-[12px] font-semibold">{r.currentRoom ?? "—"}</div>
                <div className="text-[13px]">{r.statusLine}</div>
                <div className="text-[12px] text-slack-textSecondary text-right">
                  {r.startedAt ? fmtElapsed(r.startedAt, clock) : "—"}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
