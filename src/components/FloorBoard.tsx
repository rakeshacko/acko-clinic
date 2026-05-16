import React from "react";
import { useStore } from "../store";
import type { Room } from "../types";

export function FloorBoard() {
  const rooms = useStore((s) => s.rooms);
  const close = useStore((s) => s.toggleFloorBoard);
  const setRoomStatus = useStore((s) => s.setRoomStatus);

  const groups: { title: string; kind: Room["kind"] }[] = [
    { title: "Diagnostic pods", kind: "diagnostic" },
    { title: "Personal pods", kind: "personal" },
    { title: "Consult rooms", kind: "consult" },
    { title: "Lobby", kind: "lobby" },
  ];

  return (
    <div className="fixed inset-x-0 top-0 bottom-[56px] md:bottom-0 bg-black/40 z-20 flex" onClick={close}>
      <div
        className="ml-auto h-full w-full md:w-[460px] bg-white shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-3 border-b border-slack-border flex items-center justify-between">
          <div>
            <div className="font-extrabold text-[16px]">🏥 Floor board</div>
            <div className="text-[12px] text-slack-textSecondary">Live room status · ACKO Clinic</div>
          </div>
          <button className="text-slack-textSecondary text-2xl leading-none" onClick={close}>
            ×
          </button>
        </div>
        <div className="flex-1 overflow-y-auto slack-scroll p-4 space-y-4 bg-acko-warm/30">
          {groups.map((g) => (
            <div key={g.kind}>
              <div className="text-[11px] uppercase tracking-wider text-slack-textSecondary font-bold mb-1.5">
                {g.title}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {rooms
                  .filter((r) => r.kind === g.kind)
                  .map((r) => (
                    <RoomTile
                      key={r.id}
                      room={r}
                      onToggleBlock={() => {
                        if (r.status === "Blocked") setRoomStatus(r.id, "Ready");
                        else setRoomStatus(r.id, "Blocked");
                      }}
                    />
                  ))}
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-slack-border px-4 py-2 text-[11px] text-slack-textSecondary flex gap-3">
          <Legend color="bg-green-500" label="Ready" />
          <Legend color="bg-amber-500" label="Occupied" />
          <Legend color="bg-red-500" label="Blocked" />
        </div>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`inline-block w-2.5 h-2.5 rounded-full ${color}`} />
      <span>{label}</span>
    </span>
  );
}

function RoomTile({ room, onToggleBlock }: { room: Room; onToggleBlock: () => void }) {
  const color =
    room.status === "Ready"
      ? "border-green-400 bg-green-50"
      : room.status === "Occupied"
      ? "border-amber-400 bg-amber-50"
      : "border-red-400 bg-red-50";
  const dot =
    room.status === "Ready" ? "bg-green-500" : room.status === "Occupied" ? "bg-amber-500" : "bg-red-500";
  return (
    <div className={`border rounded-md p-2.5 ${color}`}>
      <div className="flex items-center gap-2">
        <span className={`w-2.5 h-2.5 rounded-full ${dot}`} />
        <div className="font-bold text-[13px]">{room.label}</div>
        <button
          title="Toggle blocked"
          onClick={onToggleBlock}
          className="ml-auto text-[10px] text-slack-textSecondary hover:text-slack-textPrimary"
        >
          {room.status === "Blocked" ? "Unblock" : "Block"}
        </button>
      </div>
      <div className="text-[11px] text-slack-textSecondary mt-1">
        {room.status}
        {room.occupantInitials && <> · {room.occupantInitials}</>}
      </div>
      {room.lastEvent && (
        <div className="text-[10px] mt-0.5 text-slack-textPrimary">
          {room.lastEvent === "ProcessStarted" ? "▶ Process Started" : "✓ Test Done"}
        </div>
      )}
    </div>
  );
}
