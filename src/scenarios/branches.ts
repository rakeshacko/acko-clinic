import type { Scenario, Visit } from "../types";
import { autoBeat, botMsg, buttonBeat, formBeat } from "./helpers";

// Re-used patient skeleton for branch scenarios.
function fakeVisit(id: string, name: [string, string], type: Visit["type"], extras: Partial<Visit> = {}): Omit<Visit, "channelId" | "status"> {
  return {
    id,
    type,
    patient: {
      firstName: name[0],
      lastName: name[1],
      age: 39,
      gender: "F",
      member: true,
      memberSince: 2024,
      language: "English",
    },
    package: type === "screening" ? "Core screening" : undefined,
    concern: type === "consulting" ? "GP review" : undefined,
    assignedVm: type === "screening" ? "kavya.rao" : undefined,
    assignedDoctor: type === "consulting" ? "dr.meera" : undefined,
    opsAnchor: "rohit.iyer",
    startedAt: "10:00",
    ...extras,
  };
}

// B1 — Late patient, within tolerance
export const branchB1: Scenario = {
  id: "b1-late-within",
  title: "B1 · Late within tolerance",
  type: "branch",
  seed: {
    visit: fakeVisit("B1V1", ["Neha", "Bhatt"], "screening"),
    channelName: "v-20260518-B1V001-S",
    initialMembers: ["kavya.rao", "rohit.iyer", "anjali.pillai"],
  },
  beats: [
    autoBeat({
      id: "delay",
      label: "Patient taps Running late",
      delayMs: 600,
      next: "decision",
      emit: [
        botMsg({
          author: "AppRelay",
          ts: "08:50",
          text: "⚠ N. Bhatt tapped 'Running late' · ETA delay ≈ 18 min (within tolerance for screening).",
        }),
      ],
      sideEffects: [{ type: "setOpsTodayStatus", statusLine: "Late · within tolerance (≈18m)", currentStep: "Late" }],
    }),
    buttonBeat({
      id: "decision",
      label: "Adjust slot or reschedule",
      buttons: [
        { label: "Wait & adjust slot", style: "primary", nextBeatId: "wait" },
        { label: "Reschedule anyway", style: "danger", nextBeatId: "reschedule" },
      ],
    }),
    autoBeat({
      id: "wait",
      label: "Slot adjusted",
      emit: [
        botMsg({ author: "VisitBot", ts: "08:52", text: "✅ Slot adjusted to 09:18 · AppRelay pushed updated start time to N. Bhatt's app." }),
      ],
      sideEffects: [{ type: "setOpsTodayStatus", statusLine: "Slot moved to 09:18", currentStep: "Wait" }],
    }),
    autoBeat({
      id: "reschedule",
      label: "Patient opted to reschedule",
      emit: [
        botMsg({ author: "AppRelay", ts: "08:53", text: "🔁 N. Bhatt opted to reschedule · slot picker opened in patient app." }),
      ],
      sideEffects: [
        { type: "lockChannel" },
        { type: "setOpsTodayStatus", statusLine: "Rescheduled — closing channel", currentStep: "Closed" },
      ],
    }),
  ],
};

