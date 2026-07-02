import { CASE_STATUS_LABELS } from "@/lib/constants";
import type { CaseStatus } from "@/lib/types";

const STATUS_COLOR: Record<string, string> = {
  awaiting_response: "var(--process-blue)",
  response_submitted: "var(--process-blue)",
  evidence_locked: "var(--soft-grey)",
  under_genlayer_review: "var(--redress-amber)",
  verdict_issued: "var(--redress-amber)",
  settlement_pending: "var(--redress-amber)",
  symbolic_completion_pending: "var(--process-blue)",
  closed: "var(--remedy-green)",
  dismissed: "var(--soft-grey)",
  escalated: "var(--harm-clay)",
};

export function CaseStatusBadge({ status }: { status: CaseStatus | string }) {
  const color = STATUS_COLOR[status] || "var(--soft-grey)";
  const label = CASE_STATUS_LABELS[status as CaseStatus] || status;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium mono"
      style={{ color, background: `${color}18`, border: `1px solid ${color}44` }}
    >
      <span className="w-1.5 h-1.5 rounded-full pulse-soft" style={{ background: color }} />
      {label}
    </span>
  );
}
