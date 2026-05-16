import React from "react";
import type {
  Block,
  ActionButton,
  ActionSelect,
  ActionElement,
  AlertBlock,
  CardBlock,
  ContextBlock,
  DividerBlock,
  HeaderBlock,
  ImageBlock,
  SectionBlock,
  ActionsBlock,
  TableBlock,
  Message,
} from "../../types";
import { Mrkdwn } from "../../utils/mrkdwn";

interface BlockRenderProps {
  block: Block;
  message: Message;
  onAction?: (el: ActionElement, optionValue?: string) => void;
  // Render mode controls whether buttons are clickable (image mode disables interactivity).
  disabled?: boolean;
}

export function NativeBlock({ block, message, onAction, disabled }: BlockRenderProps) {
  switch (block.type) {
    case "section":
      return <SectionView b={block} onAction={onAction} disabled={disabled} />;
    case "header":
      return <HeaderView b={block} />;
    case "divider":
      return <DividerView b={block} />;
    case "context":
      return <ContextView b={block} />;
    case "actions":
      return <ActionsView b={block} onAction={onAction} disabled={disabled} />;
    case "image":
      return <ImageBlockView b={block} />;
    case "card":
      return <CardView b={block} onAction={onAction} disabled={disabled} />;
    case "alert":
      return <AlertView b={block} />;
    case "table":
      return <TableView b={block} />;
    default:
      return null;
  }
}

function textOf(t: { text: string }) {
  return t.text;
}