// B2 — Late beyond tolerance
export const branchB2: Scenario = {
  id: "b2-late-beyond",
  title: "B2 · Late beyond tolerance",
  type: "branch",
  seed: { visit: fakeVisit("B2V1", ["Mihir", "Shenoy"], "consulting"), channelName: "v-20260518-B2V001-C", initialMembers: ["rohit.iyer", "dr.meera"] },
  beats: [
    autoBeat({
      id: "delay",
      label: "Patient running very late",
      delayMs: 500,
      next: "decision",
      emit: [
        botMsg({
          author: "AppRelay",
          ts: "10:08",
          source: "alert",
          text: "🚨 M. Shenoy delay 32 min — beyond consulting tolerance (10 min cap).",
        }),
      ],
      sideEffects: [{ type: "setOpsTodayStatus", statusLine: "Late · beyond tolerance", currentStep: "Late+" }],
    }),
    buttonBeat({
      id: "decision",
      label: "Force wait or reschedule",
      buttons: [
        { label: "Force-wait (delays downstream)", nextBeatId: "force-wait" },
        { label: "Reschedule", style: "danger", nextBeatId: "reschedule" },
      ],
    }),
    autoBeat({
      id: "force-wait",
      label: "Force-wait acknowledged",
      emit: [botMsg({ author: "VisitBot", ts: "10:09", text: "⚠ Force-wait selected · 2 downstream visits warned · @rohit.iyer to monitor." })],
      sideEffects: [{ type: "setOpsTodayStatus", statusLine: "Forced wait · downstream delayed", currentStep: "Forced wait" }],
    }),
    autoBeat({
      id: "reschedule",
      label: "Reschedule picker",
      next: "reschedule-confirmed",
      delayMs: 700,
      emit: [
        botMsg({
          author: "VisitBot",
          ts: "10:10",
          text: "📅 Next 48h slots offered:",
          blocks: [
            { type: "actions", elements: [
              { type: "button", text: { type: "plain_text", text: "Today 14:00" }, style: "primary", action_id: "s1" },
              { type: "button", text: { type: "plain_text", text: "Tomorrow 09:00" }, action_id: "s2" },
              { type: "button", text: { type: "plain_text", text: "Tomorrow 11:30" }, action_id: "s3" },
            ] },
          ],
        }),
      ],
    }),
    autoBeat({
      id: "reschedule-confirmed",
      label: "Rescheduled",
      emit: [botMsg({ author: "VisitBot", ts: "10:11", text: "✅ Rescheduled · old channel locking, new dated channel will be created." })],
      sideEffects: [
        { type: "lockChannel" },
        { type: "setOpsTodayStatus", statusLine: "Rescheduled", currentStep: "Rescheduled" },
      ],
    }),
  ],
};

// B3 — Doctor unavailable
export const branchB3: Scenario = {
  id: "b3-doctor-unavailable",
  title: "B3 · Doctor unavailable",
  type: "branch",
  seed: { visit: fakeVisit("B3V1", ["Tara", "Devi"], "consulting", { assignedDoctor: "dr.anand" }), channelName: "v-20260518-B3V001-C", initialMembers: ["rohit.iyer", "anjali.pillai", "dr.anand"] },
  beats: [
    autoBeat({
      id: "noshow",
      label: "Doctor no-show",
      delayMs: 500,
      next: "decision",
      emit: [
        botMsg({ author: "AppRelay", ts: "10:05", source: "alert", text: "🚨 @dr.anand no-show 5 min past start. Patient T. Devi waiting." }),
      ],
      sideEffects: [{ type: "setOpsTodayStatus", statusLine: "Doctor no-show", currentStep: "Doctor unavailable" }],
    }),
    buttonBeat({
      id: "decision",
      label: "Pick another doctor or reschedule",
      buttons: [
        { label: "Pick another doctor", style: "primary", nextBeatId: "pick-doctor" },
        { label: "Reschedule patient", style: "danger", nextBeatId: "reschedule" },
      ],
    }),
    autoBeat({
      id: "pick-doctor",
      label: "Doctor swap",
      next: "doctor-swapped",
      delayMs: 600,
      emit: [
        botMsg({
          author: "VisitBot",
          ts: "10:06",
          text: "Available GPs right now:",
          blocks: [
            { type: "actions", elements: [
              { type: "button", text: { type: "plain_text", text: "Dr. Meera · next 10:15" }, style: "primary", action_id: "d1", nextBeatId: "doctor-swapped" },
              { type: "button", text: { type: "plain_text", text: "Dr. Priya · next 10:30" }, action_id: "d2", nextBeatId: "doctor-swapped" },
            ] },
          ],
        }),
      ],
    }),
    autoBeat({
      id: "doctor-swapped",
      label: "Doctor swapped",
      emit: [
        botMsg({ author: "VisitBot", ts: "10:07", text: "✅ Swapped to @dr.meera · 10:15 · patient app updated." }),
      ],
      sideEffects: [
        { type: "removeChannelMember", handle: "dr.anand" },
        { type: "addChannelMember", handle: "dr.meera" },
        { type: "setOpsTodayStatus", statusLine: "Doctor swapped → Dr. Meera 10:15", currentStep: "Swap" },
      ],
    }),
    autoBeat({
      id: "reschedule",
      label: "Reschedule",
      emit: [botMsg({ author: "VisitBot", ts: "10:07", text: "📅 Patient rescheduled · old slot released." })],
      sideEffects: [{ type: "setOpsTodayStatus", statusLine: "Rescheduled", currentStep: "Rescheduled" }],
    }),
  ],
};

