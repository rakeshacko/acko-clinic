import { create } from "zustand";
import type {
  Beat,
  Channel,
  Message,
  OpsTodayRow,
  Reaction,
  RenderMode,
  Role,
  Room,
  RoomId,
  RoomStatus,
  RoomEvent,
  Scenario,
  StaffHandle,
  Visit,
  Effect,
  Block,
} from "./types";
import { STAFF, getStaff, preloadStandingMessages, seedChannels, seedRooms } from "./seed";

// --- Active scenario instance ---------------------------------------------

export interface ScenarioInstance {
  id: string; // instance id
  scenarioId: string;
  visitId: string;
  channelId: string;
  currentBeatId: string;
  status: "idle" | "running" | "waiting" | "done";
  startedAt?: number;
  pendingFormBeatId?: string; // beat that triggers a form modal
  pendingTimer?: number; // setTimeout handle
  history: string[]; // beat ids fired
}

export type PlaybackMode = "auto" | "step";

interface StoreState {
  // Reference data
  rooms: Room[];
  channels: Channel[];
  staff: typeof STAFF;

  // Messages keyed by channel
  messagesByChannel: Record<string, Message[]>;

  // Active visits and scenario runners
  visits: Record<string, Visit>;
  scenarios: Record<string, Scenario>; // catalog
  instances: Record<string, ScenarioInstance>;

  // Ops-today live rows
  opsRows: Record<string, OpsTodayRow>; // keyed by visitId

  // UI
  currentRole: Role;
  currentUserHandle: StaffHandle;
  activeChannelId: string;
  rightPanelOpen: boolean;
  controlPanelOpen: boolean;
  showFloorBoard: boolean;
  renderMode: RenderMode;
  playbackMode: PlaybackMode;
  playbackSpeed: number; // 0.5, 1, 2, 4
  clock: string; // current in-fiction HH:MM
  unreadByChannel: Record<string, number>;

  // Pending interactive (form modal)
  pendingForm?: { instanceId: string; formId: string; beatId: string };

  // Actions
  registerScenario: (s: Scenario) => void;
  setActiveChannel: (id: string) => void;
  setCurrentRole: (r: Role) => void;
  setRenderMode: (m: RenderMode) => void;
  setPlaybackMode: (m: PlaybackMode) => void;
  setPlaybackSpeed: (n: number) => void;
  toggleRightPanel: () => void;
  toggleControlPanel: () => void;
  toggleFloorBoard: () => void;
  postMessage: (channelId: string, msg: Omit<Message, "id" | "channelId">) => Message;
  upsertLiveMessage: (channelId: string, key: string, msg: Omit<Message, "id" | "channelId">) => Message;
  addReaction: (messageId: string, emoji: string, by: StaffHandle) => void;
  setRoomStatus: (room: RoomId, status: RoomStatus, occupant?: { initials: string; visitId: string } | null) => void;
  emitRoomEvent: (room: RoomId, ev: RoomEvent) => void;
  setOpsTodayStatus: (visitId: string, statusLine: string, extra?: Partial<OpsTodayRow>) => void;
  startScenario: (scenarioId: string) => string; // returns instance id
  advanceBeat: (instanceId: string, nextBeatId?: string) => void;
  step: (instanceId: string) => void;
  submitForm: (instanceId: string, beatId: string, formValues: Record<string, any>, branchNextBeatId?: string) => void;
  cancelForm: () => void;
  setClock: (hhmm: string) => void;
  resetAll: () => void;
  ensureDmChannel: (a: StaffHandle, b: StaffHandle | "VisitBot" | "PodBot" | "AppRelay") => string;
  markChannelRead: (channelId: string) => void;
}

const initialChannels = seedChannels();
const initialRooms = seedRooms();

function initialMessages(): Record<string, Message[]> {
  const preload = preloadStandingMessages();
  const result: Record<string, Message[]> = {};
  for (const ch of initialChannels) result[ch.id] = [];
  for (const [cid, msgs] of Object.entries(preload)) {
    result[cid] = (msgs as unknown as any[]).map((m, i) => ({
      ...m,
      id: `pre-${cid}-${i}`,
      channelId: cid,
      isBot: m.author === "system" ? false : !!getStaff(m.author) ? false : true,
      source: "channel" as const,
    }));
  }
  return result;
}

let messageSeq = 1;
function nextId(prefix = "m"): string {
  return `${prefix}-${Date.now().toString(36)}-${(messageSeq++).toString(36)}`;
}