function SectionView({ b, onAction, disabled }: { b: SectionBlock; onAction?: BlockRenderProps["onAction"]; disabled?: boolean }) {
  return (
    <div className="my-1 text-[15px] leading-[1.46] text-slack-textPrimary">
      <div className="flex gap-3 items-start">
        <div className="flex-1">
          {b.text ? <div><Mrkdwn text={textOf(b.text)} /></div> : null}
          {b.fields && b.fields.length > 0 ? (
            <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[14px]">
              {b.fields.map((f, i) => (
                <div key={i}>
                  <Mrkdwn text={f.text} />
                </div>
              ))}
            </div>
          ) : null}
        </div>
        {b.accessory ? (
          <div>
            <ActionEl el={b.accessory} onAction={onAction} disabled={disabled} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function HeaderView({ b }: { b: HeaderBlock }) {
  return <div className="text-[18px] font-extrabold leading-tight my-2 text-slack-textPrimary">{b.text.text}</div>;
}

function DividerView({ b: _ }: { b: DividerBlock }) {
  return <hr className="my-2 border-slack-divider" />;
}

function ContextView({ b }: { b: ContextBlock }) {
  return (
    <div className="text-[12px] text-slack-textSecondary my-1 flex items-center gap-2">
      {b.elements.map((e, i) => {
        if ((e as any).type === "image") {
          const im = e as any;
          return <img key={i} src={im.image_url} alt={im.alt_text} className="w-4 h-4 rounded" />;
        }
        return (
          <span key={i}>
            <Mrkdwn text={(e as any).text} />
          </span>
        );
      })}
    </div>
  );
}

function ImageBlockView({ b }: { b: ImageBlock }) {
  return (
    <div className="my-2 max-w-md border border-slack-border rounded-md overflow-hidden">
      {b.title ? <div className="px-3 py-2 text-[13px] text-slack-textSecondary">{b.title.text}</div> : null}
      <img src={b.image_url} alt={b.alt_text} className="block w-full" />
    </div>
  );
}

function CardView({ b, onAction, disabled }: { b: CardBlock; onAction?: BlockRenderProps["onAction"]; disabled?: boolean }) {
  const c = b.card;
  return (
    <div className="my-1 border-l-2 border-[#E0E0E0] pl-3">
      <div className="border border-slack-border rounded-md max-w-[640px] overflow-hidden bg-white">
        {c.hero_url ? (
          <div className="bg-acko-warm/60 aspect-[4/3] max-h-48 overflow-hidden flex items-center justify-center">
            <img src={c.hero_url} alt="" className="object-cover w-full h-full" />
          </div>
        ) : null}
        <div className="px-4 py-3">
          <div className="flex items-baseline gap-2">
            {c.icon ? <span className="text-[16px]">{c.icon}</span> : null}
            <div className="font-extrabold text-[15px] text-slack-textPrimary">{c.title.text}</div>
          </div>
          {c.subtitle ? (
            <div className="text-[13px] text-slack-textSecondary mt-0.5">
              <Mrkdwn text={textOf(c.subtitle)} />
            </div>
          ) : null}
          {c.body ? (
            <div className="text-[14px] text-slack-textPrimary mt-2">
              <Mrkdwn text={textOf(c.body)} />
            </div>
          ) : null}
          {c.fields && c.fields.length > 0 ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-3 text-[13px]">
              {c.fields.map((f, i) => (
                <div key={i}>
                  <div className="text-slack-textSecondary text-[11px] uppercase tracking-wide">{f.label}</div>
                  <div className="text-slack-textPrimary">
                    <Mrkdwn text={f.value} />
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
        {b.actions && b.actions.length > 0 ? (
          <div className="px-4 pb-3 pt-1 flex flex-wrap gap-2 border-t border-slack-divider">
            {b.actions.map((a, i) => (
              <ButtonEl key={i} btn={a} onAction={onAction} disabled={disabled} />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function AlertView({ b }: { b: AlertBlock }) {
  const styles: Record<string, string> = {
    default: "bg-gray-50 border-gray-300 text-gray-800",
    info: "bg-blue-50 border-blue-300 text-blue-900",
    success: "bg-green-50 border-green-300 text-green-900",
    warning: "bg-amber-50 border-amber-400 text-amber-900",
    error: "bg-red-50 border-red-400 text-red-900",
  };
  const icons: Record<string, string> = {
    default: "ℹ",
    info: "ℹ",
    success: "✓",
    warning: "⚠",
    error: "🚨",
  };
  return (
    <div className={`my-1 border rounded-md px-3 py-2 text-[14px] flex items-start gap-2 ${styles[b.alert.level]}`}>
      <span className="font-bold leading-snug">{icons[b.alert.level]}</span>
      <div className="flex-1">
        <Mrkdwn text={(b.alert.text as any).text} />
      </div>
    </div>
  );
}

function TableView({ b }: { b: TableBlock }) {
  return (
    <div className="my-2 overflow-x-auto">
      <table className="border-collapse text-[13px] border border-slack-border rounded-md overflow-hidden">
        {b.header ? (
          <thead>
            <tr className="bg-slack-divider/50">
              {b.header.map((h, i) => (
                <th key={i} className="text-left px-2.5 py-1.5 font-semibold border-b border-slack-border">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
        ) : null}
        <tbody>
          {b.rows.map((r, ri) => (
            <tr key={ri} className={ri % 2 ? "bg-white" : "bg-slack-divider/15"}>
              {r.map((cell, ci) => (
                <td key={ci} className="px-2.5 py-1 border-b border-slack-divider align-top">
                  <Mrkdwn text={cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ActionsView({ b, onAction, disabled }: { b: ActionsBlock; onAction?: BlockRenderProps["onAction"]; disabled?: boolean }) {
  return (
    <div className="my-2 flex flex-wrap gap-2">
      {b.elements.map((el, i) => (
        <ActionEl key={i} el={el} onAction={onAction} disabled={disabled} />
      ))}
    </div>
  );
}

function ActionEl({ el, onAction, disabled }: { el: ActionElement; onAction?: BlockRenderProps["onAction"]; disabled?: boolean }) {
  if (el.type === "button") return <ButtonEl btn={el} onAction={onAction} disabled={disabled} />;
  return <SelectEl sel={el} onAction={onAction} disabled={disabled} />;
}

function ButtonEl({ btn, onAction, disabled }: { btn: ActionButton; onAction?: BlockRenderProps["onAction"]; disabled?: boolean }) {
  const isDanger = btn.style === "danger";
  const isPrimary = btn.style === "primary";
  const cls = isDanger
    ? "border border-[#E01E5A] text-[#E01E5A] hover:bg-[#E01E5A]/10"
    : isPrimary
    ? "bg-acko-sage hover:bg-acko-sageDark text-white border border-acko-sageDark"
    : "border border-slack-border text-slack-textPrimary hover:bg-slack-divider/40 bg-white";
  return (
    <button
      onClick={() => onAction?.(btn)}
      disabled={disabled}
      className={`px-3 py-1.5 rounded font-semibold text-[13px] ${cls} ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
    >
      {btn.text.text}
    </button>
  );
}

function SelectEl({ sel, onAction, disabled }: { sel: ActionSelect; onAction?: BlockRenderProps["onAction"]; disabled?: boolean }) {
  return (
    <select
      disabled={disabled}
      defaultValue=""
      onChange={(e) => {
        const opt = sel.options.find((o) => o.value === e.target.value);
        if (opt) onAction?.({ ...sel, action_id: sel.action_id, nextBeatId: opt.nextBeatId } as any, opt.value);
      }}
      className={`px-3 py-1.5 rounded font-semibold text-[13px] border border-slack-border bg-white ${
        disabled ? "opacity-60 cursor-not-allowed" : ""
      }`}
    >
      <option value="" disabled>
        {sel.placeholder.text}
      </option>
      {sel.options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.text.text}
        </option>
      ))}
    </select>
  );
}

export function renderBlocks(blocks: Block[] | undefined, message: Message, onAction?: BlockRenderProps["onAction"], disabled?: boolean) {
  if (!blocks || blocks.length === 0) return null;
  return blocks.map((b, i) => <NativeBlock key={i} block={b} message={message} onAction={onAction} disabled={disabled} />);
}
