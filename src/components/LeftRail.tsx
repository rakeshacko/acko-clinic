import React from "react";
import { useStore } from "../store";

export function LeftRail() {
  const toggleControlPanel = useStore((s) => s.toggleControlPanel);
  const toggleFloorBoard = useStore((s) => s.toggleFloorBoard);
  return (
    <div className="w-[68px] bg-[#3F0E40] flex flex-col items-center py-3 text-white">
      <div className="w-9 h-9 rounded bg-acko-sage flex items-center justify-center font-extrabold text-[14px] mb-3 shadow-sm">
        AK
      </div>
      <div className="text-[9px] text-white/70 mb-3 text-center leading-tight">
        ACKO
        <br />Clinic
      </div>
      <div className="flex flex-col gap-3 mt-1">
        <RailIcon label="Home" icon="🏠" active />
        <RailIcon label="DMs" icon="💬" />
        <RailIcon label="Activity" icon="🔔" />
        <RailIcon label="Floor" icon="🏥" onClick={toggleFloorBoard} />
        <RailIcon label="Run" icon="🎬" onClick={toggleControlPanel} />
      </div>
      <div className="mt-auto pb-2 text-[10px] text-white/40">v0.1</div>
    </div>
  );
}

function RailIcon({ label, icon, active, onClick }: { label: string; icon: string; active?: boolean; onClick?: () => void }) {
  return (
    <button
      title={label}
      onClick={onClick}
      className={`w-10 h-10 rounded-md flex items-center justify-center text-xl ${
        active ? "bg-white/15" : "hover:bg-white/10"
      }`}
    >
      <span>{icon}</span>
    </button>
  );
}
