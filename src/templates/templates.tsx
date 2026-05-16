import React from "react";
import { registerTemplate, TemplateDef } from "./registry";
import type { Block, PatientIdentity, Room } from "../types";

// =====================================================================
// visit-card  · capability: both
// =====================================================================

export interface VisitCardData {
  patient: PatientIdentity;
  package?: string;
  concern?: string;
  scheduledTime: string;
  duration?: string;
  refreshment?: string;
  language?: string;
  accessibility?: string[];
  assignedVm?: string;
  assignedDoctor?: string;
  opsAnchor?: string;
  visitType: "screening" | "consulting" | "single-test";
  visitId: string;
}

function VisitCardImage({ data }: { data: VisitCardData }) {
  const { patient } = data;
  return (
    <div className="bg-white border border-slack-border rounded-md w-[560px] overflow-hidden">
      <div className="bg-acko-warm px-5 py-3 border-b border-slack-border flex items-baseline justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-acko-sageDark font-bold">
            {data.visitType === "screening" ? "Annual Screening" : data.visitType === "consulting" ? "Consultation" : "Single Test"}
          </div>
          <div className="text-[18px] font-extrabold text-slack-textPrimary">
            {patient.firstName} {patient.lastName}, {patient.age}{patient.gender}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[11px] text-slack-textSecondary">Scheduled</div>
          <div className="text-[15px] font-bold">{data.scheduledTime}</div>
        </div>
      </div>
      <div className="px-5 py-3 grid grid-cols-2 gap-x-6 gap-y-2 text-[13px]">
        {data.package && <Field label="Package" value={data.package} />}
        {data.concern && <Field label="Concern" value={data.concern} />}
        {data.duration && <Field label="Expected duration" value={data.duration} />}
        {data.refreshment && <Field label="Refreshment" value={data.refreshment} />}
        {data.language && <Field label="Language" value={data.language} />}
        {data.accessibility && data.accessibility.length > 0 && (
          <Field label="Accessibility" value={data.accessibility.join(", ")} />
        )}
        <Field label="Member" value={patient.member ? `Yes · since ${patient.memberSince ?? "—"}` : "No"} />
        {data.assignedVm && <Field label="Visit Manager" value={`@${data.assignedVm}`} />}
        {data.assignedDoctor && <Field label="Doctor" value={`@${data.assignedDoctor}`} />}
        {data.opsAnchor && <Field label="Ops anchor" value={`@${data.opsAnchor}`} />}
      </div>
      <div className="px-5 py-2 bg-acko-warm/40 border-t border-slack-border text-[11px] text-slack-textSecondary">
        Visit ID · <code className="font-mono">{data.visitId}</code>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-slack-textSecondary font-semibold">{label}</div>
      <div className="text-slack-textPrimary">{value}</div>
    </div>
  );
}

const visitCardTemplate: TemplateDef<VisitCardData> = {
  id: "visit-card",
  capability: "both",
  ImageComponent: VisitCardImage,
  defaultFilename: "visit-card.png",
  defaultAlt: "Pinned visit card",
  toNativeBlocks: (d) => {
    const fields: { label: string; value: string }[] = [
      { label: "Type", value: d.visitType === "screening" ? "Annual Screening" : d.visitType === "consulting" ? "Consultation" : "Single Test" },
      { label: "Scheduled", value: d.scheduledTime },
    ];
    if (d.package) fields.push({ label: "Package", value: d.package });
    if (d.concern) fields.push({ label: "Concern", value: d.concern });
    if (d.duration) fields.push({ label: "Expected duration", value: d.duration });
    if (d.refreshment) fields.push({ label: "Refreshment", value: d.refreshment });
    if (d.language) fields.push({ label: "Language", value: d.language });
    if (d.accessibility?.length) fields.push({ label: "Accessibility", value: d.accessibility.join(", ") });
    fields.push({ label: "Member", value: d.patient.member ? `Yes · since ${d.patient.memberSince ?? "—"}` : "No" });
    if (d.assignedVm) fields.push({ label: "Visit Manager", value: `@${d.assignedVm}` });
    if (d.assignedDoctor) fields.push({ label: "Doctor", value: `@${d.assignedDoctor}` });
    if (d.opsAnchor) fields.push({ label: "Ops anchor", value: `@${d.opsAnchor}` });

    return [
      {
        type: "card",
        card: {
          icon: "📋",
          title: { type: "plain_text", text: `${d.patient.firstName} ${d.patient.lastName}, ${d.patient.age}${d.patient.gender}` },
          subtitle: {
            type: "mrkdwn",
            text: `${d.visitType === "screening" ? "Annual screening" : d.visitType === "consulting" ? "Consultation" : "Single diagnostic test"} · *${d.scheduledTime}*`,
          },
          fields,
        },
      },
      { type: "context", elements: [{ type: "mrkdwn", text: `Visit ID · \`${d.visitId}\`` }] },
    ];
  },
};

