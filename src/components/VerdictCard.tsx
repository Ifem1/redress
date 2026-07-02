import { VERDICT_LABELS, REMEDY_TYPE_LABELS, VERDICT_COLOR, bpsToPercent, weiToGen, snakeToReadable } from "@/lib/constants";
import { ProportionalityDial } from "./ProportionalityDial";
import type { RedressVerdict } from "@/lib/types";

export function VerdictCard({ verdict }: { verdict: RedressVerdict }) {
  const color = VERDICT_COLOR[verdict.verdict] || "var(--soft-grey)";

  return (
    <div className="case-sheet p-5 flex flex-col gap-4" style={{ boxShadow: `0 0 24px ${color}22` }}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-xs text-[var(--soft-grey)] mono">GenLayer Consensus Verdict</p>
          <h3 className="font-display text-xl" style={{ color }}>
            {VERDICT_LABELS[verdict.verdict]}
          </h3>
        </div>
        <span className="text-xs mono px-2 py-1 rounded" style={{ background: `${color}18`, color, border: `1px solid ${color}44` }}>
          {verdict.confidence}% confidence
        </span>
      </div>

      <ProportionalityDial verdict={verdict.verdict} remedyType={verdict.remedy_type} />

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-[var(--soft-grey)]">Remedy</p>
          <p className="mono">{REMEDY_TYPE_LABELS[verdict.remedy_type]}</p>
        </div>
        <div>
          <p className="text-xs text-[var(--soft-grey)]">Compensation</p>
          <p className="mono">{bpsToPercent(verdict.compensation_bps)}</p>
        </div>
        <div>
          <p className="text-xs text-[var(--soft-grey)]">Approved Amount</p>
          <p className="mono">{verdict.approved_amount ? `${weiToGen(verdict.approved_amount)} GEN` : "—"}</p>
        </div>
        <div>
          <p className="text-xs text-[var(--soft-grey)]">Severity / Responsibility</p>
          <p className="mono capitalize">{verdict.severity} · {verdict.responsibility}</p>
        </div>
      </div>

      <div className="pt-3 border-t border-[var(--line-ash)]/40">
        <p className="text-xs text-[var(--soft-grey)] mb-1">Reasoning</p>
        <p className="text-sm">{snakeToReadable(verdict.short_reason)}</p>
      </div>
    </div>
  );
}
