import type { FormSpec } from "../types";

// Each pod's intake form. The form spec drives the modal.
// Branch buttons let the technician escalate (Vein not found, Machine down, etc.)
// which routes the scenario to a non-default beat.

export const FORMS: Record<string, FormSpec> = {
  cardiac: {
    id: "cardiac",
    title: "Cardiac pod intake",
    submitLabel: "Submit reading",
    branchButtons: [
      { label: "Vein not found (1st)", style: "danger", nextBeatId: "branch-blood-1" },
      { label: "Machine down", style: "danger", nextBeatId: "branch-machine" },
    ],
    fields: [
      { id: "bp_sys", label: "BP systolic", type: "number", default: 128, inline: true },
      { id: "bp_dia", label: "BP diastolic", type: "number", default: 84, inline: true },
      { id: "pulse", label: "Pulse", type: "number", default: 76, inline: true },
      { id: "position", label: "Position", type: "select", options: ["Sitting", "Supine", "Standing"], default: "Sitting" },
      { id: "abnormal", label: "Abnormal flag", type: "checkbox" },
      { id: "vein_quality", label: "Vein quality", type: "select", options: ["Excellent", "Good", "Faint", "Difficult"], default: "Good" },
      { id: "needle", label: "Needle type", type: "select", options: ["21G butterfly", "22G straight", "23G butterfly"], default: "21G butterfly" },
      { id: "attempts", label: "Attempts", type: "number", default: 1, inline: true },
      { id: "samples", label: "Sample IDs (to lab)", type: "text", default: "S-0418A, S-0418B, S-0418C" },
      { id: "comfort_water", label: "Water offered", type: "checkbox", default: true },
      { id: "comfort_music", label: "Music selection confirmed", type: "checkbox", default: true },
      { id: "comfort_sealed", label: "Sealed sample kit shown", type: "checkbox", default: true },
      { id: "omega3", label: "Omega-3 cross-sell", type: "select", options: ["Not offered", "Declined", "Accepted (added to cart)"], default: "Declined" },
    ],
  },
  ct: {
    id: "ct",
    title: "CT pod intake",
    branchButtons: [{ label: "Machine down", style: "danger", nextBeatId: "branch-machine" }],
    fields: [
      { id: "eye_mask", label: "Eye mask given", type: "checkbox", default: true },
      { id: "ear_plugs", label: "Ear plugs given", type: "checkbox", default: true },
      { id: "blanket", label: "Blanket offered", type: "checkbox", default: true },
      { id: "image_quality", label: "Image quality", type: "select", options: ["OK", "Re-shoot", "Poor"], default: "OK" },
      { id: "notes", label: "Tech notes", type: "textarea", placeholder: "Optional" },
    ],
  },
  oral: {
    id: "oral",
    title: "Oral pod intake",
    fields: [
      { id: "cleaning", label: "Cleaning needed", type: "checkbox", default: true },
      { id: "rec", label: "Treatment recommendation", type: "textarea", default: "Scaling and polishing within 2 weeks." },
      { id: "urgency", label: "Urgency", type: "select", options: ["Routine", "Soon", "Urgent"], default: "Soon" },
    ],
  },
  sensory: {
    id: "sensory",
    title: "Sensory pod intake",
    fields: [
      { id: "vision_l", label: "Vision (left)", type: "text", default: "6/9" },
      { id: "vision_r", label: "Vision (right)", type: "text", default: "6/6" },
      { id: "vision_flag", label: "Vision flag", type: "select", options: ["Normal", "Near", "Far", "Both"], default: "Normal" },
      { id: "hear_l", label: "Hearing dB threshold (L)", type: "number", default: 20 },
      { id: "hear_r", label: "Hearing dB threshold (R)", type: "number", default: 18 },
      { id: "conductivity", label: "Conductivity flag", type: "checkbox" },
    ],
  },
  bodyComposition: {
    id: "bodyComposition",
    title: "Body Composition pod intake",
    fields: [
      { id: "scan_ok", label: "Scan complete", type: "checkbox", default: true },
      { id: "fat", label: "Body fat %", type: "number", default: 26 },
      { id: "lean", label: "Lean mass (kg)", type: "number", default: 41 },
      { id: "bone", label: "Bone density flag", type: "select", options: ["Normal", "Low-normal", "Low"], default: "Normal" },
    ],
  },
  functional: {
    id: "functional",
    title: "Functional pod intake",
    fields: [
      { id: "cognitive", label: "Cognitive score (0-30)", type: "number", default: 28 },
      { id: "grip_l", label: "Grip strength L (kg)", type: "number", default: 24 },
      { id: "grip_r", label: "Grip strength R (kg)", type: "number", default: 27 },
      { id: "mobility", label: "Mobility score (0-10)", type: "number", default: 8 },
      { id: "balance", label: "Balance flag", type: "checkbox" },
    ],
  },
  sonography: {
    id: "sonography",
    title: "Sonography pod intake",
    branchButtons: [
      { label: "Call doctor (flagged finding)", style: "danger", nextBeatId: "sono-flag-doctor" },
    ],
    fields: [
      { id: "areas", label: "Areas scanned (comma)", type: "text", default: "Abdomen, Pelvis, Thyroid" },
      { id: "findings", label: "Findings", type: "select", options: ["Normal", "Incidental — note only", "Call doctor"], default: "Normal" },
      { id: "notes", label: "Notes", type: "textarea", placeholder: "Optional" },
    ],
  },
  cervical: {
    id: "cervical",
    title: "Cervical pod intake",
    fields: [
      { id: "self_insertion", label: "Self-insertion preference offered", type: "checkbox", default: true },
      { id: "small_speculum", label: "Smaller speculum used", type: "checkbox", default: true },
      { id: "comm", label: "Communication cue confirmed", type: "checkbox", default: true },
      { id: "samples", label: "Sample IDs", type: "text", default: "S-0419H, S-0419I" },
    ],
  },
  mammography: {
    id: "mammography",
    title: "Mammography pod intake",
    fields: [
      { id: "cycle", label: "Cycle phase asked", type: "checkbox", default: true },
      { id: "lady_tech", label: "Lady technician confirmed", type: "checkbox", default: true },
      { id: "warm_plates", label: "Warm plates confirmed", type: "checkbox", default: true },
      { id: "image", label: "Image auto-check", type: "select", options: ["OK", "Retake L", "Retake R", "Retake both"], default: "OK" },
    ],
  },
  vitals: {
    id: "vitals",
    title: "Nurse vitals",
    fields: [
      { id: "bp_sys", label: "BP systolic", type: "number", default: 136, inline: true },
      { id: "bp_dia", label: "BP diastolic", type: "number", default: 88, inline: true },
      { id: "pulse", label: "Pulse", type: "number", default: 80, inline: true },
      { id: "height", label: "Height (cm)", type: "number", default: 178, inline: true },
      { id: "weight", label: "Weight (kg)", type: "number", default: 89, inline: true },
      { id: "temp", label: "Temperature (°C)", type: "number", default: 36.7, inline: true },
    ],
  },
  walkin: {
    id: "walkin",
    title: "Walk-in / Add patient",
    submitLabel: "Create visit",
    fields: [
      { id: "first", label: "First name", type: "text", required: true, default: "S." },
      { id: "last", label: "Last name", type: "text", required: true, default: "Mehta" },
      { id: "phone", label: "Phone", type: "text", required: true, default: "+91 98••• ••••" },
      { id: "gender", label: "Gender", type: "select", options: ["F", "M", "Other"], default: "F" },
      { id: "age", label: "Age", type: "number", default: 45 },
      { id: "visit_type", label: "Visit type", type: "select", options: ["Consultation", "Single test", "Screening"], default: "Consultation" },
      { id: "concern", label: "Concern / package", type: "text", default: "Persistent cough x 3 weeks" },
      { id: "member", label: "ACKO member", type: "checkbox" },
    ],
  },
  followup: {
    id: "followup",
    title: "Follow-up window",
    fields: [{ id: "window", label: "Window", type: "select", options: ["Within 1 week", "2–4 weeks", "1–3 months"], default: "2–4 weeks" }],
  },
  exit: {
    id: "exit",
    title: "Patient leaving early",
    fields: [
      { id: "reason", label: "Reason", type: "select", options: ["Discomfort", "Time pressure", "Personal emergency", "Other"], default: "Time pressure" },
      { id: "resched", label: "Reschedule preference", type: "select", options: ["Same week", "Next week", "Will book later"], default: "Same week" },
      { id: "callback", label: "Schedule 24h follow-up call", type: "checkbox", default: true },
    ],
  },
};