// B4–B6 — Blood draw failures (in cardiac context)
export const branchB4: Scenario = {
  id: "b4-blood-1",
  title: "B4 · Blood draw 1st attempt fails",
  type: "branch",
  seed: { visit: fakeVisit("B4V1", ["Anu", "Lal"], "screening"), channelName: "v-20260518-B4V001-S", initialMembers: ["kavya.rao", "sneha.reddy", "rohit.iyer"] },
  beats: [
    autoBeat({
      id: "intro",
      label: "Cardiac in progress",
      delayMs: 600,
      next: "fail",
      emit: [botMsg({ author: "PodBot", ts: "09:22", text: "🩺 Cardiac in progress · A. Lal · @sneha.reddy attempting blood draw." })],
    }),
    autoBeat({
      id: "fail",
      label: "Vein not found (1st)",
      delayMs: 700,
      next: "decision",
      emit: [
        botMsg({
          author: "PodBot",
          ts: "09:24",
          source: "alert",
          text: "⚠ Vein not found (attempt 1) · @kavya.rao please read script:",
          blocks: [
            {
              type: "alert",
              alert: { level: "warning", text: { type: "mrkdwn", text: "*Script:* 'A. Lal, sometimes the first try doesn't catch — we'll take a short break and try the other arm. Totally normal, won't add time.'" } },
            },
          ],
        }),
      ],
    }),
    buttonBeat({
      id: "decision",
      label: "Retry or defer",
      buttons: [
        { label: "Retry now", style: "primary", nextBeatId: "retry-ok" },
        { label: "Defer to later", nextBeatId: "deferred" },
      ],
    }),
    autoBeat({
      id: "retry-ok",
      label: "Retry succeeded",
      emit: [botMsg({ author: "PodBot", ts: "09:27", text: "✅ Retry successful · samples to lab." })],
    }),
    autoBeat({
      id: "deferred",
      label: "Deferred to after pod 5",
      emit: [botMsg({ author: "PodBot", ts: "09:25", text: "📌 Blood draw deferred · @sneha.reddy paged again after Functional pod." })],
    }),
  ],
};

export const branchB5: Scenario = {
  id: "b5-blood-2",
  title: "B5 · Blood draw 2nd attempt fails",
  type: "branch",
  seed: { visit: fakeVisit("B5V1", ["Riya", "Mishra"], "screening"), channelName: "v-20260518-B5V001-S", initialMembers: ["kavya.rao", "sneha.reddy", "rohit.iyer"] },
  beats: [
    autoBeat({
      id: "fail",
      label: "Vein not found (2nd)",
      delayMs: 600,
      next: "defer",
      emit: [
        botMsg({
          author: "PodBot",
          ts: "09:28",
          source: "alert",
          text: "⚠ Vein not found (attempt 2) · defer to retry after pod 5. VM script DM-ed to @kavya.rao.",
        }),
        botMsg({
          author: "PodBot",
          ts: "09:28",
          visibleOnlyTo: "kavya.rao",
          source: "dm",
          channelId: "dm-VisitBot-kavya.rao",
          text: "💬 Read to R. Mishra: 'Veins can be shy on a cool morning. We're going to do the other pods first, warm up a bit, and try once more after pod 5. No need to worry — this is common.'",
        }),
      ],
    }),
    autoBeat({
      id: "defer",
      label: "Defer + auto-page later",
      emit: [botMsg({ author: "PodBot", ts: "09:29", text: "📌 Cardiac blood deferred · auto-page @sneha.reddy after Functional pod (≈10:38)." })],
    }),
  ],
};