// =====================================================================
// pod-result · capability: both
// =====================================================================

export interface PodResultData {
  podLabel: string;
  emoji: string;
  patientInitial: string;
  startedAt: string;
  finishedAt: string;
  technician: string;
  values: { label: string; value: string }[];
  cues?: string[];
  flags?: string[]; // e.g. "BP slightly elevated"
  nextPod?: string;
}

function PodResultImage({ data }: { data: PodResultData }) {
  return (
    <div className="bg-white border border-slack-border rounded-md w-[540px] overflow-hidden">
      <div className="px-5 py-3 border-b border-slack-border flex items-start gap-3">
        <div className="text-2xl">{data.emoji}</div>
        <div className="flex-1">
          <div className="font-extrabold text-[15px] text-slack-textPrimary">
            {data.podLabel} complete
          </div>
          <div className="text-[12px] text-slack-textSecondary">
            {data.patientInitial} · {data.startedAt}–{data.finishedAt} · @{data.technician}
          </div>
        </div>
      </div>
      <div className="px-5 py-3">
        <div className="grid grid-cols-2 gap-x-5 gap-y-1.5 text-[13px]">
          {data.values.map((v, i) => (
            <div key={i} className="flex justify-between border-b border-slack-divider/70 py-0.5">
              <span className="text-slack-textSecondary">{v.label}</span>
              <span className="font-mono font-semibold text-slack-textPrimary">{v.value}</span>
            </div>
          ))}
        </div>
        {data.flags && data.flags.length > 0 && (
          <div className="mt-3 px-2 py-1.5 bg-amber-50 border border-amber-300 rounded text-[12px] text-amber-900">
            <strong>Flags:</strong> {data.flags.join(" · ")}
          </div>
        )}
        {data.cues && data.cues.length > 0 && (
          <div className="mt-2 text-[12px] text-slack-textSecondary">
            <strong>Comfort cues confirmed:</strong> {data.cues.join(" · ")}
          </div>
        )}
      </div>
      {data.nextPod && (
        <div className="px-5 py-2 bg-acko-warm/40 border-t border-slack-border text-[12px] text-slack-textPrimary">
          ⏭ Next: <strong>{data.nextPod}</strong>
        </div>
      )}
    </div>
  );
}

const podResultTemplate: TemplateDef<PodResultData> = {
  id: "pod-result",
  capability: "both",
  ImageComponent: PodResultImage,
  defaultFilename: "pod-result.png",
  defaultAlt: "Pod result summary",
  toNativeBlocks: (d) => {
    const blocks: Block[] = [
      {
        type: "card",
        card: {
          icon: d.emoji,
          title: { type: "plain_text", text: `${d.podLabel} complete` },
          subtitle: { type: "mrkdwn", text: `${d.patientInitial} · ${d.startedAt}–${d.finishedAt} · @${d.technician}` },
        },
      },
      {
        type: "table",
        header: ["Field", "Value"],
        rows: d.values.map((v) => [v.label, `\`${v.value}\``]),
      },
    ];
    if (d.flags && d.flags.length > 0) {
      blocks.push({ type: "alert", alert: { level: "warning", text: { type: "mrkdwn", text: `*Flags:* ${d.flags.join(" · ")}` } } });
    }
    if (d.cues && d.cues.length > 0) {
      blocks.push({ type: "context", elements: [{ type: "mrkdwn", text: `Comfort cues confirmed · ${d.cues.join(" · ")}` }] });
    }
    if (d.nextPod) {
      blocks.push({ type: "section", text: { type: "mrkdwn", text: `⏭ Next: *${d.nextPod}*` } });
    }
    return blocks;
  },
};

