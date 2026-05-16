import React, { useEffect, useMemo, useState } from "react";
import { useStore } from "../store";
import { FORMS } from "../forms/specs";

export function FormModal() {
  const pending = useStore((s) => s.pendingForm);
  const submit = useStore((s) => s.submitForm);
  const cancel = useStore((s) => s.cancelForm);
  if (!pending) return null;
  const spec = FORMS[pending.formId];
  if (!spec) return null;
  return <FormModalInner formId={pending.formId} beatId={pending.beatId} instanceId={pending.instanceId} key={pending.formId + pending.beatId} onCancel={cancel} onSubmit={(vals, branchNext) => submit(pending.instanceId, pending.beatId, vals, branchNext)} />;
}

function FormModalInner({
  formId,
  beatId,
  onCancel,
  onSubmit,
}: {
  formId: string;
  beatId: string;
  instanceId: string;
  onCancel: () => void;
  onSubmit: (values: Record<string, any>, branchNextBeatId?: string) => void;
}) {
  const spec = FORMS[formId];
  const initial = useMemo(() => {
    const v: Record<string, any> = {};
    for (const f of spec.fields) v[f.id] = f.default ?? (f.type === "checkbox" ? false : "");
    return v;
  }, [spec]);
  const [values, setValues] = useState(initial);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-40 bg-black/50 flex items-center justify-center p-6">
      <div className="bg-white rounded-lg shadow-2xl w-[560px] max-h-[90vh] flex flex-col">
        <div className="px-5 py-3 border-b border-slack-border flex items-center justify-between flex-shrink-0">
          <div className="font-extrabold text-[16px]">{spec.title}</div>
          <button className="text-slack-textSecondary text-2xl leading-none" onClick={onCancel}>
            ×
          </button>
        </div>
        <div className="overflow-y-auto slack-scroll px-5 py-3 grid grid-cols-2 gap-x-4 gap-y-2">
          {spec.fields.map((f) => (
            <div key={f.id} className={f.type === "textarea" || (!f.inline && f.type !== "checkbox") ? "col-span-2" : "col-span-1"}>
              <FormField field={f} value={values[f.id]} onChange={(v) => setValues((vs) => ({ ...vs, [f.id]: v }))} />
            </div>
          ))}
        </div>
        <div className="px-5 py-3 border-t border-slack-border flex items-center justify-end gap-2 flex-shrink-0 bg-acko-warm/30">
          {spec.branchButtons?.map((b, i) => (
            <button
              key={i}
              onClick={() => onSubmit(values, b.nextBeatId)}
              className="px-3 py-1.5 rounded font-semibold text-[13px] border border-[#E01E5A] text-[#E01E5A] hover:bg-[#E01E5A]/10"
            >
              {b.label}
            </button>
          ))}
          <div className="flex-1" />
          <button
            onClick={onCancel}
            className="px-3 py-1.5 rounded font-semibold text-[13px] border border-slack-border bg-white text-slack-textPrimary hover:bg-slack-divider/40"
          >
            Cancel
          </button>
          <button
            onClick={() => onSubmit(values)}
            className="px-3 py-1.5 rounded font-semibold text-[13px] bg-acko-sage hover:bg-acko-sageDark text-white border border-acko-sageDark"
          >
            {spec.submitLabel ?? "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}

function FormField({ field, value, onChange }: { field: any; value: any; onChange: (v: any) => void }) {
  const label = (
    <label className="block text-[12px] uppercase tracking-wide text-slack-textSecondary font-bold mb-1">{field.label}{field.required ? " *" : ""}</label>
  );
  if (field.type === "text" || field.type === "number") {
    return (
      <div>
        {label}
        <input
          type={field.type}
          value={value ?? ""}
          placeholder={field.placeholder}
          onChange={(e) => onChange(field.type === "number" ? Number(e.target.value) : e.target.value)}
          className="w-full px-2 py-1.5 text-[14px] border border-slack-border rounded focus:outline-none focus:ring-2 focus:ring-acko-sage/40"
        />
        {field.hint && <div className="text-[11px] text-slack-textSecondary mt-0.5">{field.hint}</div>}
      </div>
    );
  }
  if (field.type === "textarea") {
    return (
      <div>
        {label}
        <textarea
          rows={2}
          value={value ?? ""}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-2 py-1.5 text-[14px] border border-slack-border rounded focus:outline-none focus:ring-2 focus:ring-acko-sage/40"
        />
      </div>
    );
  }
  if (field.type === "select") {
    return (
      <div>
        {label}
        <select
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-2 py-1.5 text-[14px] border border-slack-border rounded bg-white focus:outline-none focus:ring-2 focus:ring-acko-sage/40"
        >
          {field.options.map((o: string) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </div>
    );
  }
  if (field.type === "checkbox") {
    return (
      <label className="flex items-center gap-2 text-[14px] mt-3">
        <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} className="w-4 h-4 accent-acko-sage" />
        <span>{field.label}</span>
      </label>
    );
  }
  return null;
}
