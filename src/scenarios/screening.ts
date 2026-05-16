import type { Beat, Block, Scenario, Visit, Message } from "../types";
import { autoBeat, botMsg, buttonBeat, formBeat, staffMsg } from "./helpers";

// =====================================================================
// 7.1 — Screening: Priya Sharma · Annual Plus · 9 pods · flagged sono
// =====================================================================

const patient = {
  firstName: "Priya",
  lastName: "Sharma",
  age: 34,
  gender: "F" as const,
  member: true,
  memberSince: 2024,
  language: "English",
  accessibility: [],
};

const visitId = "A7K3M2";
const channelName = "v-20260517-A7K3M2-S";

const visit: Omit<Visit, "channelId" | "status"> = {
  id: visitId,
  type: "screening",
  patient,
  package: "Annual Plus screening",
  assignedVm: "kavya.rao",
  opsAnchor: "rohit.iyer",
  startedAt: "09:00",
  podOrder: ["Cardiac", "CT", "Oral", "Sensory", "BodyComposition", "Functional", "Sonography", "Cervical", "Mammography"],
};

const initialMembers = ["kavya.rao", "anjali.pillai", "rohit.iyer"];

// --- Reusable beat builders for the eight "standard" pods --------------

interface PodSpec {
  podId: string;
  podLabel: string;
  emoji: string;
  technician: string;
  formId: string;
  handoffTime: string;
  doneTime: string;
  nextPod?: string;
  values: (form: Record<string, any>) => { label: string; value: string }[];
  flags?: (form: Record<string, any>) => string[] | undefined;
  cues?: string[];
}

function podBeats(spec: PodSpec, fromVm: string): Beat[] {
  const idBase = spec.podId.toLowerCase();
  const handoffId = `${idBase}-handoff`;
  const formId = `${idBase}-form`;
  const resultId = `${idBase}-result`;
  const nudgeId = `${idBase}-nudge`;

  const beats: Beat[] = [
    buttonBeat({
      id: handoffId,
      label: `${spec.podLabel} handoff`,
      emit: [
        botMsg({
          author: "VisitBot",
          ts: spec.handoffTime,
          text: `🤝 Handoff at ${spec.podLabel}, @${fromVm} → @${spec.technician}`,
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `*P. Sharma* arriving at *${spec.podLabel}*. Open the intake when she's with you.`,
              },
            },
          ],
        }),
      ],
      sideEffects: [
        { type: "setOpsTodayStatus", statusLine: `Handoff to @${spec.technician}`, currentRoom: spec.podId, currentStep: `${spec.podLabel} handoff` },
        { type: "setRoomStatus", room: spec.podId, status: "Occupied", occupant: { initials: "P. Sharma", visitId } },
        { type: "emitRoomEvent", room: spec.podId, event: "ProcessStarted" },
      ],
      buttons: [{ label: "Patient with me", style: "primary", nextBeatId: formId }],
    }),
    formBeat({
      id: formId,
      label: `${spec.podLabel} intake form`,
      formId: spec.formId,
      next: resultId,
      emit: [],
    }),
    autoBeat({
      id: resultId,
      label: `${spec.podLabel} result`,
      next: nudgeId,
      delayMs: 1000,
      emit: (ctx) => {
        const formData = ctx.formValues?.[spec.formId] ?? {};
        const values = spec.values(formData);
        const flags = spec.flags?.(formData);
        const result: Block = {
          type: "template_native",
          templateId: "pod-result",
          data: {
            podLabel: spec.podLabel,
            emoji: spec.emoji,
            patientInitial: "P. Sharma",
            startedAt: spec.handoffTime,
            finishedAt: spec.doneTime,
            technician: spec.technician,
            values,
            cues: spec.cues,
            flags,
            nextPod: spec.nextPod,
          },
        };
        return [
          botMsg({
            author: "PodBot",
            ts: spec.doneTime,
            text: `${spec.emoji} ${spec.podLabel} complete · P. Sharma`,
            blocks: [result],
          }),
        ];
      },
      sideEffects: [
        { type: "emitRoomEvent", room: spec.podId, event: "TestDone" },
        { type: "setRoomStatus", room: spec.podId, status: "Ready" },
      ],
    }),
    autoBeat({
      id: nudgeId,
      label: `${spec.podLabel} → next nudge`,
      delayMs: 1200,
      next: spec.nextPod ? `${spec.nextPod.toLowerCase()}-handoff` : "screening-complete",
      emit: spec.nextPod
        ? [
            botMsg({
              author: "VisitBot",
              ts: spec.doneTime,
              source: "dm",
              channelId: `dm-VisitBot-${fromVm}`,
              visibleOnlyTo: fromVm,
              text: `💬 Read aloud at next pod: \n\n"Priya, the ${spec.nextPod === "CT" ? "CT scanner" : spec.nextPod.toLowerCase() + " station"} will use ${nextScript(spec.nextPod)}. We'll have you out in about ${nextDuration(spec.nextPod)} minutes."`,
            }),
          ]
        : [],
      sideEffects: spec.nextPod
        ? [{ type: "setOpsTodayStatus", statusLine: `Between pods · → ${spec.nextPod}`, currentStep: `→ ${spec.nextPod}` }]
        : [],
    }),
  ];
  return beats;
}

