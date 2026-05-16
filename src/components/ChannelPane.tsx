import React, { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "../store";
import { MessageView } from "./MessageView";
import { OpsTodayPane } from "./OpsTodayPane";
import type { ActionElement, Message } from "../types";

export function ChannelPane() {
  const activeId = useStore((s) => s.activeChannelId);
  const channels = useStore((s) => s.channels);
  const channel = channels.find((c) => c.id === activeId);

  // ops-today gets a custom dashboard pane
  if (channel?.id === "c-ops-today") {
    return <OpsTodayPane />;
  }

  return <RegularChannelPane />;
}

function RegularChannelPane() {
  const activeId = useStore((s) => s.activeChannelId);
  const channels = useStore((s) => s.channels);
  const channel = channels.find((c) => c.id === activeId);
  const messages = useStore((s) => s.messagesByChannel[activeId] ?? []);
  const currentUser = useStore((s) => s.currentUserHandle);
  const advanceBeat = useStore((s) => s.advanceBeat);
  const instances = useStore((s) => s.instances);
  const role = useStore((s) => s.currentRole);
  const toggleRightPanel = useStore((s) => s.toggleRightPanel);
  const rightPanelOpen = useStore((s) => s.rightPanelOpen);

  // Visible messages (filter ephemerals for non-recipients)
  const visible = useMemo(
    () => messages.filter((m) => !m.visibleOnlyTo || m.visibleOnlyTo === currentUser),
    [messages, currentUser]
  );

  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [visible.length, activeId]);

  if (!channel) {
    return (
      <div className="flex-1 flex items-center justify-center text-slack-textSecondary">
        Select a channel.
      </div>
    );
  }

  // Handler when a button inside a message gets clicked.
  const handleAction = (msg: Message, btn: ActionElement, _optionValue?: string) => {
    const nextBeatId = (btn as any).nextBeatId;
    if (!nextBeatId) return; // decorative button
    // Prefer the instance whose currentBeatId matches this message's beat, then fall back to any instance owning this channel.
    const instance =
      Object.values(instances).find((i) => i.channelId === msg.channelId && msg.beatId === i.currentBeatId) ??
      Object.values(instances).find((i) => i.channelId === msg.channelId);
    if (instance) {
      advanceBeat(instance.id, nextBeatId);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white min-w-0">
      <ChannelHeader name={channel.name} kind={channel.kind} topic={channel.topic} members={channel.members.length} locked={!!channel.locked} archived={!!channel.archived} onTogglePanel={toggleRightPanel} dmWith={channel.dmWith} />
      <div ref={listRef} className="flex-1 overflow-y-auto slack-scroll bg-white">
        <ChannelIntro name={channel.name} kind={channel.kind} topic={channel.topic} />
        {visible.length === 0 && <div className="px-6 py-10 text-slack-textSecondary text-sm italic">No messages yet in this channel.</div>}
        <GroupedMessages messages={visible} onAction={handleAction} />
        <div className="h-4" />
      </div>
      <Composer channelId={activeId} channelLabel={channel.kind === "dm" ? channel.dmWith ?? channel.name : `#${channel.name}`} role={role} />
    </div>
  );
}

function ChannelIntro({ name, kind, topic }: { name: string; kind: string; topic?: string }) {
  return (
    <div className="px-6 pt-6 pb-3">
      <div className="text-2xl font-extrabold text-slack-textPrimary mb-1">
        👋 Welcome to <span className="text-slack-link">{kind === "dm" ? name : `#${name}`}</span>
      </div>
      <div className="text-[14px] text-slack-textSecondary">{topic ?? "This is the start of the channel."}</div>
    </div>
  );
}

function ChannelHeader({ name, kind, topic, members, locked, archived, onTogglePanel, dmWith }: { name: string; kind: string; topic?: string; members: number; locked: boolean; archived: boolean; onTogglePanel: () => void; dmWith?: string }) {
  const displayName = kind === "dm" ? dmWith ?? name : `${archived ? "🗄 " : locked ? "🔒 " : kind === "visit" ? "" : "# "}${name}`;
  return (
    <div className="h-[60px] border-b border-slack-border bg-white flex items-center px-5 gap-3 flex-shrink-0">
      <div className="flex flex-col flex-1 min-w-0">
        <div className="font-extrabold text-[18px] text-slack-textPrimary flex items-center gap-2 truncate">
          <span>{displayName}</span>
          {locked && <span className="text-xs bg-slack-divider text-slack-textSecondary px-2 py-0.5 rounded">Locked</span>}
          {archived && <span className="text-xs bg-slack-divider text-slack-textSecondary px-2 py-0.5 rounded">Archived</span>}
        </div>
        {topic && <div className="text-[12px] text-slack-textSecondary truncate">{topic}</div>}
      </div>
      <button className="flex items-center gap-1 text-[12px] px-2 py-1 hover:bg-slack-divider/60 rounded text-slack-textSecondary" onClick={onTogglePanel}>
        <span>👥</span>
        <span>{members}</span>
      </button>
    </div>
  );
}

function GroupedMessages({ messages, onAction }: { messages: Message[]; onAction: (m: Message, b: ActionElement, optionValue?: string) => void }) {
  // Group consecutive messages by same author within 2 minutes to mimic Slack's compact rendering.
  return (
    <div className="pb-4">
      {messages.map((m, i) => {
        const prev = messages[i - 1];
        const sameAuthor = prev && prev.author === m.author && timeDiff(prev.ts, m.ts) <= 2 && !m.visibleOnlyTo && !prev.visibleOnlyTo;
        return (
          <React.Fragment key={m.id}>
            {!prev || prev.ts.slice(0, 2) !== m.ts.slice(0, 2) ? (
              <DateSeparator label={`${m.ts.slice(0, 2)}:00 hour`} />
            ) : null}
            <MessageView message={m} showAuthor={!sameAuthor} onAction={onAction} />
          </React.Fragment>
        );
      })}
    </div>
  );
}

function timeDiff(a: string, b: string): number {
  const [ah, am] = a.split(":").map(Number);
  const [bh, bm] = b.split(":").map(Number);
  return Math.abs(bh * 60 + bm - (ah * 60 + am));
}

function DateSeparator({ label }: { label: string }) {
  return (
    <div className="flex items-center my-2 px-5">
      <div className="flex-1 border-t border-slack-divider" />
      <div className="px-3 text-[11px] text-slack-textSecondary font-bold uppercase tracking-wider">{label}</div>
      <div className="flex-1 border-t border-slack-divider" />
    </div>
  );
}

function Composer({ channelId, channelLabel, role }: { channelId: string; channelLabel: string; role: string }) {
  const [text, setText] = useState("");
  const postMessage = useStore((s) => s.postMessage);
  const clock = useStore((s) => s.clock);
  const currentUser = useStore((s) => s.currentUserHandle);
  const channels = useStore((s) => s.channels);
  const channel = channels.find((c) => c.id === channelId);
  const locked = !!channel?.locked;
  const handleSlash = useSlashCommands();

  const send = () => {
    if (!text.trim()) return;
    if (text.startsWith("/")) {
      if (handleSlash(text.trim(), channelId)) {
        setText("");
        return;
      }
    }
    postMessage(channelId, {
      author: currentUser,
      isBot: false,
      ts: clock,
      source: channel?.kind === "dm" ? "dm" : "channel",
      text,
    });
    setText("");
  };

  return (
    <div className="px-4 pb-3 pt-1 bg-white flex-shrink-0">
      <div className={`border ${locked ? "border-slack-divider bg-slack-divider/20 text-slack-textSecondary italic" : "border-slack-border"} rounded-md`}>
        <div className="flex items-center px-2 py-1 border-b border-slack-divider gap-1.5 text-slack-textSecondary text-[13px]">
          <button className="hover:bg-slack-divider/40 rounded px-1.5 py-0.5">B</button>
          <button className="hover:bg-slack-divider/40 rounded px-1.5 py-0.5 italic">I</button>
          <button className="hover:bg-slack-divider/40 rounded px-1.5 py-0.5">S</button>
          <span className="text-slack-divider">|</span>
          <button className="hover:bg-slack-divider/40 rounded px-1.5 py-0.5">≡</button>
          <button className="hover:bg-slack-divider/40 rounded px-1.5 py-0.5">¶</button>
          <span className="text-slack-divider">|</span>
          <button className="hover:bg-slack-divider/40 rounded px-1.5 py-0.5">@</button>
          <button className="hover:bg-slack-divider/40 rounded px-1.5 py-0.5">🙂</button>
          <button className="hover:bg-slack-divider/40 rounded px-1.5 py-0.5">📎</button>
        </div>
        <textarea
          rows={2}
          disabled={locked}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder={locked ? `${channelLabel} is locked` : `Message ${channelLabel}`}
          className="w-full resize-none px-3 py-2 text-[14px] focus:outline-none disabled:bg-transparent"
        />
        <div className="px-2 py-1 flex items-center justify-between border-t border-slack-divider text-[12px] text-slack-textSecondary">
          <div className="flex gap-1">
            <button className="hover:bg-slack-divider/40 rounded px-1.5 py-0.5">＋</button>
            <button className="hover:bg-slack-divider/40 rounded px-1.5 py-0.5">⚡</button>
            <button className="hover:bg-slack-divider/40 rounded px-1.5 py-0.5">@</button>
          </div>
          <button
            disabled={locked || !text.trim()}
            onClick={send}
            className={`px-3 py-1 rounded text-white text-[12px] font-bold ${
              text.trim() && !locked ? "bg-acko-sage hover:bg-acko-sageDark" : "bg-slack-divider text-slack-textSecondary"
            }`}
          >
            Send
          </button>
        </div>
      </div>
      <div className="text-[11px] text-slack-textSecondary mt-1 px-1">
        Tip: type <code className="font-mono bg-slack-divider/30 px-1 rounded">/walkin</code>, <code className="font-mono bg-slack-divider/30 px-1 rounded">/queue</code>, or <code className="font-mono bg-slack-divider/30 px-1 rounded">/escalate</code>.
      </div>
    </div>
  );
}

function useSlashCommands() {
  // For now we route slash commands to scenarios. /walkin opens the walk-in modal handled in App.
  return (cmd: string, channelId: string) => {
    const [name] = cmd.split(/\s+/);
    if (name === "/walkin") {
      window.dispatchEvent(new CustomEvent("acko:open-walkin", { detail: { channelId } }));
      return true;
    }
    if (name === "/queue") {
      window.dispatchEvent(new CustomEvent("acko:open-queue"));
      return true;
    }
    if (name === "/escalate") {
      window.dispatchEvent(new CustomEvent("acko:open-escalate", { detail: { channelId } }));
      return true;
    }
    return false;
  };
}
