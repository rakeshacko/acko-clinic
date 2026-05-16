import type {
  Channel,
  Room,
  Staff,
  StaffHandle,
} from "./types";

export const STAFF: Staff[] = [
  { handle: "kavya.rao", name: "Kavya Rao", role: "vm", roleLabel: "Visit Manager", avatarColor: "#7BA694" },
  { handle: "anjali.pillai", name: "Anjali Pillai", role: "fc", roleLabel: "Floating Concierge", avatarColor: "#E0A458" },
  { handle: "rohit.iyer", name: "Rohit Iyer", role: "fm", roleLabel: "Floor Manager / Ops Anchor", avatarColor: "#5B8FB9" },
  { handle: "dr.anand", name: "Dr. Anand", role: "doctor", roleLabel: "Doctor (GP)", avatarColor: "#C56A77" },
  { handle: "dr.meera", name: "Dr. Meera", role: "doctor", roleLabel: "Doctor (GP)", avatarColor: "#9B72CF" },
  { handle: "dr.priya", name: "Dr. Priya", role: "doctor", roleLabel: "Doctor (GP)", avatarColor: "#C58C5A" },
  { handle: "geetha.murthy", name: "Geetha Murthy", role: "nurse", roleLabel: "Nurse", avatarColor: "#E89AB5" },
  { handle: "sneha.reddy", name: "Sneha Reddy", role: "tech", roleLabel: "Cardiac technician", pod: "Cardiac", avatarColor: "#D2727A" },
  { handle: "ananya.sen", name: "Ananya Sen", role: "tech", roleLabel: "CT technician", pod: "CT", avatarColor: "#7CA9CB" },
  { handle: "vikram.joshi", name: "Vikram Joshi", role: "tech", roleLabel: "Oral technician", pod: "Oral", avatarColor: "#A2C579" },
  { handle: "nikhil.menon", name: "Nikhil Menon", role: "tech", roleLabel: "Sensory technician", pod: "Sensory", avatarColor: "#6BBFA4" },
  { handle: "farah.sheikh", name: "Farah Sheikh", role: "tech", roleLabel: "Body composition technician", pod: "BodyComposition", avatarColor: "#D69ECC" },
  { handle: "deepak.varma", name: "Deepak Varma", role: "tech", roleLabel: "Functional technician", pod: "Functional", avatarColor: "#8FA8BD" },
  { handle: "aditi.bhat", name: "Aditi Bhat", role: "tech", roleLabel: "Sonography technician", pod: "Sonography", avatarColor: "#C9A86A" },
  { handle: "maya.naidu", name: "Maya Naidu", role: "tech", roleLabel: "Cervical technician", pod: "Cervical", avatarColor: "#B782B0" },
  { handle: "reshma.qureshi", name: "Reshma Qureshi", role: "tech", roleLabel: "Mammography technician", pod: "Mammography", avatarColor: "#7CB7B0" },
];

export function getStaff(handle: StaffHandle): Staff | undefined {
  return STAFF.find((s) => s.handle === handle);
}

export const TECH_BY_POD: Record<string, StaffHandle> = STAFF.reduce(
  (acc, s) => {
    if (s.pod) acc[s.pod] = s.handle;
    return acc;
  },
  {} as Record<string, StaffHandle>
);

// All initial rooms in their starting state.
export function seedRooms(): Room[] {
  const diag = [
    { id: "Cardiac", label: "Cardiac pod" },
    { id: "CT", label: "CT pod" },
    { id: "Oral", label: "Oral pod" },
    { id: "Sensory", label: "Sensory pod" },
    { id: "BodyComposition", label: "Body Composition pod" },
    { id: "Functional", label: "Functional pod" },
    { id: "Sonography", label: "Sonography pod" },
    { id: "Cervical", label: "Cervical pod" },
    { id: "Mammography", label: "Mammography pod" },
  ] as const;
  const personal = [
    { id: "PP1", label: "Personal pod 1" },
    { id: "PP2", label: "Personal pod 2" },
    { id: "PP3", label: "Personal pod 3" },
    { id: "PP4", label: "Personal pod 4" },
  ] as const;
  const consult = [
    { id: "CR1", label: "Consult room 1" },
    { id: "CR2", label: "Consult room 2" },
    { id: "CR3", label: "Consult room 3" },
  ] as const;

  const rooms: Room[] = [
    ...diag.map((d) => ({ id: d.id, label: d.label, kind: "diagnostic" as const, status: "Ready" as const })),
    ...personal.map((p) => ({ id: p.id, label: p.label, kind: "personal" as const, status: "Ready" as const })),
    ...consult.map((c) => ({ id: c.id, label: c.label, kind: "consult" as const, status: "Ready" as const })),
    { id: "Lobby", label: "Lobby / Welcome", kind: "lobby", status: "Ready" },
  ];
  return rooms;
}

