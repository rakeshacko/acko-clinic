// Core domain types for the ACKO Clinic floor simulator.
// Everything here is in-memory; no network or persistence assumptions.

export type Role = "vm" | "fc" | "fm" | "doctor" | "tech" | "nurse";

export type StaffHandle = string; // e.g. "kavya.rao"
export type BotHandle = "VisitBot" | "PodBot" | "AppRelay";

export interface Staff {
  handle: StaffHandle;
  name: string;
  role: Role;
  roleLabel: string;
  pod?: PodId; // for technicians
  avatarColor: string;
}

export type RoomStatus = "Ready" | "Occupied" | "Blocked";
export type RoomEvent = "ProcessStarted" | "TestDone";

export type PodId =
  | "Cardiac"
  | "CT"
  | "Oral"
  | "Sensory"
  | "BodyComposition"
  | "Functional"
  | "Sonography"
  | "Cervical"
  | "Mammography";

export type PersonalPodId = "PP1" | "PP2" | "PP3" | "PP4";
export type ConsultRoomId = "CR1" | "CR2" | "CR3";
export type RoomId = PodId | PersonalPodId | ConsultRoomId | "Lobby";

export type RoomKind = "diagnostic" | "personal" | "consult" | "lobby";

export interface Room {
  id: RoomId;
  label: string;
  kind: RoomKind;
  status: RoomStatus;
  lastEvent?: RoomEvent;
  occupantInitials?: string; // e.g. "P. Sharma"
  occupantVisitId?: string;
}

export type ChannelKind =
  | "standing"
  | "visit"
  | "dm";

export interface Channel {
  id: string;
  name: string; // e.g. "ops-today" or "v-20260517-A7K3M2-S"
  kind: ChannelKind;
  topic?: string;
  members: StaffHandle[];
  starred?: boolean;
  archived?: boolean;
  locked?: boolean;
  createdAt?: string; // in-fiction time
  visitType?: VisitType; // for visit channels
  visitId?: string;
  // DM-specific
  dmWith?: StaffHandle;
}

export type VisitType = "screening" | "consulting" | "single-test";

export interface PatientIdentity {
  firstName: string;
  lastName: string;
  age: number;
  gender: "M" | "F" | "Other";
  member: boolean;
  memberSince?: number;
  language: string;
  accessibility?: string[];
}

export type VisitStatus =
  | "Booked"
  | "InTransit"
  | "Arrived"
  | "InRoom"
  | "BetweenRooms"
  | "Consult"
  | "Checkout"
  | "Closed"
  | "Incomplete";

export interface Visit {
  id: string;
  channelId: string;
  type: VisitType;
  patient: PatientIdentity;
  package?: string; // e.g. "Annual Plus screening"
  concern?: string;
  assignedVm?: StaffHandle;
  assignedDoctor?: StaffHandle;
  opsAnchor?: StaffHandle;
  status: VisitStatus;
  currentRoom?: RoomId;
  currentStep?: string;
  startedAt?: string; // first scheduled timestamp
  podOrder?: PodId[]; // for screenings
}

// --- Slack-style blocks ---------------------------------------------------

export type PlainText = { type: "plain_text"; text: string };
export type Mrkdwn = { type: "mrkdwn"; text: string };
export type TextObject = PlainText | Mrkdwn;

export type ButtonStyle = "default" | "primary" | "danger";

export interface ActionButton {
  type: "button";
  text: PlainText;
  action_id: string;
  style?: ButtonStyle;
  // When pressed, advances the scenario to this beat id.
  nextBeatId?: string;
  value?: string;
  url?: string;
}

export interface ActionSelect {
  type: "static_select";
  action_id: string;
  placeholder: PlainText;
  options: { text: PlainText; value: string; nextBeatId?: string }[];
}

export type ActionElement = ActionButton | ActionSelect;

export interface SectionBlock {
  type: "section";
  text?: TextObject;
  fields?: TextObject[];
  accessory?: ActionElement;
}
export interface HeaderBlock {
  type: "header";
  text: PlainText;
}
export interface DividerBlock {
  type: "divider";
}
export interface ContextBlock {
  type: "context";
  elements: (TextObject | { type: "image"; image_url: string; alt_text: string })[];
}
export interface ActionsBlock {
  type: "actions";
  elements: ActionElement[];
}
export interface ImageBlock {
  type: "image";
  image_url: string;
  alt_text: string;
  title?: PlainText;
}
export interface CardBlock {
  type: "card";
  card: {
    icon?: string;
    title: PlainText;
    subtitle?: TextObject;
    body?: TextObject;
    fields?: { label: string; value: string }[];
    hero_url?: string;
  };
  actions?: ActionButton[];
}
export interface AlertBlock {
  type: "alert";
  alert: {
    level: "default" | "info" | "success" | "warning" | "error";
    text: TextObject;
  };
}
export interface TableBlock {
  type: "table";
  header?: string[];
  rows: string[][];
}

