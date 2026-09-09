import type { HarmCategory, RemedyType, Verdict, CaseStatus } from "./types";

export const HARM_CATEGORY_LABELS: Record<HarmCategory, string> = {
  service_failure: "Service Failure",
  non_delivery: "Non-Delivery",
  delayed_delivery: "Delayed Delivery",
  misleading_information: "Misleading Information",
  unfair_moderation: "Unfair Moderation",
  contributor_mistreatment: "Contributor Mistreatment",
  payment_dispute: "Payment Dispute",
  product_defect: "Product Defect",
  broken_promise: "Broken Promise",
  policy_violation: "Policy Violation",
  reputational_harm: "Reputational Harm",
  other: "Other",
};

export const REMEDY_TYPE_LABELS: Record<RemedyType, string> = {
  full_refund: "Full Refund",
  partial_refund: "Partial Refund",
  fixed_compensation: "Fixed Compensation",
  service_credit: "Service Credit",
  apology_public: "Public Apology",
  apology_private: "Private Apology",
  correction_required: "Correction",
  replacement_or_repair: "Replacement / Repair",
  acknowledgement_only: "Acknowledgement Only",
  no_remedy: "No Remedy",
  manual_review: "Manual Review",
};

export const VERDICT_LABELS: Record<Verdict, string> = {
  claim_upheld_full: "Claim Upheld — Full",
  claim_upheld_partial: "Claim Upheld — Partial",
  symbolic_redress_only: "Symbolic Redress Only",
  respondent_already_remedied: "Already Remedied",
  needs_more_information: "Needs More Information",
  dismissed_no_harm: "Dismissed — No Harm",
  dismissed_insufficient_evidence: "Dismissed — Insufficient Evidence",
  dismissed_bad_faith: "Dismissed — Bad Faith",
  escalated_human_review: "Escalated for Human Review",
};

export const CASE_STATUS_LABELS: Record<CaseStatus, string> = {
  awaiting_response: "Awaiting Response",
  response_submitted: "Response Submitted",
  evidence_locked: "Evidence Locked",
  under_genlayer_review: "Under GenLayer Review",
  verdict_issued: "Verdict Issued",
  settlement_pending: "Settlement Pending",
  symbolic_completion_pending: "Symbolic Completion Pending",
  closed: "Closed",
  dismissed: "Dismissed",
  escalated: "Escalated",
  challenge_pending: "Challenge Pending",
  finalized: "Finalized",
};

export const REMEDY_BAR_ORDER: RemedyType[] = [
  "full_refund", "partial_refund", "fixed_compensation", "service_credit",
  "apology_public", "apology_private", "correction_required", "no_remedy",
];

export const SYMBOLIC_REMEDIES: RemedyType[] = [
  "apology_public", "apology_private", "correction_required", "acknowledgement_only",
];

export const PROPORTIONALITY_ORDER = [
  "dismissal", "acknowledgement", "apology", "partial_refund", "full_compensation", "escalation",
] as const;

export function verdictToProportionalityIndex(verdict: Verdict, remedyType: RemedyType): number {
  if (verdict === "escalated_human_review") return 5;
  if (verdict.startsWith("dismissed")) return 0;
  if (remedyType === "acknowledgement_only") return 1;
  if (remedyType === "apology_public" || remedyType === "apology_private" || remedyType === "correction_required" || remedyType === "replacement_or_repair") return 2;
  if (remedyType === "partial_refund" || remedyType === "service_credit") return 3;
  if (remedyType === "full_refund" || remedyType === "fixed_compensation") return 4;
  return 1;
}

export function snakeToReadable(value: string): string {
  return value
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function bpsToPercent(bps: number): string {
  return `${(bps / 100).toFixed(bps % 100 === 0 ? 0 : 1)}%`;
}

export function weiToGen(wei: number | string): string {
  const n = typeof wei === "string" ? Number(wei) : wei;
  if (!n) return "0";
  const gen = n / 1e18;
  return gen.toLocaleString(undefined, { maximumFractionDigits: 4 });
}

export function genToWei(gen: number | string): bigint {
  const n = typeof gen === "string" ? parseFloat(gen) : gen;
  if (!n || isNaN(n)) return BigInt(0);
  return BigInt(Math.round(n * 1e18));
}

export const VERDICT_COLOR: Record<string, string> = {
  claim_upheld_full: "var(--remedy-green)",
  claim_upheld_partial: "var(--redress-amber)",
  symbolic_redress_only: "var(--process-blue)",
  respondent_already_remedied: "var(--process-blue)",
  needs_more_information: "var(--soft-grey)",
  dismissed_no_harm: "var(--civic-slate)",
  dismissed_insufficient_evidence: "var(--civic-slate)",
  dismissed_bad_faith: "var(--civic-slate)",
  escalated_human_review: "var(--harm-clay)",
};

export const CASE_STATUS_ORDER: CaseStatus[] = [
  "awaiting_response", "response_submitted", "evidence_locked",
  "under_genlayer_review", "verdict_issued", "settlement_pending",
  "symbolic_completion_pending", "closed",
];
