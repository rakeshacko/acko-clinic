import React, { useMemo, useState } from "react";
import { useStore } from "../store";

export function Sidebar() {
  const channels = useStore((s) => s.channels);
  const activeChannelId = useStore((s) => s.activeChannelId);
  const setActive = useStore((s) => s.setActiveChannel);
  const unreads = useStore((s) => s.unreadByChannel);
  const role = useStore((s) => s.currentRole);
  const currentUser = useStore((s) => s.currentUserHandle);

  // role-channel filter: only show role-* channels matching the active role,
  // and only show DMs that include the current user.
  const visible = useMemo(() => {
    return channels.filter((c) => {
      if (c.kind === "dm") {
        return c.members.includes(currentUser);
      }
      if (c.name.startsWith("role-")) {
        const map: Record<string, string> = { vm: "role-vm", fc: "role-fc", fm: "role-fm", doctor: "role-fm", nurse: "role-techs", tech: "role-techs" };
        return c.name === map[role];
      }
      return true;
    });
  }, [channels, role, currentUser]);

  const standing = visible.filter((c) => c.kind === "standing" && !c.starred);
  const starred = visible.filter((c) => c.kind === "standing" && c.starred);
  const visits = visible
    .filter((c) => c.kind === "visit")
    .sort((a, b) => b.name.localeCompare(a.name));
  const dms = visible.filter((c) => c.kind === "dm");

  return (
    <aside className="w-full md:w-[260px] bg-[#19171D] text-[#BCABBC] flex flex-col h-full min-h-0">
      <div className="px-4 py-3 border-b border-black/30 flex items-center justify-between safe-top">
        <div>
          <div className="text-white font-bold text-[15px]">ACKO Clinic Floor</div>
          <div className="text-[11px] text-white/50">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1.5 align-middle" />
            you · {role.toUpperCase()}
          </div>
        </div>
        <button
          className="w-9 h-9 md:w-8 md:h-8 rounded bg-white text-[#19171D] flex items-center justify-center text-base shadow-sm hover:bg-white/90"
          title="New message"
        >
          ✎
        </button>
      </div>

      <div className="overflow-y-auto slack-scroll text-[14px] flex-1 min-h-0">
        <Section title="Starred">
          {starred.map((c) => (
            <ChannelRow
              key={c.id}
              name={c.name}
              kind={c.kind}
              active={c.id === activeChannelId}
              unread={unreads[c.id] ?? 0}
              onClick={() => setActive(c.id)}
              archived={!!c.archived}
              locked={!!c.locked}
            />
          ))}
        </Section>

        <Section title="Channels">
          {standing.map((c) => (
            <ChannelRow
              key={c.id}
              name={c.name}
              kind={c.kind}
              active={c.id === activeChannelId}
              unread={unreads[c.id] ?? 0}
              onClick={() => setActive(c.id)}
              archived={!!c.archived}
              locked={!!c.locked}
            />
          ))}
        </Section>

        <Section title={`Visits · ${visits.length}`}>
          {visits.length === 0 ? (
            <div className="px-6 py-1.5 text-white/40 text-[12px] italic">no active visits</div>
          ) : (
            visits.map((c) => (
              <ChannelRow
                key={c.id}
                name={c.name}
                kind={c.kind}
                active={c.id === activeChannelId}
                unread={unreads[c.id] ?? 0}
                onClick={() => setActive(c.id)}
                archived={!!c.archived}
                locked={!!c.locked}
              />
            ))
          )}
        </Section>

        <Section title="Direct messages">
          {dms.map((c) => (
            <ChannelRow
              key={c.id}
              name={c.dmWith ?? c.name}
              kind={c.kind}
              active={c.id === activeChannelId}
              unread={unreads[c.id] ?? 0}
              onClick={() => setActive(c.id)}
            />
          ))}
        </Section>
      </div>
    </aside>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="py-1">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-3 py-1.5 text-[12px] font-bold text-white/55 hover:text-white flex items-center gap-1 select-none"
      >
        <span className={`inline-block transition-transform ${open ? "rotate-90" : ""}`}>▸</span>
        <span>{title}</span>
      </button>
      {open && <div className="pb-1">{children}</div>}
    </div>
  );
}

function ChannelRow({
  name,
  kind,
  active,
  unread,
  onClick,
  archived,
  locked,
}: {
  name: string;
  kind: "standing" | "visit" | "dm";
  active: boolean;
  unread: number;
  onClick: () => void;
  archived?: boolean;
  locked?: boolean;
}) {
  const prefix = kind === "dm" ? "" : kind === "visit" || archived ? "" : "#";
  const icon = kind === "dm" ? "● " : archived ? "🗄 " : locked ? "🔒 " : kind === "visit" ? "🗨 " : "# ";
  return (
    <button
      onClick={onClick}
      className={`w-full px-3 py-2 md:py-[5px] text-left flex items-center gap-1.5 ${
        active ? "bg-[#1164A3] text-white" : "text-white/80 hover:bg-white/5"
      } ${unread > 0 && !active ? "font-bold text-white" : ""} ${archived ? "italic text-white/45" : ""}`}
    >
      <span className="text-white/60 w-4 text-center text-[13px]">{icon}</span>
      <span className="truncate text-[14px]">
        {prefix}
        {name}
      </span>
      {unread > 0 && (
        <span className="ml-auto text-[11px] bg-[#E01E5A] text-white rounded-full px-1.5 leading-[16px] min-w-[16px] text-center">
          {unread}
        </span>
      )}
    </button>
  );
}