// Prototype-specific template blocks (dual rendering).
export interface TemplateNativeBlock {
  type: "template_native";
  templateId: string;
  data: any;
}
export interface TemplateImageBlock {
  type: "template_image";
  templateId: string;
  data: any;
  filename?: string;
  altText?: string;
}

export type Block =
  | SectionBlock
  | HeaderBlock
  | DividerBlock
  | ContextBlock
  | ActionsBlock
  | ImageBlock
  | CardBlock
  | AlertBlock
  | TableBlock
  | TemplateNativeBlock
  | TemplateImageBlock;

// --- Messages -------------------------------------------------------------

export type MessageSourceType = "channel" | "dm" | "alert";

export interface Reaction {
  emoji: string;
  count: number;
  by: StaffHandle[];
}

export interface Message {
  id: string;
  channelId: string;
  author: BotHandle | StaffHandle | "system";
  isBot: boolean;
  ts: string; // "HH:MM" in-fiction
  source: MessageSourceType;
  text?: string; // headline / preface
  blocks?: Block[];
  reactions?: Reaction[];
  // For ephemeral messages, only visible to this handle.
  visibleOnlyTo?: StaffHandle;
  // Per-message render mode override.
  renderMode?: "native" | "image" | "auto";
  pinned?: boolean;
  scenarioId?: string;
  beatId?: string;
  // For messages that get edited in place (visit cards, ops-today rows).
  liveKey?: string;
  // When a button on this message has been clicked, the engine records who
  // acted and on which button. Buttons render disabled and an "Acted by …"
  // line appears beneath. This mirrors chat.update on the same message.
  actedBy?: { handle: StaffHandle; ts: string; actionLabel: string };
}

// --- Scenarios ------------------------------------------------------------

export interface Effect {
  type:
    | "createChannel"
    | "archiveChannel"
    | "lockChannel"
    | "addChannelMember"
    | "removeChannelMember"
    | "setRoomStatus"
    | "emitRoomEvent"
    | "setOpsTodayStatus"
    | "pinMessage"
    | "addReaction"
    | "addReactionToLatest"
    | "crossPost"
    | "updateVisit"
    | "openForm"
    | "openModal"
    | "closeChannel";
  [k: string]: any;
}

export interface Beat {
  id: string;
  trigger: "auto" | "button" | "form";
  delayMs?: number;
  emit?: Omit<Message, "id" | "channelId">[] | ((ctx: ScenarioCtx) => Omit<Message, "id" | "channelId">[]);
  channelId?: string; // default channel for the beat's emissions
  sideEffects?: Effect[] | ((ctx: ScenarioCtx) => Effect[]);
  buttons?: { label: string; style?: ButtonStyle; nextBeatId: string }[];
  formId?: string;
  next?: string;
  // The beat text shown in the engine timeline ("Cardiac handoff").
  label?: string;
}

export interface ScenarioCtx {
  visitId: string;
  channelId: string;
  patient: PatientIdentity;
  formValues?: Record<string, any>;
}

export interface Scenario {
  id: string;
  title: string;
  subtitle?: string;
  type: VisitType | "branch" | "walk-in";
  seed: {
    visit: Omit<Visit, "channelId" | "status"> & { status?: VisitStatus };
    channelName: string;
    initialMembers?: StaffHandle[];
    preloadMessages?: Omit<Message, "id" | "channelId">[];
  };
  beats: Beat[];
  entryBeatId?: string; // defaults to beats[0].id
}

// --- Live ops-today rows --------------------------------------------------

export interface OpsTodayRow {
  visitId: string;
  patientInitial: string;
  visitType: VisitType;
  currentRoom?: string;
  currentStep?: string;
  statusLine: string;
  startedAt?: string;
  updatedAt: string;
}

// --- Form definitions -----------------------------------------------------

export type FormFieldType = "text" | "number" | "select" | "multiselect" | "checkbox" | "textarea";

export interface FormField {
  id: string;
  label: string;
  type: FormFieldType;
  options?: string[];
  placeholder?: string;
  default?: any;
  required?: boolean;
  inline?: boolean;
  hint?: string;
}

export interface FormSpec {
  id: string;
  title: string;
  fields: FormField[];
  submitLabel?: string;
  // Optional "branch" buttons (e.g. Machine down, Vein not found) – clicking
  // these completes the form but jumps to a non-default beat.
  branchButtons?: { label: string; style?: ButtonStyle; nextBeatId: string }[];
}

// --- Render mode ----------------------------------------------------------

export type RenderMode = "native" | "image" | "side-by-side";
