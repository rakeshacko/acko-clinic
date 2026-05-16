import React, { useMemo } from "react";
import type { ActionButton, ActionElement, Block, Message } from "../types";
import { Avatar } from "./Avatar";
import { renderBlocks } from "./blocks/NativeBlocks";
import { getStaff } from "../seed";
import { Mrkdwn } from "../utils/mrkdwn";
import { useStore } from "../store";
import { getTemplate } from "../templates/registry";

const BOT_NAMES: Record<string, string> = {
  VisitBot: "VisitBot",
  PodBot: "PodBot",
  AppRelay: "AppRelay",
};

function authorName(author: string): string {
  if (BOT_NAMES[author]) return BOT_NAMES[author];
  const s = getStaff(author);
  return s?.name ?? author;
}

function sourceBarClass(m: Message): string {
  if (m.source === "alert") return "before:bg-bar-red before:absolute before:left-0 before:top-1 before:bottom-1 before:w-[3px] before:rounded-r";
  if (m.source === "dm") return "before:bg-bar-ochre before:absolute before:left-0 before:top-1 before:bottom-1 before:w-[3px] before:rounded-r";
  return "before:bg-bar-navy before:absolute before:left-0 before:top-1 before:bottom-1 before:w-[3px] before:rounded-r";
}

interface MessageViewProps {
  message: Message;
  showAuthor?: boolean;
  onAction?: (msg: Message, btn: ActionElement, optionValue?: string) => void;
}