export const useStore = create<StoreState>((set, get) => ({
  rooms: initialRooms,
  channels: initialChannels,
  staff: STAFF,
  messagesByChannel: initialMessages(),
  visits: {},
  scenarios: {},
  instances: {},
  opsRows: {},

  currentRole: "vm",
  currentUserHandle: "kavya.rao",
  activeChannelId: "c-ops-today",
  rightPanelOpen: false,
  controlPanelOpen: true,
  showFloorBoard: false,
  renderMode: "native",
  playbackMode: "auto",
  playbackSpeed: 1,
  clock: "08:00",
  unreadByChannel: {},

  registerScenario: (s) => set((st) => ({ scenarios: { ...st.scenarios, [s.id]: s } })),

  setActiveChannel: (id) =>
    set((st) => ({
      activeChannelId: id,
      unreadByChannel: { ...st.unreadByChannel, [id]: 0 },
    })),

  setCurrentRole: (r) => {
    // Pick a representative handle per role
    const handle: StaffHandle = (
      {
        vm: "kavya.rao",
        fc: "anjali.pillai",
        fm: "rohit.iyer",
        doctor: "dr.anand",
        tech: "sneha.reddy",
        nurse: "geetha.murthy",
      } as Record<Role, StaffHandle>
    )[r];
    set({ currentRole: r, currentUserHandle: handle });
  },

  setRenderMode: (m) => set({ renderMode: m }),
  setPlaybackMode: (m) => set({ playbackMode: m }),
  setPlaybackSpeed: (n) => set({ playbackSpeed: n }),
  toggleRightPanel: () => set((s) => ({ rightPanelOpen: !s.rightPanelOpen })),
  toggleControlPanel: () => set((s) => ({ controlPanelOpen: !s.controlPanelOpen })),
  toggleFloorBoard: () => set((s) => ({ showFloorBoard: !s.showFloorBoard })),

  postMessage: (channelId, msg) => {
    const m: Message = {
      ...msg,
      id: nextId(),
      channelId,
    };
    set((st) => {
      const list = st.messagesByChannel[channelId] ?? [];
      const isActive = st.activeChannelId === channelId;
      return {
        messagesByChannel: { ...st.messagesByChannel, [channelId]: [...list, m] },
        unreadByChannel: isActive
          ? st.unreadByChannel
          : { ...st.unreadByChannel, [channelId]: (st.unreadByChannel[channelId] ?? 0) + 1 },
        // Clock always reflects the most recent beat's in-fiction timestamp.
        // It may go backward across day boundaries (e.g. Fri 17:30 booking →
        // Mon 08:00 morning digest); that's the right behaviour for the
        // user-facing scene marker.
        clock: msg.ts,
      };
    });
    return m;
  },

  upsertLiveMessage: (channelId, key, msg) => {
    let result!: Message;
    set((st) => {
      const list = st.messagesByChannel[channelId] ?? [];
      const idx = list.findIndex((m) => m.liveKey === key);
      if (idx >= 0) {
        const updated: Message = { ...list[idx], ...msg, id: list[idx].id, channelId, liveKey: key };
        result = updated;
        const next = [...list];
        next[idx] = updated;
        return {
          messagesByChannel: { ...st.messagesByChannel, [channelId]: next },
          clock: msg.ts,
        };
      }
      const created: Message = { ...msg, id: nextId(), channelId, liveKey: key };
      result = created;
      return {
        messagesByChannel: { ...st.messagesByChannel, [channelId]: [...list, created] },
        clock: msg.ts,
      };
    });
    return result;
  },

  addReaction: (messageId, emoji, by) => {
    set((st) => {
      const next = { ...st.messagesByChannel };
      for (const [cid, list] of Object.entries(next)) {
        const idx = list.findIndex((m) => m.id === messageId);
        if (idx >= 0) {
          const msg = list[idx];
          const existing = msg.reactions ?? [];
          const ri = existing.findIndex((r) => r.emoji === emoji);
          let reactions: Reaction[];
          if (ri >= 0) {
            const r = existing[ri];
            if (r.by.includes(by)) {
              reactions = existing;
            } else {
              reactions = [...existing];
              reactions[ri] = { ...r, count: r.count + 1, by: [...r.by, by] };
            }
          } else {
            reactions = [...existing, { emoji, count: 1, by: [by] }];
          }
          const updated = { ...msg, reactions };
          const newList = [...list];
          newList[idx] = updated;
          next[cid] = newList;
          break;
        }
      }
      return { messagesByChannel: next };
    });
  },

  setRoomStatus: (roomId, status, occupant) =>
    set((st) => ({
      rooms: st.rooms.map((r) =>
        r.id === roomId
          ? {
              ...r,
              status,
              occupantInitials: occupant ? occupant.initials : status === "Ready" ? undefined : r.occupantInitials,
              occupantVisitId: occupant ? occupant.visitId : status === "Ready" ? undefined : r.occupantVisitId,
              lastEvent: status === "Ready" ? undefined : r.lastEvent,
            }
          : r
      ),
    })),

  emitRoomEvent: (roomId, ev) =>
    set((st) => ({
      rooms: st.rooms.map((r) => (r.id === roomId ? { ...r, lastEvent: ev } : r)),
    })),

  setOpsTodayStatus: (visitId, statusLine, extra) =>
    set((st) => {
      const existing = st.opsRows[visitId];
      const visit = st.visits[visitId];
      if (!visit) return {};
      const initial = `${visit.patient.firstName[0]}. ${visit.patient.lastName}`;
      const row: OpsTodayRow = {
        visitId,
        patientInitial: initial,
        visitType: visit.type,
        currentRoom: extra?.currentRoom ?? existing?.currentRoom,
        currentStep: extra?.currentStep ?? existing?.currentStep,
        statusLine,
        startedAt: existing?.startedAt ?? st.clock,
        updatedAt: st.clock,
        ...extra,
      };
      return { opsRows: { ...st.opsRows, [visitId]: row } };
    }),

  startScenario: (scenarioId) => {
    const scenario = get().scenarios[scenarioId];
    if (!scenario) throw new Error(`scenario ${scenarioId} not registered`);
    const seed = scenario.seed;
    const visit: Visit = {
      ...(seed.visit as any),
      channelId: `c-${seed.channelName}`,
      status: seed.visit.status ?? "Booked",
    };
    const channelId = visit.channelId;
    // Create the visit channel
    const channel: Channel = {
      id: channelId,
      name: seed.channelName,
      kind: "visit",
      topic: `${visit.type.toUpperCase()} · ${visit.patient.firstName[0]}. ${visit.patient.lastName}`,
      members: ["VisitBot" as any, "PodBot" as any, "AppRelay" as any, ...(seed.initialMembers ?? [])],
      createdAt: get().clock,
      visitType: visit.type,
      visitId: visit.id,
    };
    set((st) => {
      const channels = st.channels.find((c) => c.id === channelId)
        ? st.channels
        : [...st.channels, channel];
      const messagesByChannel = { ...st.messagesByChannel };
      if (!messagesByChannel[channelId]) messagesByChannel[channelId] = [];
      // preload messages
      const preload = seed.preloadMessages ?? [];
      for (const pm of preload) {
        const m: Message = { ...pm, id: nextId(), channelId };
        messagesByChannel[channelId] = [...messagesByChannel[channelId], m];
      }
      const visits = { ...st.visits, [visit.id]: visit };
      const opsRows = {
        ...st.opsRows,
        [visit.id]: {
          visitId: visit.id,
          patientInitial: `${visit.patient.firstName[0]}. ${visit.patient.lastName}`,
          visitType: visit.type,
          statusLine: "Booked",
          updatedAt: st.clock,
          startedAt: st.clock,
        },
      };
      return { channels, messagesByChannel, visits, opsRows };
    });

    const instanceId = `i-${visit.id}-${Date.now().toString(36)}`;
    const entry = scenario.entryBeatId ?? scenario.beats[0].id;
    const instance: ScenarioInstance = {
      id: instanceId,
      scenarioId: scenario.id,
      visitId: visit.id,
      channelId,
      currentBeatId: entry,
      status: "running",
      history: [],
      startedAt: Date.now(),
    };
    set((st) => ({ instances: { ...st.instances, [instanceId]: instance } }));

    // Fire entry beat
    runBeat(instanceId, entry);
    return instanceId;
  },

  advanceBeat: (instanceId, nextBeatId) => {
    const inst = get().instances[instanceId];
    if (!inst) return;
    const scenario = get().scenarios[inst.scenarioId];
    if (!scenario) return;
    const target = nextBeatId ?? inst.currentBeatId;
    if (!target) return;
    runBeat(instanceId, target);
  },

  step: (instanceId) => {
    const inst = get().instances[instanceId];
    if (!inst) return;
    runBeat(instanceId, inst.currentBeatId);
  },

  submitForm: (instanceId, beatId, formValues, branchNextBeatId) => {
    const st = get();
    const inst = st.instances[instanceId];
    if (!inst) return;
    const scenario = st.scenarios[inst.scenarioId];
    if (!scenario) return;
    const beat = scenario.beats.find((b) => b.id === beatId);
    if (!beat) return;
    // Attach form values to a visit-scoped store. We piggyback on the visit object.
    const visit = st.visits[inst.visitId];
    if (visit) {
      const updated: Visit = { ...visit, ...{ _form: { ...(visit as any)._form, [beat.formId!]: formValues } } as any };
      set((s) => ({ visits: { ...s.visits, [visit.id]: updated } }));
    }
    set({ pendingForm: undefined });
    const nextBeat = branchNextBeatId ?? beat.next;
    if (nextBeat) runBeat(instanceId, nextBeat);
  },

  cancelForm: () => set({ pendingForm: undefined }),

  setClock: (hhmm) => set({ clock: hhmm }),

  resetAll: () => {
    // Clear any timers
    for (const inst of Object.values(get().instances)) {
      if (inst.pendingTimer) window.clearTimeout(inst.pendingTimer);
    }
    set({
      rooms: seedRooms(),
      channels: seedChannels(),
      messagesByChannel: initialMessages(),
      visits: {},
      instances: {},
      opsRows: {},
      activeChannelId: "c-ops-today",
      unreadByChannel: {},
      clock: "08:00",
      pendingForm: undefined,
    });
  },

  ensureDmChannel: (a, b) => {
    const id = `dm-${b}-${a}`;
    const st = get();
    if (st.channels.find((c) => c.id === id)) return id;
    const ch: Channel = {
      id,
      name: typeof b === "string" ? b : (b as any).toString(),
      kind: "dm",
      members: [a, b as any],
      dmWith: b as any,
    };
    set({ channels: [...st.channels, ch] });
    return id;
  },

  markChannelRead: (channelId) =>
    set((st) => ({ unreadByChannel: { ...st.unreadByChannel, [channelId]: 0 } })),
}));

