import React from "react";
import { useStore } from "../store";

export function ControlPanel() {
  const open = useStore((s) => s.controlPanelOpen);
  const toggle = useStore((s) => s.toggleControlPanel);
  const scenarios = useStore((s) => s.scenarios);
  const instances = useStore((s) => s.instances);
  const startScenario = useStore((s) => s.startScenario);
  const setActiveChannel = useStore((s) => s.setActiveChannel);
  const role = useStore((s) => s.currentRole);
  const setRole = useStore((s) => s.setCurrentRole);
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
        className="fixed bottom-4 right-4 z-20 bg-acko-sage text-white px-3 py-2 rounded-md shadow-lg text-[13px] font-bold hover:bg-acko-sageDark"
      >
        🎬 Control panel
      </button>
    );
  }

  const all = Object.values(scenarios);
  const core = all.filter((s) => s.type !== "branch");
  const branches = all.filter((s) => s.type === "branch");

  const runningInstances = Object.values(instances).filter((i) => i.status !== "done");

  const handleStart = (id: string) => {
    const inst = startScenario(id);
    const inst2 = useStore.getState().instances[inst];
    if (inst2) setActiveChannel(inst2.channelId);
  };

  const runTheDay = () => {
    // launch 4 staggered scenarios
    const order = ["screening", "consulting", "single-test", "walkin-member"];
    order.forEach((sid, i) => {
      setTimeout(() => {
        if (scenarios[sid]) handleStart(sid);
      }, i * 1200);
    });
    setActiveChannel("c-ops-today");
  };

  return (
    <div className="fixed right-0 top-0 bottom-0 w-[380px] bg-white border-l border-slack-border shadow-xl z-20 flex flex-col">
      <div className="px-4 py-3 border-b border-slack-border flex items-center justify-between bg-acko-sage text-white flex-shrink-0">
        <div>
          <div className="font-extrabold text-[14px]">🎬 Simulation cockpit</div>
          <div className="text-[11px] opacity-90">Not part of the Slack chrome.</div>
        </div>
        <button onClick={toggle} className="text-white/80 text-2xl leading-none">×</button>
      </div>
      <div className="flex-1 overflow-y-auto slack-scroll p-4 space-y-4">
        <Section title="Clock">
          <div className="text-[28px] font-extrabold font-mono">{clock}</div>
          <div className="text-[11px] text-slack-textSecondary">In-fiction clinic time. Advances with each beat.</div>
        </Section>

        <Section title="Role">
          <div className="grid grid-cols-3 gap-1.5">
            {(["vm", "fc", "fm", "doctor", "nurse", "tech"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`text-[12px] py-1.5 rounded border ${
                  role === r
                    ? "bg-acko-sage text-white border-acko-sageDark"
                    : "bg-white border-slack-border hover:bg-slack-divider/30"
                }`}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="text-[11px] text-slack-textSecondary mt-2">Role changes which ephemerals/DMs you can see.</div>
        </Section>

        <Section title="Card rendering">
          <div className="grid grid-cols-3 gap-1.5">
            {(["native", "image", "side-by-side"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setRenderMode(m)}
                className={`text-[12px] py-1.5 rounded border ${
                  renderMode === m
                    ? "bg-acko-sage text-white border-acko-sageDark"
                    : "bg-white border-slack-border hover:bg-slack-divider/30"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
          <div className="text-[11px] text-slack-textSecondary mt-2">
            Side-by-side renders both versions of every template message.
          </div>
        </Section>

        <Section title="Playback">
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => setPlayback(playback === "auto" ? "step" : "auto")}
              className="text-[12px] py-1.5 px-2 rounded border border-slack-border bg-white hover:bg-slack-divider/30"
            >
              {playback === "auto" ? "⏸ Switch to Step" : "▶ Switch to Autoplay"}
            </button>
            {playback === "step" && runningInstances.length > 0 && (
              <button
                onClick={() => runningInstances.forEach((i) => step(i.id))}
                className="text-[12px] py-1.5 px-2 rounded bg-acko-sage text-white border border-acko-sageDark"
              >
                ⏭ Step
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

        <Section title="Scenarios">
          <button
            onClick={runTheDay}
            className="w-full mb-2 py-2 bg-acko-sage text-white rounded font-bold text-[13px] hover:bg-acko-sageDark"
          >
            🎬 Run the day (launch 4)
          </button>
          <div className="space-y-1.5">
            {core.map((s) => (
              <ScenarioRow key={s.id} s={s} onStart={handleStart} />
            ))}
          </div>
          <div className="text-[11px] uppercase tracking-wide text-slack-textSecondary font-bold mt-3 mb-1">
            Branches
          </div>
          <div className="space-y-1.5">
            {branches.map((s) => (
              <ScenarioRow key={s.id} s={s} onStart={handleStart} />
            ))}
          </div>
        </Section>

        {runningInstances.length > 0 && (
          <Section title="Running">
            <div className="space-y-1.5">
              {runningInstances.map((i) => {
                const scen = scenarios[i.scenarioId];
                return (
                  <div key={i.id} className="text-[12px] border border-slack-border rounded p-2 flex items-center gap-2 bg-acko-warm/30">
                    <div className="flex-1">
                      <div className="font-semibold">{scen?.title ?? i.scenarioId}</div>
                      <div className="text-[11px] text-slack-textSecondary">beat: {i.currentBeatId} · {i.history.length} fired</div>
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

        <Section title="Views">
          <button
            onClick={toggleFloorBoard}
            className="w-full text-[13px] py-2 rounded border border-slack-border bg-white hover:bg-slack-divider/30"
          >
            🏥 Open floor board
          </button>
        </Section>

        <Section title="Reset">
          <button
            onClick={() => {
              if (window.confirm("Reset all channels and state?")) reset();
            }}
            className="w-full text-[13px] py-2 rounded border border-[#E01E5A] text-[#E01E5A] hover:bg-[#E01E5A]/10"
          >
            ↺ Reset everything
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
        <div className="text-[11px] text-slack-textSecondary">{s.id}</div>
      </div>
      <button
        onClick={() => onStart(s.id)}
        className="text-[12px] py-1 px-2 rounded bg-acko-sage hover:bg-acko-sageDark text-white"
      >
        ▶ Run
      </button>
    </div>
  );
}