function nextScript(pod: string): string {
  switch (pod) {
    case "CT": return "a quick imaging pass (eye mask + ear plugs)";
    case "Oral": return "an oral exam and quick cleaning check";
    case "Sensory": return "vision and hearing tests";
    case "BodyComposition": return "a body composition scan";
    case "Functional": return "grip strength and balance checks";
    case "Sonography": return "a focused ultrasound sweep";
    case "Cervical": return "a cervical screening";
    case "Mammography": return "a mammography pass";
    default: return "the next station";
  }
}
function nextDuration(pod: string): number {
  return { CT: 10, Oral: 12, Sensory: 12, BodyComposition: 8, Functional: 12, Sonography: 12, Cervical: 15, Mammography: 12 }[pod] ?? 10;
}

// --- Pod specs -----------------------------------------------------------

const cardiacSpec: PodSpec = {
  podId: "Cardiac",
  podLabel: "Cardiac pod",
  emoji: "🩺",
  technician: "sneha.reddy",
  formId: "cardiac",
  handoffTime: "09:18",
  doneTime: "09:30",
  nextPod: "CT",
  values: (f) => [
    { label: "BP", value: `${f.bp_sys ?? 128}/${f.bp_dia ?? 84} mmHg` },
    { label: "Pulse", value: `${f.pulse ?? 76} bpm` },
    { label: "Position", value: f.position ?? "Sitting" },
    { label: "Blood — attempts", value: String(f.attempts ?? 1) },
    { label: "Needle", value: f.needle ?? "21G butterfly" },
    { label: "Vein quality", value: f.vein_quality ?? "Good" },
    { label: "Samples to lab", value: f.samples ?? "S-0418A, S-0418B, S-0418C" },
    { label: "Omega-3 cross-sell", value: f.omega3 ?? "Declined" },
  ],
  flags: (f) => (f.abnormal ? ["BP/pulse abnormal — flag for doctor review"] : undefined),
  cues: ["Water offered", "Music confirmed", "Sealed sample kit shown"],
};

const ctSpec: PodSpec = {
  podId: "CT",
  podLabel: "CT pod",
  emoji: "🩻",
  technician: "ananya.sen",
  formId: "ct",
  handoffTime: "09:38",
  doneTime: "09:50",
  nextPod: "Oral",
  values: (f) => [
    { label: "Image quality", value: f.image_quality ?? "OK" },
    { label: "Eye mask", value: f.eye_mask !== false ? "Given" : "Skipped" },
    { label: "Ear plugs", value: f.ear_plugs !== false ? "Given" : "Skipped" },
    { label: "Blanket", value: f.blanket !== false ? "Offered" : "Not needed" },
  ],
  cues: ["Eye mask", "Ear plugs", "Blanket"],
};

const oralSpec: PodSpec = {
  podId: "Oral",
  podLabel: "Oral pod",
  emoji: "🦷",
  technician: "vikram.joshi",
  formId: "oral",
  handoffTime: "09:55",
  doneTime: "10:05",
  nextPod: "Sensory",
  values: (f) => [
    { label: "Cleaning needed", value: f.cleaning ? "Yes" : "No" },
    { label: "Urgency", value: f.urgency ?? "Soon" },
    { label: "Recommendation", value: f.rec ?? "Scaling and polishing within 2 weeks." },
  ],
};

