import type { Beat, Block, Message } from "../types";

// Convenience builders for scenario authors.

export function msg(partial: Omit<Message, "id" | "channelId">): Omit<Message, "id" | "channelId"> {
  return partial;
}

export function botMsg(opts: {
  author: "VisitBot" | "PodBot" | "AppRelay";
  ts: string;
  text?: string;
  blocks?: Block[];
  source?: "channel" | "alert" | "dm";
  visibleOnlyTo?: string;
  liveKey?: string;
  channelId?: string;
}): any {
  return {
    author: opts.author,
    isBot: true,
    ts: opts.ts,
    source: opts.source ?? "channel",
    text: opts.text,
    blocks: opts.blocks,
    visibleOnlyTo: opts.visibleOnlyTo,
    liveKey: opts.liveKey,
    channelId: opts.channelId,
  };
}

export function staffMsg(opts: {
  author: string;
  ts: string;
  text?: string;
  blocks?: Block[];
  source?: "channel" | "alert" | "dm";
  visibleOnlyTo?: string;
  channelId?: string;
}): any {
  return {
    author: opts.author,
    isBot: false,
    ts: opts.ts,
    source: opts.source ?? "channel",
    text: opts.text,
    blocks: opts.blocks,
    visibleOnlyTo: opts.visibleOnlyTo,
    channelId: opts.channelId,
  };
}

export function autoBeat(b: Omit<Beat, "trigger">): Beat {
  return { ...b, trigger: "auto" };
}

export function buttonBeat(b: Omit<Beat, "trigger">): Beat {
  return { ...b, trigger: "button" };
}

export function formBeat(b: Omit<Beat, "trigger">): Beat {
  return { ...b, trigger: "form" };
}
