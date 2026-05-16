import React from "react";
import { useStore } from "../store";
import { STAFF, getStaff } from "../seed";

export function ControlPanel() {
  const open = useStore((s) => s.controlPanelOpen);
  const toggle = useStore((s) => s.toggleControlPanel);
  const scenarios = useStore((s) => s.scenarios);
  const instances = useStore((s) => s.instances);
  const startScenario = useStore((s) => s.startScenario);
  const setActiveChannel = useStore((s) => s.setActiveChannel);
  const currentUserHandle = useStore((s) => s.currentUserHandle);
  const setCurrentUser = useStore((s) => s.setCurrentUser);
  const renderMode = useStore((s) => s.renderMode);
  const setRenderMode = useStore((s) => s.setRenderMode);
  const playback = useStore((s) => s.playbackMode);
  const setPlayback = useStore((s) => s.setPlaybackMode);
  const speed = useStore((s) => s.playbackSpeed);
  const setSpeed = useStore((s) => s.setPlaybackSpeed);
  const clock = useStore((s) => s.clock);
  const reset = useStore((s) => s.resetAll);
  const step = useStore((s) => s.step);
  const toggleFloorBoard = useStore((s) => s.toggleFloorBoard);

  if (!open) {
    return (
      <button
        onClick={toggle}
        className="hidden md:flex fixed bottom-4 right-4 z-20 bg-acko-sage text-white px-3 py-2 rounded-md shadow-lg text-[13px] font-bold hover:bg-acko-sageDark items-center gap-1"
      >
        🎬 Run a visit
      </button>
    );
  }

  const all = Object.values(scenarios);
  const core = all.filter((s) => s.type !== "branch");
  const branches = all.filter((s) => s.type === "branch");

  const runningInstances = Object.values(instances).filter((i) => i.status !== "done");
  const currentStaff = getStaff(currentUserHandle);

  const handleStart = (id: string) => {
    const inst = startScenario(id);
    const inst2 = useStore.getState().instances[inst];
    if (inst2) setActiveChannel(inst2.channelId);
  };

  const runTheDay = () => {
    const order = ["screening", "consulting", "single-test", "walkin-member"];
    setActiveChannel("c-ops-today");
    order.forEach((sid, i) => {
      setTimeout(() => {
        if (scenarios[sid]) startScenario(sid);
      }, i * 1500);
    });
  };

  return (
    <div className="fixed right-0 top-0 bottom-[56px] md:bottom-0 w-full md:w-[380px] bg-white md:border-l border-slack-border shadow-xl z-20 flex flex-col">
      <div className="px-4 py-3 border-b border-slack-border flex items-center justify-between bg-acko-sage text-white flex-shrink-0">
        <div>
          <div className="font-extrabold text-[14px]">🎬 Run a visit</div>
          <div className="text-[11px] opacity-90">Cockpit for the simulator. Not part of Slack.</div>
        </div>
        <button onClick={toggle} className="text-white/80 text-2xl leading-none w-8 h-8 flex items-center justify-center">×</button>
      </div>
      <div className="flex-1 overflow-y-auto slack-scroll p-4 space-y-4">
        <Section title="Clinic time now">
          <div className="text-[28px] font-extrabold font-mono leading-none">{clock}</div>
          <div className="text-[11px] text-slack-textSecondary mt-1">Moves with each beat.</div>
        </Section>

        <Section title="Acting as">
          <div className="border border-slack-border rounded-md overflow-hidden">
            <select
              value={currentUserHandle}
              onChange={(e) => setCurrentUser(e.target.value)}
              className="w-full px-3 py-2.5 text-[14px] bg-white focus:outline-none"
            >
              {STAFF.map((s) => (
                <option key={s.handle} value={s.handle}>
                  {s.name} · {s.roleLabel}
                </option>
              ))}
            </select>
          </div>
          {currentStaff && (
            <div className="mt-2 flex items-center gap-2 text-[12px]">
              <span
                className="inline-flex items-center justify-center w-7 h-7 rounded-full text-white text-[11px] font-bold"
                style={{ background: currentStaff.avatarColor }}
              >
                {currentStaff.name
                  .split(/\s+/)
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()}
              </span>
              <div>
                <div className="font-semibold text-slack-textPrimary leading-tight">{currentStaff.name}</div>
                <div className="text-slack-textSecondary leading-tight text-[11px]">@{currentStaff.handle}</div>
              </div>
            </div>
          )}
          <div className="text-[11px] text-slack-textSecondary mt-2">
            Buttons in the channel only show "Acted by you" when this person clicks. Switch as the handoff moves between staff.
          </div>
        </Section>

        <Section title="Start a visit">
          <button
            onClick={runTheDay}
            className="w-full mb-2 py-2.5 bg-acko-sage text-white rounded font-bold text-[13px] hover:bg-acko-sageDark"
          >
            ▶ Start a busy day (4 visits)
          </button>
          <div className="space-y-1.5">
            {core.map((s) => (
              <ScenarioRow key={s.id} s={s} onStart={handleStart} />
            ))}
          </div>
          <div className="text-[11px] uppercase tracking-wide text-slack-textSecondary font-bold mt-3 mb-1">
            Things going wrong
          </div>
          <div className="space-y-1.5">
            {branches.map((s) => (
              <ScenarioRow key={s.id} s={s} onStart={handleStart} />
            ))}
          </div>
        </Section>

        {runningInstances.length > 0 && (
          <Section title="In progress">
            <div className="space-y-1.5">
              {runningInstances.map((i) => {
                const scen = scenarios[i.scenarioId];
                const beat = scen?.beats.find((b) => b.id === i.currentBeatId);
                const beatLabel = beat?.label ?? i.currentBeatId;
                return (
                  <div key={i.id} className="text-[12px] border border-slack-border rounded p-2 flex items-center gap-2 bg-acko-warm/30">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{scen?.title ?? i.scenarioId}</div>
                      <div className="text-[11px] text-slack-textSecondary truncate">{beatLabel}</div>
                    </div>
                    <button
                      onClick={() => setActiveChannel(i.channelId)}
                      className="text-[11px] py-1 px-2 rounded border border-slack-border bg-white hover:bg-slack-divider/30"
                    >
                      Open
                    </button>
                  </div>
                );
              })}
            </div>
          </Section>
        )}

        <Section title="How fast">
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => setPlayback(playback === "auto" ? "step" : "auto")}
              className="text-[12px] py-1.5 px-2 rounded border border-slack-border bg-white hover:bg-slack-divider/30"
            >
              {playback === "auto" ? "⏸ Step manually" : "▶ Play automatically"}
            </button>
            {playback === "step" && runningInstances.length > 0 && (
              <button
                onClick={() => runningInstances.forEach((i) => step(i.id))}
                className="text-[12px] py-1.5 px-2 rounded bg-acko-sage text-white border border-acko-sageDark"
              >
                ⏭ Next step
              </button>
            )}
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {[0.5, 1, 2, 4].map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`text-[12px] py-1.5 rounded border ${
                  speed === s
                    ? "bg-acko-sage text-white border-acko-sageDark"
                    : "bg-white border-slack-border hover:bg-slack-divider/30"
                }`}
              >
                {s}×
              </button>
            ))}
          </div>
        </Section>

        <Section title="Card style">
          <div className="grid grid-cols-3 gap-1.5">
            {([
              { key: "native", label: "Slack-native" },
              { key: "image", label: "Image card" },
              { key: "side-by-side", label: "Compare" },
            ] as const).map((m) => (
              <button
                key={m.key}
                onClick={() => setRenderMode(m.key)}
                className={`text-[11px] py-1.5 rounded border ${
                  renderMode === m.key
                    ? "bg-acko-sage text-white border-acko-sageDark"
                    : "bg-white border-slack-border hover:bg-slack-divider/30"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          <div className="text-[11px] text-slack-textSecondary mt-2">
            "Compare" stacks both versions so you can see what the team would lose by picking one.
          </div>
        </Section>

        <Section title="Other views">
          <button
            onClick={toggleFloorBoard}
            className="w-full text-[13px] py-2 rounded border border-slack-border bg-white hover:bg-slack-divider/30"
          >
            🏥 Show the floor board
          </button>
        </Section>

        <Section title="Start over">
          <button
            onClick={() => {
              if (window.confirm("Clear all channels and start fresh?")) reset();
            }}
            className="w-full text-[13px] py-2 rounded border border-[#E01E5A] text-[#E01E5A] hover:bg-[#E01E5A]/10"
          >
            ↺ Clear everything
          </button>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-slack-textSecondary font-bold mb-1.5">{title}</div>
      {children}
    </div>
  );
}

function ScenarioRow({ s, onStart }: { s: any; onStart: (id: string) => void }) {
  return (
    <div className="text-[13px] border border-slack-border rounded px-2.5 py-2 flex items-center gap-2 hover:bg-slack-divider/15">
      <div className="flex-1 min-w-0">
        <div className="font-semibold truncate">{s.title}</div>
        {s.subtitle && <div className="text-[11px] text-slack-textSecondary truncate">{s.subtitle}</div>}
      </div>
      <button
        onClick={() => onStart(s.id)}
        className="text-[12px] py-1 px-2.5 rounded bg-acko-sage hover:bg-acko-sageDark text-white"
      >
        ▶ Start
      </button>
    </div>
  );
}
