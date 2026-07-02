const REMEDY_STEPS = [
  { key: "monetary", label: "Refund" },
  { key: "compensation", label: "Compensation" },
  { key: "apology", label: "Apology" },
  { key: "correction", label: "Correction" },
  { key: "dismissal", label: "Dismissal" },
];

export function RemedyBar({
  supportsMonetary,
  supportsSymbolic,
}: {
  supportsMonetary: boolean;
  supportsSymbolic: boolean;
}) {
  const active: Record<string, boolean> = {
    monetary: supportsMonetary,
    compensation: supportsMonetary,
    apology: supportsSymbolic,
    correction: supportsSymbolic,
    dismissal: true,
  };

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {REMEDY_STEPS.map((step) => (
        <span
          key={step.key}
          className="text-[10px] mono px-1.5 py-0.5 rounded"
          style={{
            color: active[step.key] ? "var(--deep-ink)" : "var(--soft-grey)",
            background: active[step.key] ? "var(--redress-amber)" : "transparent",
            border: `1px solid ${active[step.key] ? "var(--redress-amber)" : "var(--line-ash)"}44`,
            opacity: active[step.key] ? 1 : 0.5,
          }}
        >
          {step.label}
        </span>
      ))}
    </div>
  );
}