// --- Beat runner ----------------------------------------------------------

function applyEffects(effects: Effect[] | undefined, ctx: { instanceId: string; channelId: string; visitId: string }) {
  if (!effects) return;
  const st = useStore.getState();
  for (const eff of effects) {
    switch (eff.type) {
      case "addChannelMember": {
        useStore.setState((s) => ({
          channels: s.channels.map((c) =>
            c.id === ctx.channelId && !c.members.includes(eff.handle)
              ? { ...c, members: [...c.members, eff.handle] }
              : c
          ),
        }));
        break;
      }
      case "removeChannelMember": {
        useStore.setState((s) => ({
          channels: s.channels.map((c) =>
            c.id === ctx.channelId ? { ...c, members: c.members.filter((m) => m !== eff.handle) } : c
          ),
        }));
        break;
      }
      case "setRoomStatus": {
        st.setRoomStatus(eff.room, eff.status, eff.occupant ?? null);
        break;
      }
      case "emitRoomEvent": {
        st.emitRoomEvent(eff.room, eff.event);
        break;
      }
      case "setOpsTodayStatus": {
        st.setOpsTodayStatus(ctx.visitId, eff.statusLine, {
          currentRoom: eff.currentRoom,
          currentStep: eff.currentStep,
        });
        break;
      }
      case "lockChannel": {
        useStore.setState((s) => ({
          channels: s.channels.map((c) => (c.id === ctx.channelId ? { ...c, locked: true } : c)),
        }));
        break;
      }
      case "archiveChannel": {
        useStore.setState((s) => ({
          channels: s.channels.map((c) => (c.id === ctx.channelId ? { ...c, archived: true, locked: true } : c)),
        }));
        break;
      }
      case "crossPost": {
        const targetId = eff.channelId;
        const msg: Omit<Message, "id" | "channelId"> = eff.message;
        st.postMessage(targetId, msg);
        break;
      }
      case "updateVisit": {
        useStore.setState((s) => ({
          visits: { ...s.visits, [ctx.visitId]: { ...s.visits[ctx.visitId], ...eff.patch } as any },
        }));
        break;
      }
      default:
        break;
    }
  }
}