// =====================================================================
// escalation · capability: both
// =====================================================================

export interface EscalationData {
  level: "warning" | "error";
  title: string;
  detail: string;
  context?: string;
}

function EscalationImage({ data }: { data: EscalationData }) {
  const isError = data.level === "error";
  return (
    <div
      className={`border rounded-md w-[520px] overflow-hidden ${
        isError ? "border-red-400" : "border-amber-400"
      }`}
    >
      <div className={`px-5 py-2 text-white font-extrabold text-[13px] uppercase tracking-wider ${isError ? "bg-red-600" : "bg-amber-600"}`}>
        {isError ? "🚨 Escalation" : "⚠ Caution"}
      </div>
      <div className="px-5 py-3 bg-white">
        <div className="font-extrabold text-[15px] text-slack-textPrimary">{data.title}</div>
        <div className="mt-1 text-[13px] text-slack-textPrimary">{data.detail}</div>
        {data.context && (
          <div className="mt-2 text-[11px] text-slack-textSecondary uppercase tracking-wide">{data.context}</div>
        )}
      </div>
    </div>
  );
}

const escalationTemplate: TemplateDef<EscalationData> = {
  id: "escalation",
  capability: "both",
  ImageComponent: EscalationImage,
  defaultFilename: "escalation.png",
  defaultAlt: "Escalation",
  toNativeBlocks: (d) => [
    {
      type: "alert",
      alert: {
        level: d.level,
        text: { type: "mrkdwn", text: `*${d.title}*\n${d.detail}${d.context ? `\n_${d.context}_` : ""}` },
      },
    },
  ],
};

// =====================================================================
// checkout · capability: both
// =====================================================================

export interface CheckoutData {
  patientInitial: string;
  items: { label: string; checked: boolean }[];
  totalVisitDuration?: string;
  notes?: string;
}

function CheckoutImage({ data }: { data: CheckoutData }) {
  return (
    <div className="bg-white border border-slack-border rounded-md w-[540px] overflow-hidden">
      <div className="px-5 py-3 border-b border-slack-border">
        <div className="font-extrabold text-[15px] flex items-center gap-2">
          🛒 Checkout — {data.patientInitial}
        </div>
        <div className="text-[12px] text-slack-textSecondary">Tick off each item before closing the visit.</div>
      </div>
      <div className="px-5 py-3">
        <ul className="space-y-1.5 text-[14px]">
          {data.items.map((it, i) => (
            <li key={i} className="flex items-center gap-2">
              <span
                className={`inline-flex w-4 h-4 rounded border ${
                  it.checked ? "bg-acko-sage border-acko-sageDark text-white" : "bg-white border-slack-border"
                } items-center justify-center text-[11px]`}
              >
                {it.checked ? "✓" : ""}
              </span>
              <span className={it.checked ? "" : "text-slack-textSecondary"}>{it.label}</span>
            </li>
          ))}
        </ul>
        {data.notes && <div className="mt-3 text-[12px] text-slack-textSecondary">{data.notes}</div>}
      </div>
      {data.totalVisitDuration && (
        <div className="px-5 py-2 bg-acko-warm/40 border-t border-slack-border text-[12px]">
          Total visit time · <strong>{data.totalVisitDuration}</strong>
        </div>
      )}
    </div>
  );
}