export function MessageView({ message, showAuthor = true, onAction }: MessageViewProps) {
  const renderMode = useStore((s) => s.renderMode);
  const addReaction = useStore((s) => s.addReaction);
  const currentUser = useStore((s) => s.currentUserHandle);

  // Decide per-message render mode.
  const effective = message.renderMode === "image" ? "image" : message.renderMode === "native" ? "native" : renderMode;

  // Hide ephemerals not addressed to current user.
  if (message.visibleOnlyTo && message.visibleOnlyTo !== currentUser) return null;

  const ephemeral = !!message.visibleOnlyTo;

  return (
    <div
      className={`group relative px-5 py-1 pl-7 hover:bg-[#F8F8F8] msg-enter ${ephemeral ? "bg-[#FFF8E1]/40" : ""} ${sourceBarClass(message)}`}
    >
      <div className="flex gap-2.5">
        {showAuthor ? (
          <Avatar author={message.author} size={36} className="mt-0.5" />
        ) : (
          <div className="w-9 mt-0.5 flex-shrink-0 flex justify-end pr-1 opacity-0 group-hover:opacity-100 text-[10px] text-slack-textSecondary leading-9">
            {message.ts}
          </div>
        )}
        <div className="flex-1 min-w-0">
          {showAuthor && (
            <div className="flex items-baseline gap-2">
              <span className="font-extrabold text-[15px] text-slack-textPrimary">{authorName(message.author)}</span>
              {message.isBot && (
                <span className="bg-[#E0E0E0] text-[#555] text-[10px] font-bold uppercase tracking-wide px-1 py-px rounded leading-none">
                  APP
                </span>
              )}
              <span className="text-[12px] text-slack-textSecondary">{message.ts}</span>
              {ephemeral && (
                <span className="text-[11px] text-slack-textSecondary italic">Only visible to you</span>
              )}
            </div>
          )}
          {message.text && (
            <div className="text-[15px] leading-[1.46] text-slack-textPrimary">
              <Mrkdwn text={message.text} />
            </div>
          )}
          {message.blocks && message.blocks.length > 0 && (
            <BlocksWithRenderMode blocks={message.blocks} message={message} effectiveMode={effective} onAction={onAction} />
          )}
          {message.reactions && message.reactions.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {message.reactions.map((r) => (
                <button
                  key={r.emoji}
                  className={`px-1.5 py-0.5 rounded-full border text-[12px] flex items-center gap-1 ${
                    r.by.includes(currentUser)
                      ? "border-[#1264A3] bg-[#1264A3]/10"
                      : "border-slack-divider bg-white hover:border-slack-border"
                  }`}
                  onClick={() => addReaction(message.id, r.emoji, currentUser)}
                >
                  <span>{r.emoji}</span>
                  <span className="text-slack-textPrimary">{r.count}</span>
                </button>
              ))}
              <button
                title="Add reaction"
                className="px-1.5 py-0.5 rounded-full border border-dashed border-slack-divider text-[12px] text-slack-textSecondary hover:bg-white"
                onClick={() => addReaction(message.id, "👍", currentUser)}
              >
                + 😀
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BlocksWithRenderMode({
  blocks,
  message,
  effectiveMode,
  onAction,
}: {
  blocks: Block[];
  message: Message;
  effectiveMode: "native" | "image" | "side-by-side";
  onAction?: MessageViewProps["onAction"];
}) {
  // Expand template blocks based on effective render mode.
  const handleAction = (el: ActionElement, optionValue?: string) => {
    onAction?.(message, el, optionValue);
  };

  if (effectiveMode === "side-by-side") {
    return (
      <div className="grid grid-cols-2 gap-3 mt-1">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-slack-textSecondary mb-1">Native</div>
          <RenderPath blocks={blocks} message={message} mode="native" onAction={handleAction} />
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-slack-textSecondary mb-1">Image</div>
          <RenderPath blocks={blocks} message={message} mode="image" onAction={handleAction} />
        </div>
      </div>
    );
  }

  return <RenderPath blocks={blocks} message={message} mode={effectiveMode} onAction={handleAction} />;
}

function expandTemplateBlocks(blocks: Block[], mode: "native" | "image"): { rendered: Block[]; imageBlocks: { templateId: string; data: any; filename?: string; altText?: string }[] } {
  const rendered: Block[] = [];
  const imageBlocks: { templateId: string; data: any; filename?: string; altText?: string }[] = [];
  for (const b of blocks) {
    if (b.type === "template_native" || b.type === "template_image") {
      const tmpl = getTemplate(b.templateId);
      if (!tmpl) {
        rendered.push({ type: "alert", alert: { level: "error", text: { type: "mrkdwn", text: `Missing template \`${b.templateId}\`` } } });
        continue;
      }
      const wantsImage = mode === "image" || b.type === "template_image" || tmpl.capability === "image-only";
      // image-only templates always render as image regardless of requested mode
      const useImage = wantsImage || tmpl.capability === "image-only";
      if (useImage) {
        imageBlocks.push({
          templateId: b.templateId,
          data: (b as any).data,
          filename: (b as any).filename ?? tmpl.defaultFilename,
          altText: (b as any).altText ?? tmpl.defaultAlt,
        });
        // Insert a placeholder block to keep ordering; we'll render image cards after native ones in same flow
        rendered.push({ type: "section", text: { type: "plain_text", text: "__TEMPLATE_IMAGE_SLOT__" } } as any);
      } else {
        if (!tmpl.toNativeBlocks) {
          rendered.push({ type: "alert", alert: { level: "warning", text: { type: "mrkdwn", text: `Template *${b.templateId}* has no native renderer; falling back to image.` } } });
          imageBlocks.push({ templateId: b.templateId, data: (b as any).data, filename: tmpl.defaultFilename, altText: tmpl.defaultAlt });
          rendered.push({ type: "section", text: { type: "plain_text", text: "__TEMPLATE_IMAGE_SLOT__" } } as any);
        } else {
          const nb = tmpl.toNativeBlocks((b as any).data);
          rendered.push(...nb);
        }
      }
    } else {
      rendered.push(b);
    }
  }
  return { rendered, imageBlocks };
}

function RenderPath({
  blocks,
  message,
  mode,
  onAction,
}: {
  blocks: Block[];
  message: Message;
  mode: "native" | "image";
  onAction?: (el: ActionElement, optionValue?: string) => void;
}) {
  const { rendered, imageBlocks } = useMemo(() => expandTemplateBlocks(blocks, mode), [blocks, mode]);

  // We render image template slots as actual image-card frames at the appropriate place.
  let imageIdx = 0;
  const out: React.ReactNode[] = [];
  rendered.forEach((b, i) => {
    if ((b as any).type === "section" && (b as any).text?.text === "__TEMPLATE_IMAGE_SLOT__") {
      const img = imageBlocks[imageIdx++];
      if (img) out.push(<ImageCard key={`img-${i}`} templateId={img.templateId} data={img.data} filename={img.filename} altText={img.altText} />);
      return;
    }
    out.push(
      <div key={i}>
        {renderBlocks([b], message, onAction, false)}
      </div>
    );
  });
  return <>{out}</>;
}

function ImageCard({ templateId, data, filename, altText }: { templateId: string; data: any; filename?: string; altText?: string }) {
  const tmpl = getTemplate(templateId);
  if (!tmpl) return null;
  const Comp = tmpl.ImageComponent;
  const isImageOnly = tmpl.capability === "image-only";
  return (
    <div className="my-2 inline-block max-w-full">
      <div className="border border-slack-border rounded-md bg-white overflow-hidden">
        <div className="bg-[#F5F5F5] border-b border-slack-border px-3 py-1.5 flex items-center gap-2 text-[12px] text-slack-textSecondary">
          <span className="font-mono">🖼 {filename ?? `${templateId}.png`}</span>
          <span className="text-[10px] uppercase tracking-wide bg-slack-divider px-1.5 py-0.5 rounded">rendered from template</span>
          {isImageOnly && <span className="text-[10px] text-amber-700 ml-auto">image-only template</span>}
        </div>
        <div className="image-card-frame p-3">
          <Comp data={data} />
        </div>
        {altText && (
          <div className="px-3 py-1 text-[11px] text-slack-textSecondary border-t border-slack-divider italic">
            alt: {altText}
          </div>
        )}
      </div>
    </div>
  );
}
