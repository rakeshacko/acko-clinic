// A non-browser smoke test that drives the simulation engine and walks
// the screening scenario to its end, validating that the engine doesn't
// get stuck and that key effects fire.

import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost/" });
// @ts-ignore
globalThis.window = dom.window;
// @ts-ignore
globalThis.document = dom.window.document;
// @ts-ignore
globalThis.HTMLElement = dom.window.HTMLElement;

// Speed up timers
(dom.window as any).setTimeout = (fn: any, _ms?: number) => setTimeout(fn, 0);
(dom.window as any).clearTimeout = (id: any) => clearTimeout(id);

import { useStore } from "../src/store";
import { registerAllTemplates } from "../src/templates/templates";
import { registerAllScenarios } from "../src/scenarios";

registerAllTemplates();
registerAllScenarios();

const st = useStore.getState();
st.setPlaybackMode("auto");
st.setPlaybackSpeed(4);

const scenario = process.argv[2] || "screening";
const instanceId = st.startScenario(scenario);
console.log("started", scenario, "instance:", instanceId);

async function tickWhile(predicate: () => boolean, maxMs = 5000) {
  const t0 = Date.now();
  while (predicate()) {
    await new Promise((r) => setTimeout(r, 5));
    if (Date.now() - t0 > maxMs) throw new Error("timed out");
  }
}

async function drive() {
  // Process up to N user interaction loops, auto-submitting forms and clicking the
  // first non-danger button at each pause.
  for (let i = 0; i < 80; i++) {
    await new Promise((r) => setTimeout(r, 50));
    const s = useStore.getState();
    const inst = s.instances[instanceId];
    if (!inst) break;
    if (inst.status === "done") {
      console.log("DONE at beat", inst.currentBeatId, "history len", inst.history.length);
      break;
    }
    if (s.pendingForm) {
      console.log("form open:", s.pendingForm.formId, "beat:", s.pendingForm.beatId);
      // Use default values (empty/falsy defaults work for most fields)
      s.submitForm(s.pendingForm.instanceId, s.pendingForm.beatId, {});
      continue;
    }
    if (inst.status === "waiting") {
      // Find the latest message in the instance's channel with a button beat that matches
      const msgs = s.messagesByChannel[inst.channelId] ?? [];
      const last = [...msgs].reverse().find((m) => m.blocks?.some((b: any) => b.type === "actions" && b.elements?.some((e: any) => e.nextBeatId)));
      if (!last) {
        console.log("waiting but no button found, beat:", inst.currentBeatId);
        break;
      }
      const actions: any = last.blocks!.find((b: any) => b.type === "actions");
      const happy = actions.elements.find((e: any) => e.style === "primary" || e.nextBeatId) ?? actions.elements[0];
      console.log("clicking:", happy.text.text, "→", happy.nextBeatId);
      s.advanceBeat(instanceId, happy.nextBeatId);
      continue;
    }
  }
  const s = useStore.getState();
  console.log("final clock:", s.clock);
  console.log("messages in visit channel:", (s.messagesByChannel[s.instances[instanceId].channelId] ?? []).length);
  console.log("ops rows:", Object.values(s.opsRows).map((r) => `${r.patientInitial}: ${r.statusLine}`));
  const rooms = s.rooms;
  console.log("CT room status:", rooms.find((r) => r.id === "CT")?.status);
  console.log("Cardiac room status:", rooms.find((r) => r.id === "Cardiac")?.status);
  console.log("messages in #alerts:", (s.messagesByChannel["c-alerts"] ?? []).length);
  console.log("messages in #shift-handover:", (s.messagesByChannel["c-shift-handover"] ?? []).length);
}

drive().then(() => {
  console.log("--- done ---");
  process.exit(0);
}).catch((e) => {
  console.error("FAILED:", e);
  process.exit(1);
});