const checkoutTemplate: TemplateDef<CheckoutData> = {
  id: "checkout",
  capability: "both",
  ImageComponent: CheckoutImage,
  defaultFilename: "checkout.png",
  defaultAlt: "Checkout tick-list",
  toNativeBlocks: (d) => [
    {
      type: "card",
      card: {
        icon: "🛒",
        title: { type: "plain_text", text: `Checkout — ${d.patientInitial}` },
        subtitle: { type: "mrkdwn", text: "Tick off each item before closing the visit." },
        body: {
          type: "mrkdwn",
          text: d.items.map((it) => `${it.checked ? "✅" : "▢"} ${it.label}`).join("\n"),
        },
      },
    },
    ...(d.totalVisitDuration
      ? [{ type: "context", elements: [{ type: "mrkdwn" as const, text: `Total visit time · *${d.totalVisitDuration}*` }] } as Block]
      : []),
  ],
};

// =====================================================================
// morning-digest · capability: both
// =====================================================================

export interface MorningDigestData {
  date: string;
  recipient: string;
  visits: { time: string; patientInitial: string; type: string; package?: string; channelName: string }[];
}

function MorningDigestImage({ data }: { data: MorningDigestData }) {
  return (
    <div className="bg-white border border-slack-border rounded-md w-[520px] overflow-hidden">
      <div className="px-5 py-3 bg-acko-warm border-b border-slack-border">
        <div className="font-extrabold text-[15px]">☀ Morning digest · {data.date}</div>
        <div className="text-[12px] text-slack-textSecondary">For @{data.recipient} · {data.visits.length} visits today</div>
      </div>
      <div className="px-5 py-3 space-y-2">
        {data.visits.map((v, i) => (
          <div key={i} className="flex items-center gap-3 text-[13px] border-b border-slack-divider pb-1.5 last:border-b-0">
            <span className="font-mono font-bold w-12">{v.time}</span>
            <span className="font-semibold">{v.patientInitial}</span>
            <span className="text-slack-textSecondary">· {v.type}{v.package ? ` · ${v.package}` : ""}</span>
            <span className="ml-auto text-[11px] text-acko-sageDark">#{v.channelName}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const morningDigestTemplate: TemplateDef<MorningDigestData> = {
  id: "morning-digest",
  capability: "both",
  ImageComponent: MorningDigestImage,
  defaultFilename: "morning-digest.png",
  defaultAlt: "Morning digest",
  toNativeBlocks: (d) => [
    { type: "header", text: { type: "plain_text", text: `☀ Morning digest · ${d.date}` } },
    { type: "context", elements: [{ type: "mrkdwn", text: `For @${d.recipient} · ${d.visits.length} visits today` }] },
    { type: "divider" },
    ...d.visits.map(
      (v) =>
        ({
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*${v.time}* · *${v.patientInitial}* · ${v.type}${v.package ? ` · ${v.package}` : ""} · #${v.channelName}`,
          },
        } as Block)
    ),
  ],
};

// =====================================================================
// ops-today-row · capability: both
// =====================================================================

export interface OpsRowData {
  patientInitial: string;
  visitType: string;
  currentRoom?: string;
  currentStep?: string;
  statusLine: string;
  startedAt?: string;
  elapsed?: string;
  channelName: string;
}

function OpsRowImage({ data }: { data: OpsRowData }) {
  return (
    <div className="bg-white border border-slack-border rounded-md w-[640px] px-4 py-2 flex items-center gap-4">
      <div className="font-bold text-[14px]">{data.patientInitial}</div>
      <div className="text-[12px] text-slack-textSecondary uppercase tracking-wide w-24">{data.visitType}</div>
      <div className="text-[12px] flex-1">
        {data.currentRoom && (
          <span className="font-semibold mr-2">{data.currentRoom}</span>
        )}
        <span>{data.statusLine}</span>
      </div>
      <div className="text-[11px] text-slack-textSecondary">{data.elapsed}</div>
      <div className="text-[11px] text-acko-sageDark">#{data.channelName}</div>
    </div>
  );
}

const opsRowTemplate: TemplateDef<OpsRowData> = {
  id: "ops-today-row",
  capability: "both",
  ImageComponent: OpsRowImage,
  defaultFilename: "ops-today-row.png",
  defaultAlt: "Ops-today live row",
  toNativeBlocks: (d) => [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*${d.patientInitial}* · _${d.visitType}_ · ${d.currentRoom ? `*${d.currentRoom}* · ` : ""}${d.statusLine}`,
      },
    },
    {
      type: "context",
      elements: [
        { type: "mrkdwn", text: `#${d.channelName}${d.elapsed ? ` · elapsed ${d.elapsed}` : ""}${d.startedAt ? ` · started ${d.startedAt}` : ""}` },
      ],
    },
  ],
};

// =====================================================================
// screening-report · IMAGE ONLY
// =====================================================================

export interface ScreeningReportData {
  patientInitial: string;
  pods: { name: string; status: "ok" | "flag" | "skipped"; summary: string }[];
  bodyHighlights?: { area: string; finding: string }[];
  scoreOutOf: number;
  score: number;
}

function ScreeningReportImage({ data }: { data: ScreeningReportData }) {
  return (
    <div className="bg-white border border-slack-border rounded-md w-[640px] overflow-hidden">
      <div className="px-5 py-3 bg-acko-warm border-b border-slack-border">
        <div className="font-extrabold text-[16px]">Screening Report · {data.patientInitial}</div>
        <div className="text-[12px] text-slack-textSecondary">Pod-by-pod summary with body highlights</div>
      </div>
      <div className="grid grid-cols-[1fr,1fr] gap-4 p-5">
        <div>
          <div className="text-[12px] uppercase tracking-wide text-slack-textSecondary mb-2">Body highlights</div>
          <div className="relative bg-acko-warm/40 rounded-md h-[260px] overflow-hidden border border-slack-divider">
            <svg viewBox="0 0 100 220" className="w-full h-full">
              <ellipse cx="50" cy="22" rx="16" ry="20" fill="#E8D9C8" />
              <path d="M30 50 L70 50 L78 130 L70 200 L30 200 L22 130 Z" fill="#E8D9C8" />
              <rect x="14" y="55" width="14" height="55" rx="6" fill="#E8D9C8" />
              <rect x="72" y="55" width="14" height="55" rx="6" fill="#E8D9C8" />
              {data.bodyHighlights?.map((h, i) => {
                const xy: Record<string, { x: number; y: number }> = {
                  heart: { x: 42, y: 75 },
                  chest: { x: 50, y: 70 },
                  abdomen: { x: 50, y: 105 },
                  pelvis: { x: 50, y: 130 },
                  head: { x: 50, y: 22 },
                  eyes: { x: 46, y: 20 },
                  mouth: { x: 50, y: 30 },
                };
                const k = h.area.toLowerCase();
                const p = xy[k] ?? { x: 50, y: 60 + i * 30 };
                return (
                  <g key={i}>
                    <circle cx={p.x} cy={p.y} r="3" fill="#D72638" />
                    <line x1={p.x} y1={p.y} x2="92" y2={40 + i * 28} stroke="#D72638" strokeWidth="0.5" />
                    <text x="93" y={42 + i * 28} fontSize="5" fill="#5a3030">
                      {h.area}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
          <div className="mt-2 space-y-0.5 text-[11px]">
            {data.bodyHighlights?.map((h, i) => (
              <div key={i}>
                <span className="font-bold text-red-700">●</span> <strong>{h.area}:</strong> {h.finding}
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="text-[12px] uppercase tracking-wide text-slack-textSecondary mb-2">Pod results</div>
          <div className="space-y-1 text-[12px]">
            {data.pods.map((p, i) => (
              <div
                key={i}
                className={`flex items-center justify-between px-2 py-1 rounded border ${
                  p.status === "ok"
                    ? "border-green-300 bg-green-50"
                    : p.status === "flag"
                    ? "border-amber-300 bg-amber-50"
                    : "border-gray-300 bg-gray-50"
                }`}
              >
                <span className="font-semibold">{p.name}</span>
                <span className="text-[11px] text-slack-textSecondary">{p.summary}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 px-3 py-2 bg-acko-warm/60 rounded-md border border-slack-border">
            <div className="text-[11px] uppercase text-slack-textSecondary">Wellness score</div>
            <div className="text-[24px] font-extrabold leading-none">
              {data.score}
              <span className="text-[14px] text-slack-textSecondary"> / {data.scoreOutOf}</span>
            </div>
            <div className="mt-1.5 h-2 rounded-full bg-slack-divider overflow-hidden">
              <div
                className="h-full bg-acko-sage"
                style={{ width: `${(data.score / data.scoreOutOf) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const screeningReportTemplate: TemplateDef<ScreeningReportData> = {
  id: "screening-report",
  capability: "image-only",
  ImageComponent: ScreeningReportImage,
  defaultFilename: "screening-report.png",
  defaultAlt: "Post-screening pod-by-pod report with body silhouette",
};

// =====================================================================
// floor-board-snapshot · IMAGE ONLY
// =====================================================================

export interface FloorBoardSnapshotData {
  rooms: Pick<Room, "id" | "label" | "kind" | "status" | "occupantInitials" | "lastEvent">[];
  capturedAt: string;
}

function FloorBoardSnapshotImage({ data }: { data: FloorBoardSnapshotData }) {
  const groups: { title: string; kind: Room["kind"] }[] = [
    { title: "Diagnostic pods", kind: "diagnostic" },
    { title: "Personal pods", kind: "personal" },
    { title: "Consult rooms", kind: "consult" },
  ];
  const color = (s: string) =>
    s === "Ready" ? "bg-green-100 border-green-400 text-green-900" : s === "Occupied" ? "bg-amber-100 border-amber-400 text-amber-900" : "bg-red-100 border-red-400 text-red-900";
  return (
    <div className="bg-white border border-slack-border rounded-md w-[680px] overflow-hidden">
      <div className="px-5 py-3 bg-acko-warm border-b border-slack-border flex items-baseline justify-between">
        <div className="font-extrabold text-[15px]">Floor board snapshot</div>
        <div className="text-[12px] text-slack-textSecondary">captured at {data.capturedAt}</div>
      </div>
      <div className="p-4 space-y-3">
        {groups.map((g) => (
          <div key={g.kind}>
            <div className="text-[11px] uppercase tracking-wide text-slack-textSecondary mb-1">{g.title}</div>
            <div className="grid grid-cols-3 gap-2">
              {data.rooms
                .filter((r) => r.kind === g.kind)
                .map((r) => (
                  <div key={r.id} className={`border rounded px-2 py-1.5 text-[12px] ${color(r.status)}`}>
                    <div className="font-bold">{r.label}</div>
                    <div className="text-[11px]">{r.status}{r.occupantInitials ? ` · ${r.occupantInitials}` : ""}{r.lastEvent ? ` · ${r.lastEvent}` : ""}</div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const floorBoardSnapshotTemplate: TemplateDef<FloorBoardSnapshotData> = {
  id: "floor-board-snapshot",
  capability: "image-only",
  ImageComponent: FloorBoardSnapshotImage,
  defaultFilename: "floor-board.png",
  defaultAlt: "Floor board snapshot",
};

// =====================================================================
// Registration
// =====================================================================

let registered = false;
export function registerAllTemplates() {
  if (registered) return;
  registered = true;
  registerTemplate(visitCardTemplate);
  registerTemplate(podResultTemplate);
  registerTemplate(escalationTemplate);
  registerTemplate(checkoutTemplate);
  registerTemplate(morningDigestTemplate);
  registerTemplate(opsRowTemplate);
  registerTemplate(screeningReportTemplate);
  registerTemplate(floorBoardSnapshotTemplate);
}