const sensorySpec: PodSpec = {
  podId: "Sensory",
  podLabel: "Sensory pod",
  emoji: "👁️",
  technician: "nikhil.menon",
  formId: "sensory",
  handoffTime: "10:10",
  doneTime: "10:22",
  nextPod: "BodyComposition",
  values: (f) => [
    { label: "Vision L / R", value: `${f.vision_l ?? "6/9"} · ${f.vision_r ?? "6/6"}` },
    { label: "Vision flag", value: f.vision_flag ?? "Normal" },
    { label: "Hearing L / R", value: `${f.hear_l ?? 20} dB · ${f.hear_r ?? 18} dB` },
    { label: "Conductivity flag", value: f.conductivity ? "Yes" : "Within normal" },
  ],
};

const bodyCompSpec: PodSpec = {
  podId: "BodyComposition",
  podLabel: "Body composition pod",
  emoji: "📊",
  technician: "farah.sheikh",
  formId: "bodyComposition",
  handoffTime: "10:25",
  doneTime: "10:33",
  nextPod: "Functional",
  values: (f) => [
    { label: "Body fat", value: `${f.fat ?? 26}%` },
    { label: "Lean mass", value: `${f.lean ?? 41} kg` },
    { label: "Bone density", value: f.bone ?? "Normal" },
  ],
};

const functionalSpec: PodSpec = {
  podId: "Functional",
  podLabel: "Functional pod",
  emoji: "🏃",
  technician: "deepak.varma",
  formId: "functional",
  handoffTime: "10:30",
  doneTime: "10:38",
  nextPod: "Sonography",
  values: (f) => [
    { label: "Cognitive", value: `${f.cognitive ?? 28}/30` },
    { label: "Grip L / R", value: `${f.grip_l ?? 24} / ${f.grip_r ?? 27} kg` },
    { label: "Mobility", value: `${f.mobility ?? 8}/10` },
    { label: "Balance flag", value: f.balance ? "Yes" : "No" },
  ],
};

const sonographySpec: PodSpec = {
  podId: "Sonography",
  podLabel: "Sonography pod",
  emoji: "🩻",
  technician: "aditi.bhat",
  formId: "sonography",
  handoffTime: "10:38",
  doneTime: "10:50",
  nextPod: "Cervical",
  values: (f) => [
    { label: "Areas scanned", value: f.areas ?? "Abdomen, Pelvis, Thyroid" },
    { label: "Findings", value: f.findings ?? "Normal" },
  ],
  flags: (f) => (f.findings && f.findings !== "Normal" ? [`Finding: ${f.findings}`] : undefined),
};

const cervicalSpec: PodSpec = {
  podId: "Cervical",
  podLabel: "Cervical pod",
  emoji: "🌸",
  technician: "maya.naidu",
  formId: "cervical",
  handoffTime: "10:58",
  doneTime: "11:12",
  nextPod: "Mammography",
  values: (f) => [
    { label: "Sample IDs", value: f.samples ?? "S-0419H, S-0419I" },
    { label: "Smaller speculum", value: f.small_speculum !== false ? "Used" : "Not used" },
    { label: "Self-insertion offered", value: f.self_insertion !== false ? "Yes" : "No" },
    { label: "Communication cue", value: f.comm !== false ? "Confirmed" : "Skipped" },
    { label: "Lab ETA", value: "4 hrs" },
  ],
};

const mammographySpec: PodSpec = {
  podId: "Mammography",
  podLabel: "Mammography pod",
  emoji: "🩻",
  technician: "reshma.qureshi",
  formId: "mammography",
  handoffTime: "11:18",
  doneTime: "11:30",
  nextPod: undefined,
  values: (f) => [
    { label: "Cycle phase asked", value: f.cycle !== false ? "Yes" : "No" },
    { label: "Lady technician", value: f.lady_tech !== false ? "Confirmed" : "—" },
    { label: "Warm plates", value: f.warm_plates !== false ? "Confirmed" : "—" },
    { label: "Image", value: f.image ?? "OK" },
    { label: "Retake", value: (f.image ?? "OK") === "OK" ? "No" : "Yes" },
  ],
};

// --- The full scenario ---------------------------------------------------

