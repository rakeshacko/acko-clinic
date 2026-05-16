import React from "react";
import { useStore } from "../store";
import { fmtElapsed } from "../utils/clock";

export function OpsTodayPane() {
  const rows = useStore((s) => s.opsRows);
  const visits = useStore((s) => s.visits);
  const clock = useStore((s) => s.clock);
  const setActive = useStore((s) => s.setActiveChannel);
  const channels = useStore((s) => s.channels);
  const setMobileSidebar = useStore((s) => s.setMobileSidebarOpen);

  const entries = Object.values(rows).sort((a, b) => (a.startedAt ?? "").localeCompare(b.startedAt ?? ""));
  const channelForVisit = (visitId: string) => channels.find((c) => c.kind === "visit" && c.visitId === visitId);

  return (
    <div className="flex-1 flex flex-col bg-white min-w-0 min-h-0 h-full">
      <div className="h-[56px] md:h-[60px] border-b border-slack-border bg-white flex items-center px-3 md:px-5 gap-2 md:gap-3 flex-shrink-0">
        <button
          className="md:hidden -ml-1 w-9 h-9 flex items-center justify-center rounded-md text-slack-textSecondary hover:bg-slack-divider/40 text-xl"
          onClick={() => setMobileSidebar(true)}
          aria-label="Back to channels"
        >
          ‹
        </button>
        <div className="flex-1 min-w-0">
          <div className="font-extrabold text-[16px] md:text-[18px] text-slack-textPrimary flex items-center gap-2 truncate">
            <span className="truncate">📊 #ops-today</span>
            <span className="text-[10px] md:text-xs bg-acko-sage/20 text-acko-sageDark px-1.5 py-0.5 rounded whitespace-nowrap">Live</span>
          </div>
          <div className="text-[11px] md:text-[12px] text-slack-textSecondary truncate">
            One row per active visit · <span className="font-mono font-bold">{clock}</span>
          </div>
        </div>
      </div>
      <div
        className="flex-1 overflow-y-auto overscroll-contain slack-scroll p-3 md:p-5 bg-acko-warm/30 min-h-0"
        style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}
      >
        {/* Desktop table header */}
        <div className="hidden md:grid grid-cols-[80px,1fr,90px,1fr,90px] gap-x-3 px-3 py-2 text-[11px] uppercase tracking-wider text-slack-textSecondary font-bold border-b border-slack-border">
          <div>Patient</div>
          <div>Visit</div>
          <div>Room</div>
          <div>Status</div>
          <div className="text-right">Elapsed</div>
        </div>
        {entries.length === 0 ? (
          <div className="text-slack-textSecondary text-center py-12 italic text-[13px] md:text-[14px]">
            No active visits. Open the cockpit (🎬) and launch a scenario.
          </div>
        ) : (
          entries.map((r) => {
            const v = visits[r.visitId];
            const ch = channelForVisit(r.visitId);
            return (
              <button
                key={r.visitId}
                onClick={() => ch && setActive(ch.id)}
                className="block w-full text-left border-b border-slack-divider/70 hover:bg-white"
              >
                {/* Mobile card layout */}
                <div className="md:hidden p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-bold text-[14px]">{r.patientInitial}</div>
                    <div className="text-[10px] uppercase tracking-wide text-slack-textSecondary">{r.visitType.replace("-", " ")}</div>
                  </div>
                  <div className="text-[12px] mt-0.5">
                    {v?.package && <span>{v.package}</span>}
                    {v?.concern && <span>{v.concern}</span>}
                  </div>
                  <div className="flex items-center justify-between mt-1.5 gap-2">
                    <div className="text-[13px] flex items-center gap-2 min-w-0">
                      {r.currentRoom && (
                        <span className="font-semibold text-acko-sageDark whitespace-nowrap">{r.currentRoom}</span>
                      )}
                      <span className="truncate text-slack-textPrimary">{r.statusLine}</span>
                    </div>
                    <div className="text-[11px] text-slack-textSecondary whitespace-nowrap">
                      {r.startedAt ? fmtElapsed(r.startedAt, clock) : ""}
                    </div>
                  </div>
                  {ch && (
                    <div className="text-[10px] text-acko-sageDark mt-1 truncate">#{ch.name}</div>
                  )}
                </div>
                {/* Desktop row layout */}
                <div className="hidden md:grid grid-cols-[80px,1fr,90px,1fr,90px] gap-x-3 px-3 py-2.5 items-center">
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
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
