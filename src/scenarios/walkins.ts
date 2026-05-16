import type { Scenario, Visit } from "../types";
import { autoBeat, botMsg, buttonBeat, formBeat } from "./helpers";

// 7.3 — Walk-in (non-member): S. Mehta
const nonMemberPatient = {
  firstName: "Sunita",
  lastName: "Mehta",
  age: 45,
  gender: "F" as const,
  member: false,
  language: "English",
};

const nonMemberVisit: Omit<Visit, "channelId" | "status"> = {
  id: "T8K2P9",
  type: "consulting",
  patient: nonMemberPatient,
  concern: "Persistent cough x 3 weeks",
  assignedDoctor: "dr.priya",
  opsAnchor: "rohit.iyer",
  startedAt: "11:25",
};

export const walkinNonMemberScenario: Scenario = {
  id: "walkin-nonmember",
  title: "Walk-in · S. Mehta (non-member)",
  type: "walk-in",
  seed: {
    visit: nonMemberVisit,
    channelName: "v-20260517-T8K2P9-C",
    initialMembers: ["anjali.pillai", "rohit.iyer"],
  },
  beats: [
    autoBeat({
      id: "create",
      label: "Walk-in created",
      delayMs: 600,
      next: "pitch-decision",
      emit: [
        botMsg({
          author: "VisitBot",
          ts: "11:25",
          text: "📋 Walk-in channel created · S. Mehta · non-member",
          blocks: [
            {
              type: "template_native",
              templateId: "visit-card",
              data: {
                patient: nonMemberPatient,
                visitType: "consulting",
                visitId: "T8K2P9",
                concern: "Persistent cough x 3 weeks",
                scheduledTime: "Today · 11:30 (walk-in)",
                duration: "≈ 30m",
                language: "English",
                assignedDoctor: "dr.priya",
                opsAnchor: "rohit.iyer",
              },
            },
          ],
        }),
      ],
      sideEffects: [{ type: "setOpsTodayStatus", statusLine: "Walk-in · non-member · awaiting pitch decision", currentStep: "Pitch" }],
    }),

    buttonBeat({
      id: "pitch-decision",
      label: "Pitch decision",
      emit: [
        botMsg({
          author: "VisitBot",
          ts: "11:26",
          text: "Patient is non-member. Membership pitch is optional.",
        }),
      ],
      buttons: [
        { label: "Brief membership pitch", nextBeatId: "pitch-given" },
        { label: "Skip pitch, proceed", style: "primary", nextBeatId: "route-cr2" },
      ],
    }),

    autoBeat({
      id: "pitch-given",
      label: "Pitch given",
      delayMs: 700,
      next: "route-cr2",
      emit: [
        botMsg({ author: "VisitBot", ts: "11:27", text: "💬 60-second membership pitch delivered · patient said 'will think about it'." }),
      ],
    }),

    autoBeat({
      id: "route-cr2",
      label: "Route to CR1 + vitals",
      delayMs: 800,
      next: "vitals-form",
      emit: [
        botMsg({ author: "VisitBot", ts: "11:28", text: "🚪 CR1 ready · @geetha.murthy vitals first · @dr.priya to follow." }),
      ],
      sideEffects: [
        { type: "addChannelMember", handle: "dr.priya" },
        { type: "addChannelMember", handle: "geetha.murthy" },
        { type: "setRoomStatus", room: "CR1", status: "Occupied", occupant: { initials: "S. Mehta", visitId: "T8K2P9" } },
        { type: "setOpsTodayStatus", statusLine: "Vitals in CR1", currentRoom: "CR1", currentStep: "Vitals" },
      ],
    }),

    formBeat({ id: "vitals-form", label: "Vitals form", formId: "vitals", next: "vitals-result", emit: [] }),

    autoBeat({
      id: "vitals-result",
      label: "Vitals result",
      delayMs: 700,
      next: "doctor-wrap",
      emit: (ctx) => {
        const v = ctx.formValues?.vitals ?? {};
        return [
          botMsg({
            author: "PodBot",
            ts: "11:34",
            text: `🩺 Vitals · BP ${v.bp_sys ?? 122}/${v.bp_dia ?? 78} · Pulse ${v.pulse ?? 84} · Temp ${v.temp ?? 37.4}°C (mildly raised).`,
          }),
        ];
      },
    }),

    autoBeat({
      id: "doctor-wrap",
      label: "Doctor wrap-up",
      delayMs: 1100,
      next: "checkout",
      emit: [
        botMsg({
          author: "PodBot",
          ts: "11:48",
          text: "📝 Dr. Priya wrap-up · S. Mehta",
          blocks: [
            {
              type: "card",
              card: {
                icon: "📝",
                title: { type: "plain_text", text: "Dr. Priya · wrap-up" },
                subtitle: { type: "mrkdwn", text: "S. Mehta · cough consult · 11:48" },
                fields: [
                  { label: "Diagnosis", value: "Post-viral cough · likely allergic component" },
                  { label: "Prescription", value: "Inhaled steroid PRN · cough syrup" },
                  { label: "Follow-up", value: "Re-visit if not better in 10 days" },
                ],
              },
            },
          ],
        }),
      ],
    }),

    autoBeat({
      id: "checkout",
      label: "Checkout (non-member)",
      delayMs: 700,
      next: "close",
      emit: [
        botMsg({
          author: "VisitBot",
          ts: "11:52",
          text: "🛒 Checkout · S. Mehta",
          blocks: [
            {
              type: "template_native",
              templateId: "checkout",
              data: {
                patientInitial: "S. Mehta",
                items: [
                  { label: "Payment processed (non-member rate)", checked: true },
                  { label: "Membership info pack handed", checked: true },
                  { label: "Inhaler dispensed", checked: true },
                ],
                totalVisitDuration: "27m",
              },
            },
            {
              type: "actions",
              elements: [{ type: "button", text: { type: "plain_text", text: "Visit closed" }, style: "primary", action_id: "close", nextBeatId: "close" }],
            },
          ],
        }),
      ],
    }),

    autoBeat({
      id: "close",
      label: "Close",
      emit: [botMsg({ author: "VisitBot", ts: "11:54", text: "✅ Walk-in closed · 29m total." })],
      sideEffects: [
        { type: "setRoomStatus", room: "CR1", status: "Ready" },
        { type: "lockChannel" },
        { type: "setOpsTodayStatus", statusLine: "Closed", currentStep: "Closed" },
      ],
    }),
  ],
};