const everyone = STAFF.map((s) => s.handle);

export function seedChannels(): Channel[] {
  const channels: Channel[] = [
    {
      id: "c-ops-today",
      name: "ops-today",
      kind: "standing",
      topic: "Live ops dashboard. One thread per active visit.",
      members: everyone,
      starred: true,
    },
    {
      id: "c-alerts",
      name: "alerts",
      kind: "standing",
      topic: "Machine failures, walk-outs, urgent escalations.",
      members: everyone,
      starred: true,
    },
    {
      id: "c-shift-handover",
      name: "shift-handover",
      kind: "standing",
      topic: "Start and end of day · equipment and staffing status.",
      members: everyone,
    },
    {
      id: "c-role-vm",
      name: "role-vm",
      kind: "standing",
      topic: "Visit Manager peer coordination.",
      members: ["kavya.rao", "anjali.pillai", "rohit.iyer"],
    },
    {
      id: "c-role-fc",
      name: "role-fc",
      kind: "standing",
      topic: "Floating Concierge peer coordination. /walkin lives here.",
      members: ["anjali.pillai", "rohit.iyer", "kavya.rao"],
    },
    {
      id: "c-role-fm",
      name: "role-fm",
      kind: "standing",
      topic: "Floor Manager peer coordination.",
      members: ["rohit.iyer", "kavya.rao", "anjali.pillai"],
    },
    {
      id: "c-role-techs",
      name: "role-techs",
      kind: "standing",
      topic: "Technician channel.",
      members: STAFF.filter((s) => s.role === "tech" || s.role === "nurse").map((s) => s.handle).concat(["rohit.iyer"]),
    },
    {
      id: "c-supplements-followup",
      name: "supplements-followup",
      kind: "standing",
      topic: "Post-visit subscriptions and renewals.",
      members: everyone,
    },
    {
      id: "c-audit-log",
      name: "audit-log",
      kind: "standing",
      topic: "Compliance access log.",
      members: everyone,
    },
  ];

  // Some DM channels for the current user roles (we open them lazily too).
  const dms: Channel[] = [
    { id: "dm-VisitBot-kavya.rao", name: "VisitBot", kind: "dm", members: ["kavya.rao", "VisitBot" as any], dmWith: "VisitBot" as any },
    { id: "dm-VisitBot-rohit.iyer", name: "VisitBot", kind: "dm", members: ["rohit.iyer", "VisitBot" as any], dmWith: "VisitBot" as any },
    { id: "dm-VisitBot-anjali.pillai", name: "VisitBot", kind: "dm", members: ["anjali.pillai", "VisitBot" as any], dmWith: "VisitBot" as any },
  ];

  return [...channels, ...dms];
}

// A handful of preload messages so standing channels are not empty.
export function preloadStandingMessages() {
  return {
    "c-shift-handover": [
      {
        author: "rohit.iyer" as const,
        ts: "08:00",
        text: "Morning all — equipment scan complete. CT machine warm-up at 08:15. Mammography ready. Two techs out: Aditi double-booked for ultrasound coverage, will rotate.",
      },
      {
        author: "geetha.murthy" as const,
        ts: "08:05",
        text: "Vitals cart restocked, blood draw kits topped up to 24.",
      },
    ],
    "c-alerts": [
      {
        author: "system" as const,
        ts: "07:45",
        text: "Channel quiet since 18:32 yesterday. All pods clear.",
      },
    ],
    "c-role-vm": [
      {
        author: "kavya.rao" as const,
        ts: "08:10",
        text: "Three visits on the board for me today. Will pick up Sharma at 09:00 in PP4.",
      },
    ],
  } as const;
}