export const branchB6: Scenario = {
  id: "b6-blood-3",
  title: "B6 · Blood draw 3rd attempt fails — escalation",
  type: "branch",
  seed: { visit: fakeVisit("B6V1", ["Kalpana", "Joshi"], "screening"), channelName: "v-20260518-B6V001-S", initialMembers: ["kavya.rao", "sneha.reddy", "rohit.iyer"] },
  beats: [
    autoBeat({
      id: "fail",
      label: "3rd attempt fails",
      delayMs: 500,
      next: "escalate",
      emit: [
        botMsg({
          author: "PodBot",
          ts: "10:42",
          source: "alert",
          text: "🚨 Blood draw failed 3 times · escalating · adding @dr.anand to channel.",
        }),
      ],
      sideEffects: [{ type: "addChannelMember", handle: "dr.anand" }],
    }),
    buttonBeat({
      id: "escalate",
      label: "Doctor decides alternative",
      buttons: [
        { label: "Alternative collection site", style: "primary", nextBeatId: "alt-site" },
        { label: "Defer to scheduled lab visit", nextBeatId: "lab-visit" },
        { label: "Skip (non-critical)", style: "danger", nextBeatId: "skip" },
      ],
    }),
    autoBeat({ id: "alt-site", label: "Alternative site chosen", emit: [botMsg({ author: "PodBot", ts: "10:44", text: "✅ Doctor chose ankle vein draw · pediatric butterfly · sample obtained." })] }),
    autoBeat({ id: "lab-visit", label: "Lab visit booked", emit: [botMsg({ author: "PodBot", ts: "10:44", text: "📅 Sample deferred to scheduled lab visit · tomorrow 09:00." })] }),
    autoBeat({ id: "skip", label: "Skipped", emit: [botMsg({ author: "PodBot", ts: "10:44", text: "↪ Blood draw skipped (non-critical for this screening); doctor signed off." })] }),
  ],
};

// B7 — Machine failure
export const branchB7: Scenario = {
  id: "b7-machine-failure",
  title: "B7 · Machine failure (CT)",
  type: "branch",
  seed: { visit: fakeVisit("B7V1", ["Sai", "Reddy"], "screening"), channelName: "v-20260518-B7V001-S", initialMembers: ["kavya.rao", "ananya.sen", "rohit.iyer"] },
  beats: [
    autoBeat({
      id: "down",
      label: "Tech flags machine down",
      delayMs: 600,
      next: "cross",
      emit: [
        botMsg({
          author: "PodBot",
          ts: "09:38",
          source: "alert",
          text: "🚨 CT machine reports calibration error — pod set to *Blocked*.",
          blocks: [
            {
              type: "template_native",
              templateId: "escalation",
              data: {
                level: "error",
                title: "CT machine down · calibration error",
                detail: "Estimated 25 min to recover. All CT-bound visits paused.",
                context: "@ananya.sen · CT pod · 09:38",
              },
            },
          ],
        }),
      ],
      sideEffects: [{ type: "setRoomStatus", room: "CT", status: "Blocked" }],
    }),
    autoBeat({
      id: "cross",
      label: "Cross-post to #alerts and #shift-handover",
      delayMs: 300,
      next: "vm-script",
      emit: [],
      sideEffects: [
        {
          type: "crossPost",
          channelId: "c-alerts",
          message: { author: "PodBot", isBot: true, ts: "09:38", source: "alert", text: "🚨 CT pod blocked · calibration error · ETA recovery 25m." },
        },
        {
          type: "crossPost",
          channelId: "c-shift-handover",
          message: { author: "PodBot", isBot: true, ts: "09:38", source: "alert", text: "🚨 CT pod down · update equipment status for handover." },
        },
        { type: "setOpsTodayStatus", statusLine: "CT BLOCKED · pausing", currentStep: "CT down" },
      ],
    }),
    autoBeat({
      id: "vm-script",
      label: "VM holding script",
      delayMs: 600,
      next: "decision",
      emit: [
        botMsg({
          author: "VisitBot",
          ts: "09:39",
          source: "dm",
          channelId: "dm-VisitBot-kavya.rao",
          visibleOnlyTo: "kavya.rao",
          text: "💬 Holding script for S. Reddy: 'The CT machine needs a quick recalibration — about 20 minutes. While we wait, let's do the Sensory pod which is right next door.'",
        }),
      ],
    }),
    buttonBeat({
      id: "decision",
      label: "Ops anchor decides",
      buttons: [
        { label: "Machine back online", style: "primary", nextBeatId: "back-online" },
        { label: "Reschedule this test", nextBeatId: "reschedule" },
        { label: "Skip and refund portion", style: "danger", nextBeatId: "refund" },
      ],
    }),
    autoBeat({
      id: "back-online",
      label: "Recovered",
      emit: [botMsg({ author: "PodBot", ts: "10:02", text: "✅ CT pod back online · queue resuming." })],
      sideEffects: [
        { type: "setRoomStatus", room: "CT", status: "Ready" },
        { type: "setOpsTodayStatus", statusLine: "CT recovered · resuming", currentStep: "Recovered" },
      ],
    }),
    autoBeat({
      id: "reschedule",
      label: "Test rescheduled",
      emit: [botMsg({ author: "VisitBot", ts: "10:02", text: "📅 CT for S. Reddy rescheduled · tomorrow 09:30." })],
      sideEffects: [
        { type: "setRoomStatus", room: "CT", status: "Ready" },
        { type: "setOpsTodayStatus", statusLine: "CT rescheduled to tomorrow 09:30", currentStep: "Rescheduled" },
      ],
    }),
    autoBeat({
      id: "refund",
      label: "Refund issued",
      emit: [botMsg({ author: "VisitBot", ts: "10:02", text: "💸 CT portion refunded · screening recorded as 8/9 pods complete." })],
      sideEffects: [
        { type: "setRoomStatus", room: "CT", status: "Ready" },
        { type: "setOpsTodayStatus", statusLine: "CT refunded · 8/9 pods", currentStep: "Refund" },
      ],
    }),
  ],
};