// Compute trailing buttons block from beat.buttons (when buttons present).
function buttonsBlock(buttons: Beat["buttons"]): Block | null {
  if (!buttons || buttons.length === 0) return null;
  return {
    type: "actions",
    elements: buttons.map((b, i) => ({
      type: "button",
      text: { type: "plain_text", text: b.label },
      action_id: `b-${i}`,
      style: b.style,
      nextBeatId: b.nextBeatId,
    })),
  };
}

function runBeat(instanceId: string, beatId: string) {
  const st = useStore.getState();
  const inst = st.instances[instanceId];
  if (!inst) return;
  const scenario = st.scenarios[inst.scenarioId];
  if (!scenario) return;
  // Clear any pending timer so manual jumps don't double-fire.
  if (inst.pendingTimer) {
    window.clearTimeout(inst.pendingTimer);
  }
  const beat = scenario.beats.find((b) => b.id === beatId);
  if (!beat) {
    // Branch beat referenced but not implemented in this scenario.
    // Post a console-style notice and keep the instance idle.
    st.postMessage(inst.channelId, {
      author: "system",
      isBot: false,
      ts: st.clock,
      source: "channel",
      text: `_(simulator) branch beat \`${beatId}\` is not part of this scenario — try the matching standalone branch scenario from the control panel._`,
    } as any);
    useStore.setState((s) => ({
      instances: {
        ...s.instances,
        [instanceId]: { ...s.instances[instanceId], status: "waiting" },
      },
    }));
    return;
  }
  const visit = st.visits[inst.visitId];
  const ctx = { visitId: inst.visitId, channelId: inst.channelId, patient: visit.patient, formValues: (visit as any)._form };

  // Emit messages
  const emitArr = typeof beat.emit === "function" ? beat.emit(ctx) : beat.emit;
  let lastMsg: Message | null = null;
  if (emitArr && emitArr.length > 0) {
    const buttons = buttonsBlock(beat.buttons);
    emitArr.forEach((m, i) => {
      const channelId = (m as any).channelId ?? beat.channelId ?? inst.channelId;
      // Attach buttons to last message
      let blocks = m.blocks;
      if (i === emitArr.length - 1 && buttons) {
        blocks = [...(blocks ?? []), buttons];
      }
      const finalMsg: Omit<Message, "id" | "channelId"> = {
        ...m,
        blocks,
        scenarioId: scenario.id,
        beatId: beat.id,
      };
      if (m.liveKey) {
        lastMsg = useStore.getState().upsertLiveMessage(channelId, m.liveKey, finalMsg);
      } else {
        lastMsg = useStore.getState().postMessage(channelId, finalMsg);
      }
    });
  } else if (beat.buttons && beat.buttons.length > 0) {
    // Emit just a buttons message
    const finalMsg: Omit<Message, "id" | "channelId"> = {
      author: "VisitBot",
      isBot: true,
      ts: useStore.getState().clock,
      source: "channel",
      blocks: [buttonsBlock(beat.buttons)!],
      scenarioId: scenario.id,
      beatId: beat.id,
    };
    lastMsg = useStore.getState().postMessage(inst.channelId, finalMsg);
  }

  // Apply effects
  const effects = typeof beat.sideEffects === "function" ? beat.sideEffects(ctx) : beat.sideEffects;
  applyEffects(effects, { instanceId, channelId: inst.channelId, visitId: inst.visitId });

  // Update instance state
  useStore.setState((s) => ({
    instances: {
      ...s.instances,
      [instanceId]: {
        ...s.instances[instanceId],
        currentBeatId: beat.id,
        history: [...s.instances[instanceId].history, beat.id],
        status: beat.trigger === "auto" && beat.next ? "running" : beat.trigger === "button" ? "waiting" : beat.trigger === "form" ? "waiting" : (beat.next ? "running" : "done"),
      },
    },
  }));

  // Form trigger -> open the form modal
  if (beat.trigger === "form" && beat.formId) {
    useStore.setState({ pendingForm: { instanceId, formId: beat.formId, beatId: beat.id } });
    return;
  }

  // Schedule next for auto beats
  if (beat.next) {
    const playbackMode = useStore.getState().playbackMode;
    const speed = useStore.getState().playbackSpeed;
    if (playbackMode === "auto") {
      const delay = (beat.delayMs ?? 1500) / speed;
      const timer = window.setTimeout(() => runBeat(instanceId, beat.next!), delay);
      useStore.setState((s) => ({
        instances: {
          ...s.instances,
          [instanceId]: { ...s.instances[instanceId], pendingTimer: timer as unknown as number },
        },
      }));
    }
  } else if (beat.trigger === "auto" && !beat.next && !beat.buttons) {
    // Mark done
    useStore.setState((s) => ({
      instances: {
        ...s.instances,
        [instanceId]: { ...s.instances[instanceId], status: "done" },
      },
    }));
  }
}

export { runBeat };
