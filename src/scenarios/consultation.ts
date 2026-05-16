import type { Scenario, Visit } from "../types";
import { autoBeat, botMsg, buttonBeat, formBeat } from "./helpers";

// 7.2 — Consultation: Rajesh Kumar · acid reflux · Dr. Meera · CR3 · in-room test

const patient = {
  firstName: "Rajesh",
  lastName: "Kumar",
  age: 42,
  gender: "M" as const,
  member: true,
  memberSince: 2023,
  language: "English",
};

const visitId = "D4M7L2";

const visit: Omit<Visit, "channelId" | "status"> = {
  id: visitId,
  type: "consulting",
  patient,
  concern: "Persistent acid reflux (3 mo)",
  assignedDoctor: "dr.meera",
  opsAnchor: "rohit.iyer",
  startedAt: "10:00",
};

export const consultationScenario: Scenario = {
  id: "consulting",
  title: "Consultation · R. Kumar (in-room test)",
  type: "consulting",
  seed: {
    visit,
    channelName: "v-20260520-D4M7L2-C",
    initialMembers: ["anjali.pillai", "rohit.iyer", "dr.meera"],
    preloadMessages: [],
  },
  beats: [
    autoBeat({
      id: "booking",
      label: "Booking card",
      delayMs: 800,
      next: "arrival",
      emit: [
        botMsg({
          author: "VisitBot",
          ts: "09:30",
          text: "📋 Consultation channel created · R. Kumar",
          blocks: [
            {
              type: "template_native",
              templateId: "visit-card",
              data: {
                patient,
                visitType: "consulting",
                visitId,
                concern: "Persistent acid reflux (3 mo)",
                scheduledTime: "Wed 20 May · 10:00",
                duration: "≈ 45m",
                language: "English",
                assignedDoctor: "dr.meera",
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
      next: "route-cr3",
      emit: [
        botMsg({ author: "AppRelay", ts: "09:58", text: "🛎️ R. Kumar at the lobby · @anjali.pillai please make contact." }),
      ],
      sideEffects: [
        { type: "setOpsTodayStatus", statusLine: "Arrived · lobby", currentRoom: "Lobby" },
        { type: "setRoomStatus", room: "Lobby", status: "Occupied", occupant: { initials: "R. Kumar", visitId } },
      ],
    }),

    autoBeat({
      id: "route-cr3",
      label: "Route to CR3 + vitals",
      delayMs: 900,
      next: "vitals-form",
      emit: [
        botMsg({
          author: "VisitBot",
          ts: "10:02",
          text: "🚪 CR3 ready · @geetha.murthy for vitals · @dr.meera to follow.",
        }),
        botMsg({
          author: "AppRelay",
          ts: "10:02",
          text: "📱 Patient app push: \"Please proceed to room 3.\"",
        }),
      ],
      sideEffects: [
        { type: "addChannelMember", handle: "geetha.murthy" },
        { type: "setRoomStatus", room: "Lobby", status: "Ready" },
        { type: "setRoomStatus", room: "CR3", status: "Occupied", occupant: { initials: "R. Kumar", visitId } },
        { type: "setOpsTodayStatus", statusLine: "Vitals in CR3", currentRoom: "CR3", currentStep: "Vitals" },
      ],
    }),

    formBeat({ id: "vitals-form", label: "Nurse vitals form", formId: "vitals", next: "vitals-result", emit: [] }),

    autoBeat({
      id: "vitals-result",
      label: "Vitals result",
      delayMs: 800,
      next: "doctor-enters",
      emit: (ctx) => {
        const v = ctx.formValues?.vitals ?? {};
        return [
          botMsg({
            author: "PodBot",
            ts: "10:08",
            text: `🩺 Vitals · BP ${v.bp_sys ?? 138}/${v.bp_dia ?? 88} (slightly elevated) · Pulse ${v.pulse ?? 82} · Weight ${v.weight ?? 89}kg (+1.2 vs last visit) · Temp ${v.temp ?? 36.8}°C`,
            blocks: [
              {
                type: "alert",
                alert: { level: "info", text: { type: "mrkdwn", text: "*Note:* BP trending up vs last consult. Weight gain modest." } },
              },
            ],
          }),
        ];
      },
    }),

    autoBeat({
      id: "doctor-enters",
      label: "Doctor enters; private history",
      delayMs: 900,
      next: "doctor-decision",
      emit: [
        botMsg({
          author: "PodBot",
          ts: "10:12",
          visibleOnlyTo: "dr.meera",
          text: "*R. Kumar — patient history (Dr. Meera only)*\n• Persistent reflux 3 months, worse post 22:00 meals\n• OTC PPI 2 weeks (mild relief)\n• No alarm features\n• No imaging\n• Diet: late dinners, frequent eating out",
        }),
      ],
    }),

    buttonBeat({
      id: "doctor-decision",
      label: "Doctor decides path",
      emit: [
        botMsg({ author: "PodBot", ts: "10:13", text: "@dr.meera — choose how to proceed." }),
      ],
      buttons: [
        { label: "Instant treatment", style: "primary", nextBeatId: "instant-treatment" },
        { label: "Need test", nextBeatId: "test-menu" },
        { label: "Time-taking test (lab)", nextBeatId: "lab-test" },
      ],
    }),

    autoBeat({
      id: "instant-treatment",
      label: "Doctor treats without test",
      delayMs: 700,
      next: "doctor-wrap",
      emit: [
        botMsg({ author: "PodBot", ts: "10:14", text: "📝 Doctor opting for empirical treatment first; re-evaluate in 2 weeks." }),
      ],
    }),

    autoBeat({
      id: "lab-test",
      label: "Lab order placed",
      delayMs: 700,
      next: "doctor-wrap",
      emit: [
        botMsg({
          author: "PodBot",
          ts: "10:14",
          text: "🧪 Lab order placed: H. pylori breath test · samples scheduled for tomorrow 09:00 (separate visit).",
        }),
      ],
    }),

    buttonBeat({
      id: "test-menu",
      label: "Instant test menu",
      emit: [
        botMsg({ author: "PodBot", ts: "10:14", text: "Choose an in-room instant test:" }),
      ],
      buttons: [
        { label: "ECG", nextBeatId: "ecg-run" },
        { label: "Sonography", style: "primary", nextBeatId: "sono-cart" },
        { label: "BP repeat", nextBeatId: "bp-repeat" },
      ],
    }),

    autoBeat({
      id: "ecg-run",
      label: "ECG run",
      delayMs: 800,
      next: "doctor-wrap",
      emit: [
        botMsg({ author: "PodBot", ts: "10:18", text: "📊 ECG complete · sinus rhythm, no ischemic changes." }),
      ],
    }),

    autoBeat({
      id: "bp-repeat",
      label: "BP repeat",
      delayMs: 800,
      next: "doctor-wrap",
      emit: [
        botMsg({ author: "PodBot", ts: "10:18", text: "🩺 BP repeat · 132/84 · settled with rest." }),
      ],
    }),

    autoBeat({
      id: "sono-cart",
      label: "Sono cart requested",
      delayMs: 700,
      next: "sono-arrived",
      emit: [
        botMsg({
          author: "PodBot",
          ts: "10:15",
          text: "🛒 Portable sonography cart requested · @aditi.bhat dispatched to CR3 with cart.",
        }),
      ],
      sideEffects: [{ type: "addChannelMember", handle: "aditi.bhat" }],
    }),

    autoBeat({
      id: "sono-arrived",
      label: "Sono arrived, scanning",
      delayMs: 1200,
      next: "sono-finding",
      emit: [
        botMsg({
          author: "PodBot",
          ts: "10:22",
          text: "🩻 @aditi.bhat at CR3, scanning upper abdomen with Dr. Meera present.",
        }),
      ],
    }),

    autoBeat({
      id: "sono-finding",
      label: "In-room sono finding",
      delayMs: 1500,
      next: "doctor-wrap",
      emit: [
        botMsg({
          author: "PodBot",
          ts: "10:32",
          text: "🩻 In-room sono · no gallstones, no significant findings · gastric wall normal.",
          blocks: [
            {
              type: "template_native",
              templateId: "pod-result",
              data: {
                podLabel: "Portable sono (in-room)",
                emoji: "🩻",
                patientInitial: "R. Kumar",
                startedAt: "10:22",
                finishedAt: "10:32",
                technician: "aditi.bhat",
                values: [
                  { label: "Areas", value: "Upper abdomen, gallbladder, gastric wall" },
                  { label: "Findings", value: "Normal" },
                  { label: "Doctor present", value: "Yes — Dr. Meera" },
                ],
              },
            },
          ],
        }),
      ],
    }),

    autoBeat({
      id: "doctor-wrap",
      label: "Doctor wrap-up",
      delayMs: 1200,
      next: "checkout",
      emit: [
        botMsg({
          author: "PodBot",
          ts: "10:38",
          text: "📝 Dr. Meera wrap-up · R. Kumar",
          blocks: [
            {
              type: "card",
              card: {
                icon: "📝",
                title: { type: "plain_text", text: "Dr. Meera · wrap-up" },
                subtitle: { type: "mrkdwn", text: "R. Kumar · acid reflux consult · 10:38" },
                fields: [
                  { label: "Diagnosis", value: "Functional dyspepsia / GERD (no alarm features)" },
                  { label: "Prescription", value: "Pantoprazole 40mg OD × 28 days" },
                  { label: "Lifestyle", value: "Dinner before 21:00 · reduce evening coffee · raise headboard 15cm" },
                  { label: "Follow-up", value: "Tele-consult in 4 weeks (no new visit needed)" },
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
      delayMs: 700,
      next: "close",
      emit: [
        botMsg({
          author: "VisitBot",
          ts: "10:42",
          text: "🛒 Checkout for R. Kumar",
          blocks: [
            {
              type: "template_native",
              templateId: "checkout",
              data: {
                patientInitial: "R. Kumar",
                items: [
                  { label: "Membership · auto-renew on", checked: true },
                  { label: "Pantoprazole 28-day supply added", checked: true },
                  { label: "Tele follow-up booked · 17 Jun 10:00", checked: true },
                ],
                totalVisitDuration: "44m",
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
      emit: [botMsg({ author: "VisitBot", ts: "10:44", text: "✅ Visit closed · 44m total · channel will lock & archive." })],
      sideEffects: [
        { type: "setRoomStatus", room: "CR3", status: "Ready" },
        { type: "lockChannel" },
        { type: "setOpsTodayStatus", statusLine: "Closed", currentStep: "Closed" },
      ],
    }),
  ],
};
