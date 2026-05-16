import type { Scenario, Visit } from "../types";
import { autoBeat, botMsg, buttonBeat, formBeat } from "./helpers";

// 7.5 — Single diagnostic test: Arjun Khan · low-dose CT

const patient = {
  firstName: "Arjun",
  lastName: "Khan",
  age: 38,
  gender: "M" as const,
  member: true,
  memberSince: 2024,
  language: "English",
};

const visitId = "K2L9P4";

const visit: Omit<Visit, "channelId" | "status"> = {
  id: visitId,
  type: "single-test",
  patient,
  package: "Low-dose CT (chest)",
  opsAnchor: "rohit.iyer",
  startedAt: "10:30",
};

export const singleTestScenario: Scenario = {
  id: "single-test",
  title: "Single test · A. Khan (low-dose CT)",
  type: "single-test",
  seed: {
    visit,
    channelName: "v-20260519-K2L9P4-T",
    initialMembers: ["anjali.pillai", "rohit.iyer", "ananya.sen"],
  },
  beats: [
    autoBeat({
      id: "booking",
      label: "Booking",
      delayMs: 600,
      next: "arrival",
      emit: [
        botMsg({
          author: "VisitBot",
          ts: "08:30",
          text: "📋 Single-test channel · A. Khan · low-dose CT",
          blocks: [
            {
              type: "template_native",
              templateId: "visit-card",
              data: {
                patient,
                visitType: "single-test",
                visitId,
                package: "Low-dose CT (chest)",
                scheduledTime: "Tue 19 May · 10:30",
                duration: "≈ 20m",
                language: "English",
                opsAnchor: "rohit.iyer",
              },
            },
          ],
        }),
      ],
      sideEffects: [{ type: "setOpsTodayStatus", statusLine: "Booked", currentStep: "Booked" }],
    }),

    autoBeat({
      id: "arrival",
      label: "Arrival",
      delayMs: 1000,
      next: "route-ct",
      emit: [botMsg({ author: "AppRelay", ts: "10:28", text: "🛎️ A. Khan at the lobby · single CT." })],
      sideEffects: [
        { type: "setOpsTodayStatus", statusLine: "Arrived", currentRoom: "Lobby" },
        { type: "setRoomStatus", room: "Lobby", status: "Occupied", occupant: { initials: "A. Khan", visitId } },
      ],
    }),

    buttonBeat({
      id: "route-ct",
      label: "FC routes to CT pod",
      emit: [
        botMsg({
          author: "VisitBot",
          ts: "10:30",
          text: "🤝 Handoff to CT pod · @anjali.pillai → @ananya.sen.",
        }),
      ],
      sideEffects: [
        { type: "setRoomStatus", room: "Lobby", status: "Ready" },
        { type: "setRoomStatus", room: "CT", status: "Occupied", occupant: { initials: "A. Khan", visitId } },
        { type: "emitRoomEvent", room: "CT", event: "ProcessStarted" },
        { type: "setOpsTodayStatus", statusLine: "CT scan", currentRoom: "CT", currentStep: "Scan" },
      ],
      buttons: [{ label: "Patient with me", style: "primary", nextBeatId: "ct-form" }],
    }),

    formBeat({ id: "ct-form", label: "CT intake form", formId: "ct", next: "ct-result", emit: [] }),

    autoBeat({
      id: "ct-result",
      label: "CT result",
      delayMs: 800,
      next: "checkout",
      emit: (ctx) => {
        const f = ctx.formValues?.ct ?? {};
        return [
          botMsg({
            author: "PodBot",
            ts: "10:48",
            text: "🩻 CT complete",
            blocks: [
              {
                type: "template_native",
                templateId: "pod-result",
                data: {
                  podLabel: "Low-dose CT (chest)",
                  emoji: "🩻",
                  patientInitial: "A. Khan",
                  startedAt: "10:30",
                  finishedAt: "10:48",
                  technician: "ananya.sen",
                  values: [
                    { label: "Image quality", value: f.image_quality ?? "OK" },
                    { label: "Eye mask", value: f.eye_mask !== false ? "Given" : "Skipped" },
                    { label: "Ear plugs", value: f.ear_plugs !== false ? "Given" : "Skipped" },
                    { label: "Blanket", value: f.blanket !== false ? "Offered" : "—" },
                    { label: "Read by", value: "Radiology · auto-route" },
                  ],
                  cues: ["Eye mask", "Ear plugs", "Blanket"],
                },
              },
            ],
          }),
        ];
      },
      sideEffects: [
        { type: "emitRoomEvent", room: "CT", event: "TestDone" },
        { type: "setRoomStatus", room: "CT", status: "Ready" },
      ],
    }),

    autoBeat({
      id: "checkout",
      label: "Checkout",
      delayMs: 700,
      next: "close",
      emit: [
        botMsg({
          author: "VisitBot",
          ts: "10:54",
          text: "🛒 Checkout for A. Khan",
          blocks: [
            {
              type: "template_native",
              templateId: "checkout",
              data: {
                patientInitial: "A. Khan",
                items: [
                  { label: "Report will push to app in 6–8 hrs", checked: true },
                  { label: "GP review auto-booked if flagged", checked: true },
                ],
                totalVisitDuration: "24m",
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
      label: "Close",
      emit: [botMsg({ author: "VisitBot", ts: "10:56", text: "✅ Visit closed · 26m total." })],
      sideEffects: [
        { type: "lockChannel" },
        { type: "setOpsTodayStatus", statusLine: "Closed", currentStep: "Closed" },
      ],
    }),
  ],
};