export const screeningScenario: Scenario = {
  id: "screening",
  title: "Annual screening — Priya Sharma",
  subtitle: "Full 9-pod screening with a flagged ultrasound",
  type: "screening",
  seed: {
    visit,
    channelName,
    initialMembers,
    preloadMessages: [],
  },
  beats: [
    // 1. Booking confirmed
    autoBeat({
      id: "booking",
      label: "Booking confirmed",
      delayMs: 1000,
      next: "morning-digest",
      emit: [
        botMsg({
          author: "VisitBot",
          ts: "17:30",
          text: "📋 Visit channel created · annual screening for *P. Sharma*",
          blocks: [
            {
              type: "template_native",
              templateId: "visit-card",
              data: {
                patient,
                visitType: "screening",
                visitId,
                package: "Annual Plus screening",
                scheduledTime: "Mon 17 May · 09:00",
                duration: "≈ 2h 30m",
                refreshment: "Lemon water (no caffeine)",
                language: "English",
                accessibility: [],
                assignedVm: "kavya.rao",
                opsAnchor: "rohit.iyer",
              },
            },
            {
              type: "actions",
              elements: [
                // Decorative info actions — no scenario advancement.
                { type: "button", text: { type: "plain_text", text: "View patient history" }, action_id: "vh" },
                { type: "button", text: { type: "plain_text", text: "Edit visit" }, action_id: "ev" },
                { type: "button", text: { type: "plain_text", text: "Reassign VM" }, action_id: "rv" },
              ],
            },
          ],
        }),
      ],
      sideEffects: [
        { type: "setOpsTodayStatus", statusLine: "Booked · awaiting arrival", currentStep: "Booked", currentRoom: "—" },
      ],
    }),

    // 2. Morning digest
    autoBeat({
      id: "morning-digest",
      label: "Morning digest (DM to VM)",
      delayMs: 800,
      next: "in-transit",
      emit: [
        botMsg({
          author: "VisitBot",
          ts: "08:00",
          source: "dm",
          channelId: "dm-VisitBot-kavya.rao",
          visibleOnlyTo: "kavya.rao",
          text: "☀ Morning digest for @kavya.rao",
          blocks: [
            {
              type: "template_native",
              templateId: "morning-digest",
              data: {
                date: "Mon 17 May",
                recipient: "kavya.rao",
                visits: [
                  { time: "09:00", patientInitial: "P. Sharma", type: "Screening", package: "Annual Plus", channelName },
                  { time: "11:00", patientInitial: "M. Iyer", type: "Single test", channelName: "v-20260517-Q1L2K5-T" },
                  { time: "14:00", patientInitial: "T. Nair", type: "Screening", package: "Core", channelName: "v-20260517-J3M5R1-S" },
                ],
              },
            },
          ],
        }),
      ],
    }),

    // 3. In transit
    autoBeat({
      id: "in-transit",
      label: "AppRelay in-transit",
      delayMs: 1000,
      next: "arrival",
      emit: [
        botMsg({
          author: "AppRelay",
          ts: "08:50",
          text: "🚗 P. Sharma is on the way · ETA 10 min · 5 km out, light traffic.",
        }),
      ],
      sideEffects: [{ type: "setOpsTodayStatus", statusLine: "In transit · ETA 10m", currentStep: "Transit" }],
    }),

    // 4. Arrival
    autoBeat({
      id: "arrival",
      label: "Arrival at lobby",
      delayMs: 1000,
      next: "vm-takeover",
      emit: [
        botMsg({
          author: "AppRelay",
          ts: "08:58",
          text: "🛎️ P. Sharma at the lobby · @anjali.pillai please make contact · @kavya.rao take primary at 09:00.",
        }),
      ],
      sideEffects: [
        { type: "setOpsTodayStatus", statusLine: "At lobby · FC making contact", currentRoom: "Lobby", currentStep: "Arrived" },
        { type: "setRoomStatus", room: "Lobby", status: "Occupied", occupant: { initials: "P. Sharma", visitId } },
      ],
    }),

    // 5. VM takeover
    autoBeat({
      id: "vm-takeover",
      label: "VM takes over",
      delayMs: 1200,
      next: "pp4-unlock",
      emit: [
        botMsg({
          author: "VisitBot",
          ts: "09:00",
          text: "🤝 @kavya.rao is now primary steward for P. Sharma. 🍋 Lemon water ordered to PP4.",
        }),
      ],
      sideEffects: [{ type: "setOpsTodayStatus", statusLine: "VM primary · routing to PP4", currentStep: "Routing → PP4" }],
    }),

    // 6. Personal pod PP4 — unlock + readiness + complete
    buttonBeat({
      id: "pp4-unlock",
      label: "Unlock PP4",
      emit: [
        botMsg({
          author: "VisitBot",
          ts: "09:02",
          text: "🚪 PP4 unlocked · key card issued · changing area + sample drop bin + refreshment shelf.",
        }),
      ],
      sideEffects: [
        { type: "setRoomStatus", room: "PP4", status: "Occupied", occupant: { initials: "P. Sharma", visitId } },
        { type: "setRoomStatus", room: "Lobby", status: "Ready" },
        { type: "setOpsTodayStatus", statusLine: "In PP4 · changing", currentRoom: "PP4", currentStep: "PP4 prep" },
      ],
      buttons: [
        { label: "Pod ready check", style: "primary", nextBeatId: "pp4-ready" },
        { label: "Need a different pod", nextBeatId: "pp4-ready" },
      ],
    }),
    buttonBeat({
      id: "pp4-ready",
      label: "Pod ready check",
      emit: [
        botMsg({
          author: "VisitBot",
          ts: "09:10",
          text: "✅ PP4 ready check complete · patient changed · sample kit picked up.",
        }),
      ],
      buttons: [
        { label: "Patient ready", style: "primary", nextBeatId: "pp4-complete" },
        { label: "Need more time", nextBeatId: "pp4-complete" },
      ],
    }),
    autoBeat({
      id: "pp4-complete",
      label: "PP4 complete",
      delayMs: 700,
      next: "cardiac-handoff",
      emit: [
        botMsg({
          author: "VisitBot",
          ts: "09:15",
          text: "✅ Personal pod complete · ⏭ Next: Cardiac pod",
        }),
      ],
      sideEffects: [
        { type: "setRoomStatus", room: "PP4", status: "Ready" },
        { type: "setOpsTodayStatus", statusLine: "Between rooms · → Cardiac", currentStep: "→ Cardiac" },
      ],
    }),

    // --- All pod beats: cardiac → CT → oral → sensory → body comp → functional ---
    ...podBeats(cardiacSpec, "kavya.rao"),
    ...podBeats(ctSpec, "kavya.rao"),
    ...podBeats(oralSpec, "kavya.rao"),
    ...podBeats(sensorySpec, "kavya.rao"),
    ...podBeats(bodyCompSpec, "kavya.rao"),
    ...podBeats(functionalSpec, "kavya.rao"),
    ...podBeats(sonographySpec, "kavya.rao"),
    ...podBeats(cervicalSpec, "kavya.rao"),
    ...podBeats(mammographySpec, "kavya.rao"),

    // --- Sono flagged escalation sub-tree (manual button on sono form) ---
    autoBeat({
      id: "sono-flag-doctor",
      label: "Sono flagged · doctor pinged",
      delayMs: 600,
      next: "sono-doctor-decision",
      emit: [
        botMsg({
          author: "PodBot",
          ts: "10:48",
          source: "alert",
          text: "⚠ Finding flagged on sonography · adding @dr.anand to channel.",
          blocks: [
            {
              type: "template_native",
              templateId: "escalation",
              data: {
                level: "warning",
                title: "Sonography — flagged finding",
                detail: "Pelvic scan shows a small ovarian cyst, 18mm, right side. Requesting GP review before continuing.",
                context: "Aditi Bhat · Sonography pod · 10:48",
              },
            },
          ],
        }),
      ],
      sideEffects: [
        { type: "addChannelMember", handle: "dr.anand" },
        { type: "setOpsTodayStatus", statusLine: "Sono flagged · doctor reviewing", currentStep: "Sono review" },
      ],
    }),
    buttonBeat({
      id: "sono-doctor-decision",
      label: "Doctor decision",
      emit: [
        botMsg({
          author: "PodBot",
          ts: "10:50",
          text: "@dr.anand please review and choose. Screening will continue once you decide.",
        }),
      ],
      buttons: [
        { label: "Reassured, continue", style: "primary", nextBeatId: "sono-continue" },
        { label: "Recommend follow-up", nextBeatId: "sono-followup-form" },
        { label: "Escalate to urgent", style: "danger", nextBeatId: "sono-urgent" },
      ],
    }),
    formBeat({
      id: "sono-followup-form",
      label: "Follow-up window form",
      formId: "followup",
      next: "sono-followup-logged",
      emit: [],
    }),
    autoBeat({
      id: "sono-followup-logged",
      label: "Follow-up logged",
      delayMs: 600,
      next: "sono-continue",
      emit: (ctx) => [
        botMsg({
          author: "PodBot",
          ts: "10:52",
          text: `📝 Follow-up logged: **${ctx.formValues?.followup?.window ?? "2–4 weeks"}** with GP. Patient app notified.`,
        }),
      ],
    }),
    autoBeat({
      id: "sono-urgent",
      label: "Sono urgent escalation",
      delayMs: 600,
      next: "sono-continue",
      emit: [
        botMsg({
          author: "PodBot",
          ts: "10:51",
          source: "alert",
          text: "🚨 Escalated to urgent · same-day specialist slot 14:30 reserved. Patient briefed.",
          blocks: [
            {
              type: "template_native",
              templateId: "escalation",
              data: {
                level: "error",
                title: "Sonography → urgent specialist",
                detail: "Specialist consult auto-booked 14:30. Patient family to be informed at checkout.",
              },
            },
          ],
        }),
      ],
      sideEffects: [
        {
          type: "crossPost",
          channelId: "c-alerts",
          message: {
            author: "PodBot",
            isBot: true,
            ts: "10:51",
            source: "alert",
            text: "🚨 #v-20260517-A7K3M2-S · sono flagged · specialist 14:30 booked.",
          },
        },
      ],
    }),
    autoBeat({
      id: "sono-continue",
      label: "Resume screening",
      delayMs: 600,
      next: "cervical-handoff",
      emit: [
        botMsg({ author: "PodBot", ts: "10:53", text: "✅ Decision logged. Removing @dr.anand. Screening resuming → Cervical." }),
      ],
      sideEffects: [
        { type: "removeChannelMember", handle: "dr.anand" },
        { type: "setOpsTodayStatus", statusLine: "Resuming · → Cervical", currentStep: "→ Cervical" },
      ],
    }),

    // --- Screening complete + consult prompt ---
    buttonBeat({
      id: "screening-complete",
      label: "Screening complete · consult now?",
      emit: [
        botMsg({
          author: "VisitBot",
          ts: "11:32",
          text: "🎉 Screening complete · all 9 pods done in 2h 17m",
          blocks: [
            {
              type: "template_image",
              templateId: "screening-report",
              data: {
                patientInitial: "P. Sharma",
                pods: [
                  { name: "Cardiac", status: "ok", summary: "BP 128/84, samples to lab" },
                  { name: "CT", status: "ok", summary: "Image OK" },
                  { name: "Oral", status: "ok", summary: "Cleaning recommended" },
                  { name: "Sensory", status: "ok", summary: "Vision/hearing within norm" },
                  { name: "Body Comp", status: "ok", summary: "Lean mass 41kg" },
                  { name: "Functional", status: "ok", summary: "Cognitive 28/30" },
                  { name: "Sonography", status: "flag", summary: "Ovarian cyst 18mm — follow-up" },
                  { name: "Cervical", status: "ok", summary: "Samples to lab (ETA 4h)" },
                  { name: "Mammography", status: "ok", summary: "Image OK, no retake" },
                ],
                bodyHighlights: [
                  { area: "abdomen", finding: "Sono flagged · small cyst, follow-up in 2–4 wks" },
                  { area: "mouth", finding: "Scaling recommended" },
                ],
                score: 82,
                scoreOutOf: 100,
              },
            },
          ],
        }),
      ],
      sideEffects: [{ type: "setOpsTodayStatus", statusLine: "Screening done · awaiting consult", currentStep: "Consult prompt" }],
      buttons: [
        { label: "Yes, consult now", style: "primary", nextBeatId: "consult-route" },
        { label: "Will book later", nextBeatId: "checkout" },
      ],
    }),

    // --- Consult room → wrap-up → checkout → close ---
    autoBeat({
      id: "consult-route",
      label: "Route to CR2 + nurse vitals",
      delayMs: 900,
      next: "vitals-form",
      emit: [
        botMsg({
          author: "VisitBot",
          ts: "11:38",
          text: "🚪 CR2 ready · @geetha.murthy for post-screening vitals · @dr.anand to follow.",
        }),
      ],
      sideEffects: [
        { type: "setRoomStatus", room: "CR2", status: "Occupied", occupant: { initials: "P. Sharma", visitId } },
        { type: "addChannelMember", handle: "geetha.murthy" },
        { type: "addChannelMember", handle: "dr.anand" },
        { type: "setOpsTodayStatus", statusLine: "Consult · vitals in CR2", currentRoom: "CR2", currentStep: "Vitals" },
      ],
    }),
    formBeat({
      id: "vitals-form",
      label: "Nurse vitals form",
      formId: "vitals",
      next: "vitals-result",
      emit: [],
    }),
    autoBeat({
      id: "vitals-result",
      label: "Post-screening vitals",
      delayMs: 700,
      next: "doctor-history",
      emit: (ctx) => {
        const v = ctx.formValues?.vitals ?? {};
        return [
          botMsg({
            author: "PodBot",
            ts: "11:48",
            text: `🩺 Vitals · BP ${v.bp_sys ?? 132}/${v.bp_dia ?? 86} · Pulse ${v.pulse ?? 78} · Height ${v.height ?? 165}cm · Weight ${v.weight ?? 62}kg · Temp ${v.temp ?? 36.7}°C`,
          }),
        ];
      },
    }),
    autoBeat({
      id: "doctor-history",
      label: "Ephemeral history to doctor",
      delayMs: 800,
      next: "doctor-wrap",
      emit: [
        botMsg({
          author: "PodBot",
          ts: "11:52",
          visibleOnlyTo: "dr.anand",
          text: "*Patient history summary — for Dr. Anand only*\n• Member since 2024\n• 2 GP consults last 12 months · seasonal allergy, UTI\n• No imaging on file\n• Allergies: penicillin\n• Today: cardiac normal, sono cyst 18mm → follow-up 2–4 wks logged, mammography OK",
        }),
      ],
    }),
    autoBeat({
      id: "doctor-wrap",
      label: "Doctor wrap-up record",
      delayMs: 1500,
      next: "checkout",
      emit: [
        botMsg({
          author: "PodBot",
          ts: "12:08",
          text: "📝 Wrap-up record · Dr. Anand",
          blocks: [
            {
              type: "card",
              card: {
                icon: "📝",
                title: { type: "plain_text", text: "Dr. Anand · wrap-up" },
                subtitle: { type: "mrkdwn", text: "P. Sharma · post-screening consult · 12:08" },
                fields: [
                  { label: "Diagnosis", value: "Healthy adult · ovarian cyst (benign-appearing) — monitor" },
                  { label: "Prescription", value: "None today; review at follow-up" },
                  { label: "Supplements", value: "Omega-3 1g · Vitamin D 1000 IU (3-month starter)" },
                  { label: "Follow-up", value: "Sono follow-up 2–4 wks · GP 3 months" },
                  { label: "Lifestyle", value: "Add 20 min walking · reduce screen post-21:00" },
                ],
              },
            },
          ],
        }),
      ],
    }),

    autoBeat({
      id: "checkout",
      label: "Checkout card",
      delayMs: 800,
      next: "close",
      emit: [
        botMsg({
          author: "VisitBot",
          ts: "12:14",
          text: "🛒 Checkout for P. Sharma",
          blocks: [
            {
              type: "template_native",
              templateId: "checkout",
              data: {
                patientInitial: "P. Sharma",
                items: [
                  { label: "Membership active · auto-renew on", checked: true },
                  { label: "Omega-3 + Vit D subscription — 3 months", checked: true },
                  { label: "Sono follow-up booked · 02 Jun 16:30", checked: true },
                  { label: "Dietician consult · optional · added to wishlist", checked: false },
                ],
                totalVisitDuration: "3h 14m",
                notes: "Patient briefed on follow-up and supplements; lab results will push to app at ~16:00.",
              },
            },
            {
              type: "actions",
              elements: [{ type: "button", text: { type: "plain_text", text: "Visit closed" }, style: "primary", action_id: "close", nextBeatId: "close" }],
            },
          ],
        }),
      ],
      sideEffects: [{ type: "setOpsTodayStatus", statusLine: "Checkout", currentStep: "Checkout" }],
    }),

    autoBeat({
      id: "close",
      label: "Visit closed",
      delayMs: 500,
      emit: [
        botMsg({
          author: "VisitBot",
          ts: "12:18",
          text: "✅ Visit closed for P. Sharma · channel locks in 30s, then archives. Total time 3h 18m.",
        }),
      ],
      sideEffects: [
        { type: "setRoomStatus", room: "CR2", status: "Ready" },
        { type: "lockChannel" },
        { type: "setOpsTodayStatus", statusLine: "Closed", currentStep: "Closed" },
      ],
    }),
  ],
};