// 7.4 — Walk-in (member): A. Iyer
const memberPatient = {
  firstName: "Aarav",
  lastName: "Iyer",
  age: 36,
  gender: "M" as const,
  member: true,
  memberSince: 2025,
  language: "English",
};

const memberVisit: Omit<Visit, "channelId" | "status"> = {
  id: "M2N9Q4",
  type: "consulting",
  patient: memberPatient,
  concern: "Mild fever 2 days",
  assignedDoctor: "dr.priya",
  opsAnchor: "rohit.iyer",
  startedAt: "14:00",
};

export const walkinMemberScenario: Scenario = {
  id: "walkin-member",
  title: "Walk-in · A. Iyer (member)",
  type: "walk-in",
  seed: {
    visit: memberVisit,
    channelName: "v-20260517-M2N9Q4-C",
    initialMembers: ["anjali.pillai", "rohit.iyer"],
  },
  beats: [
    autoBeat({
      id: "create",
      label: "Walk-in created",
      delayMs: 600,
      next: "slot-picker",
      emit: [
        botMsg({
          author: "VisitBot",
          ts: "12:40",
          text: "📋 Walk-in channel created · A. Iyer · member · routing to same-day slot",
          blocks: [
            {
              type: "template_native",
              templateId: "visit-card",
              data: {
                patient: memberPatient,
                visitType: "consulting",
                visitId: "M2N9Q4",
                concern: "Mild fever 2 days",
                scheduledTime: "Today · awaiting slot pick",
                language: "English",
                assignedDoctor: "dr.priya",
                opsAnchor: "rohit.iyer",
              },
            },
          ],
        }),
      ],
      sideEffects: [{ type: "setOpsTodayStatus", statusLine: "Walk-in member · slot pending", currentStep: "Slot" }],
    }),

    buttonBeat({
      id: "slot-picker",
      label: "Same-day slot picker",
      emit: [
        botMsg({
          author: "VisitBot",
          ts: "12:41",
          text: "Pick a same-day slot for A. Iyer:",
        }),
      ],
      buttons: [
        { label: "Today 14:00", style: "primary", nextBeatId: "slot-confirmed" },
        { label: "Today 16:30", nextBeatId: "slot-confirmed" },
        { label: "Tomorrow 09:00", nextBeatId: "slot-confirmed" },
      ],
    }),

    autoBeat({
      id: "slot-confirmed",
      label: "Slot confirmed",
      delayMs: 700,
      next: "arrival",
      emit: [
        botMsg({
          author: "VisitBot",
          ts: "12:42",
          text: "✅ Slot confirmed · 14:00 with @dr.priya · @anjali.pillai send the AppRelay nudge.",
        }),
      ],
    }),

    autoBeat({
      id: "arrival",
      label: "Patient arrives at slot time",
      delayMs: 1200,
      next: "route-cr1",
      emit: [
        botMsg({ author: "AppRelay", ts: "13:58", text: "🛎️ A. Iyer at the lobby · 2 min early." }),
      ],
      sideEffects: [{ type: "setOpsTodayStatus", statusLine: "Arrived", currentRoom: "Lobby" }],
    }),

    autoBeat({
      id: "route-cr1",
      label: "Route to CR1",
      delayMs: 800,
      next: "vitals-form",
      emit: [botMsg({ author: "VisitBot", ts: "14:00", text: "🚪 CR1 ready · vitals → doctor." })],
      sideEffects: [
        { type: "addChannelMember", handle: "geetha.murthy" },
        { type: "addChannelMember", handle: "dr.priya" },
        { type: "setRoomStatus", room: "CR1", status: "Occupied", occupant: { initials: "A. Iyer", visitId: "M2N9Q4" } },
        { type: "setOpsTodayStatus", statusLine: "Vitals in CR1", currentRoom: "CR1", currentStep: "Vitals" },
      ],
    }),

    formBeat({ id: "vitals-form", label: "Vitals form", formId: "vitals", next: "vitals-result", emit: [] }),
    autoBeat({
      id: "vitals-result",
      label: "Vitals",
      delayMs: 700,
      next: "doctor-wrap",
      emit: (ctx) => {
        const v = ctx.formValues?.vitals ?? {};
        return [botMsg({ author: "PodBot", ts: "14:06", text: `🩺 Vitals · BP ${v.bp_sys ?? 118}/${v.bp_dia ?? 76} · Pulse ${v.pulse ?? 88} · Temp ${v.temp ?? 38.1}°C` })];
      },
    }),
    autoBeat({
      id: "doctor-wrap",
      label: "Doctor wrap-up",
      delayMs: 1100,
      next: "checkout",
      emit: [
        botMsg({
          author: "PodBot",
          ts: "14:18",
          text: "📝 Dr. Priya · A. Iyer",
          blocks: [
            {
              type: "card",
              card: {
                icon: "📝",
                title: { type: "plain_text", text: "Dr. Priya · wrap-up" },
                subtitle: { type: "mrkdwn", text: "A. Iyer · 14:18" },
                fields: [
                  { label: "Diagnosis", value: "Viral pyrexia · self-limiting" },
                  { label: "Prescription", value: "Paracetamol PRN · ORS · rest 48h" },
                  { label: "Follow-up", value: "Re-visit if persists > 4 days" },
                ],
              },
            },
          ],
        }),
      ],
    }),
    autoBeat({
      id: "checkout",
      label: "Checkout",
      delayMs: 600,
      next: "close",
      emit: [
        botMsg({
          author: "VisitBot",
          ts: "14:22",
          text: "🛒 Checkout for A. Iyer",
          blocks: [
            {
              type: "template_native",
              templateId: "checkout",
              data: {
                patientInitial: "A. Iyer",
                items: [
                  { label: "Member walk-in · zero copay", checked: true },
                  { label: "Paracetamol + ORS dispensed", checked: true },
                ],
                totalVisitDuration: "25m",
              },
            },
            {
              type: "actions",
              elements: [{ type: "button", text: { type: "plain_text", text: "Visit closed" }, style: "primary", action_id: "close", nextBeatId: "close" }],
            },
          ],
        }),
      ],
    }),
    autoBeat({
      id: "close",
      label: "Close",
      emit: [botMsg({ author: "VisitBot", ts: "14:24", text: "✅ Visit closed · 26m." })],
      sideEffects: [
        { type: "setRoomStatus", room: "CR1", status: "Ready" },
        { type: "lockChannel" },
        { type: "setOpsTodayStatus", statusLine: "Closed", currentStep: "Closed" },
      ],
    }),
  ],
};
