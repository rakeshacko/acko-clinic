import React, { useEffect, useState } from "react";
import { useStore } from "../store";
import { FORMS } from "../forms/specs";

// Walk-in modal opened by `/walkin` slash command. Creates a walk-in scenario
// instance on submit.

export function WalkinModal() {
  const [open, setOpen] = useState(false);
  const startScenario = useStore((s) => s.startScenario);
  const registered = useStore((s) => s.scenarios);
  const setActiveChannel = useStore((s) => s.setActiveChannel);

  useEffect(() => {
    const h = () => setOpen(true);
    window.addEventListener("acko:open-walkin", h as any);
    return () => window.removeEventListener("acko:open-walkin", h as any);
  }, []);

  if (!open) return null;
  const spec = FORMS.walkin;

  const initialValues = spec.fields.reduce<Record<string, any>>((acc, f) => {
    acc[f.id] = f.default ?? (f.type === "checkbox" ? false : "");
    return acc;
  }, {});

  return (
    <Inner
      spec={spec}
      onCancel={() => setOpen(false)}
      onSubmit={(values) => {
        setOpen(false);
        const isMember = !!values.member;
        const scenarioId = isMember ? "walkin-member" : "walkin-nonmember";
        if (!registered[scenarioId]) {
          alert(`Walk-in scenario "${scenarioId}" not yet registered.`);
          return;
        }
        // We could thread the form values into the scenario seed in a future iteration; for now we just launch.
        const inst = startScenario(scenarioId);
        const ch = useStore.getState().instances[inst]?.channelId;
        if (ch) setActiveChannel(ch);
      }}
      initialValues={initialValues}
    />
  );
}

function Inner({
  spec,
  onCancel,
  onSubmit,
  initialValues,
}: {
  spec: any;
  onCancel: () => void;
  onSubmit: (values: Record<string, any>) => void;
  initialValues: Record<string, any>;
}) {
  const [values, setValues] = useState<Record<string, any>>(initialValues);
  return (
    <div className="fixed inset-0 z-40 bg-black/50 flex items-end md:items-center justify-center p-0 md:p-6">
      <div className="bg-white rounded-t-lg md:rounded-lg shadow-2xl w-full md:w-[520px] max-h-[85vh] md:max-h-[90vh] flex flex-col">
        <div className="px-5 py-3 border-b border-slack-border flex items-center justify-between">
          <div className="font-extrabold text-[16px]">{spec.title}</div>
          <button className="text-slack-textSecondary text-2xl leading-none" onClick={onCancel}>
            ×
          </button>
        </div>
        <div className="overflow-y-auto slack-scroll px-4 md:px-5 py-3 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
          {spec.fields.map((f: any) => (
            <div key={f.id} className={!f.inline && f.type !== "checkbox" ? "md:col-span-2" : "md:col-span-1"}>
              <label className="block text-[12px] uppercase tracking-wide text-slack-textSecondary font-bold mb-1">{f.label}</label>
              {f.type === "select" ? (
                <select
                  value={values[f.id] ?? ""}
                  onChange={(e) => setValues((v: any) => ({ ...v, [f.id]: e.target.value }))}
                  className="w-full px-2 py-1.5 border border-slack-border rounded text-[14px]"
                >
                  {f.options.map((o: string) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              ) : f.type === "checkbox" ? (
                <label className="flex items-center gap-2 mt-3 text-[14px]">
                  <input
                    type="checkbox"
                    checked={!!values[f.id]}
                    onChange={(e) => setValues((v: any) => ({ ...v, [f.id]: e.target.checked }))}
                    className="w-4 h-4 accent-acko-sage"
                  />
                  {f.label}
                </label>
              ) : (
                <input
                  type={f.type}
                  value={values[f.id] ?? ""}
                  onChange={(e) =>
                    setValues((v: any) => ({ ...v, [f.id]: f.type === "number" ? Number(e.target.value) : e.target.value }))
                  }
                  className="w-full px-2 py-1.5 border border-slack-border rounded text-[14px]"
                />
              )}
            </div>
          ))}
        </div>
        <div className="px-5 py-3 border-t border-slack-border flex items-center justify-end gap-2 bg-acko-warm/30">
          <button onClick={onCancel} className="px-3 py-1.5 rounded font-semibold text-[13px] border border-slack-border bg-white">
            Cancel
          </button>
          <button
            onClick={() => onSubmit(values)}
            className="px-3 py-1.5 rounded font-semibold text-[13px] bg-acko-sage hover:bg-acko-sageDark text-white border border-acko-sageDark"
          >
            Create visit
          </button>
        </div>
      </div>
    </div>
  );
}