// B8 — Patient walks out
export const branchB8: Scenario = {
  id: "b8-walkout",
  title: "B8 · Patient walks out mid-visit",
  type: "branch",
  seed: { visit: fakeVisit("B8V1", ["Hema", "Pai"], "screening"), channelName: "v-20260518-B8V001-S", initialMembers: ["kavya.rao", "rohit.iyer", "anjali.pillai"] },
  beats: [
    buttonBeat({
      id: "leaving",
      label: "VM marks patient leaving",
      emit: [
        botMsg({
          author: "VisitBot",
          ts: "10:18",
          source: "alert",
          text: "⚠ @kavya.rao indicated *H. Pai* is leaving early. Open the exit form.",
        }),
      ],
      buttons: [{ label: "Open exit form", style: "danger", nextBeatId: "exit-form" }],
    }),
    formBeat({ id: "exit-form", label: "Exit form", formId: "exit", next: "exit-logged", emit: [] }),
    autoBeat({
      id: "exit-logged",
      label: "Exit logged",
      emit: (ctx) => {
        const f = ctx.formValues?.exit ?? {};
        return [
          botMsg({
            author: "VisitBot",
            ts: "10:21",
            source: "alert",
            text: `📝 Exit logged · reason: *${f.reason ?? "Time pressure"}* · reschedule pref: *${f.resched ?? "Same week"}* · 24h follow-up call: ${f.callback ? "yes" : "no"}.`,
            blocks: [
              { type: "alert", alert: { level: "warning", text: { type: "mrkdwn", text: "*Channel state:* Incomplete · 7-day hold · AppRelay opened reschedule flow in patient app." } } },
            ],
          }),
        ];
      },
      sideEffects: [
        {
          type: "crossPost",
          channelId: "c-alerts",
          message: { author: "VisitBot", isBot: true, ts: "10:21", source: "alert", text: "🚨 Walk-out · #v-20260518-B8V001-S · 7-day hold opened." },
        },
        { type: "setOpsTodayStatus", statusLine: "INCOMPLETE · 7-day hold", currentStep: "Walked out" },
      ],
    }),
  ],
};

export const allBranchScenarios: Scenario[] = [branchB1, branchB2, branchB3, branchB4, branchB5, branchB6, branchB7, branchB8];
