import { verdictToProportionalityIndex } from "@/lib/constants";
import type { Verdict, RemedyType } from "@/lib/types";

const LABELS = ["Dismissal", "Acknowledgement", "Apology", "Partial Refund", "Full Compensation", "Escalation"];
const COLORS = [
  "var(--civic-slate)", "var(--soft-grey)", "var(--process-blue)",
  "var(--redress-amber)", "var(--remedy-green)", "var(--harm-clay)",
];

export function ProportionalityDial({ verdict, remedyType }: { verdict: Verdict; remedyType: RemedyType }) {
  const index = verdictToProportionalityIndex(verdict, remedyType);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-2 rounded-full overflow-hidden">
        {LABELS.map((_, i) => (
          <div key={i} className="flex-1" style={{ background: COLORS[i], opacity: i === index ? 1 : 0.2 }} />
        ))}
      </div>
      <div className="flex justify-between">
        {LABELS.map((label, i) => (
          <span
            key={label}
            className="text-[9px] mono text-center flex-1"
            style={{ color: i === index ? COLORS[i] : "var(--soft-grey)", fontWeight: i === index ? 600 : 400 }}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
