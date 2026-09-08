export type HarmCategory =
  | "service_failure" | "non_delivery" | "delayed_delivery"
  | "misleading_information" | "unfair_moderation" | "contributor_mistreatment"
  | "payment_dispute" | "product_defect" | "broken_promise"
  | "policy_violation" | "reputational_harm" | "other";

export type RemedyType =
  | "full_refund" | "partial_refund" | "fixed_compensation" | "service_credit"
  | "apology_public" | "apology_private" | "correction_required"
  | "replacement_or_repair" | "acknowledgement_only" | "no_remedy" | "manual_review";

export type Verdict =
  | "claim_upheld_full" | "claim_upheld_partial" | "symbolic_redress_only"
  | "respondent_already_remedied" | "needs_more_information"
  | "dismissed_no_harm" | "dismissed_insufficient_evidence"
  | "dismissed_bad_faith" | "escalated_human_review";

export type Severity = "low" | "medium" | "high" | "critical";
export type Responsibility = "respondent" | "claimant" | "shared" | "unclear" | "external";

export type CaseStatus =
  | "awaiting_response" | "response_submitted" | "evidence_locked"
  | "under_genlayer_review" | "verdict_issued" | "settlement_pending"
  | "symbolic_completion_pending" | "closed" | "dismissed" | "escalated"
  | "challenge_pending" | "finalized";

export interface Venue {
  venue_id: string;
  owner: string;
  name: string;
  scope: string;
  policy_url: string;
  max_compensation: string;
  response_window_seconds: string;
  accepts_monetary_claims: boolean;
  accepts_symbolic_claims: boolean;
  active: boolean;
  pool_balance: number;
  pool_reserved: number;
  pool_paid: number;
  created_at: string;
}

export interface ComplaintCase {
  case_id: string;
  venue_id: string;
  claimant: string;
  respondent: string;
  title: string;
  harm_category: HarmCategory;
  requested_remedy: RemedyType;
  claimed_amount: number;
  complaint_text: string;
  evidence_urls_json: string;
  incident_date_text: string;
  status: CaseStatus;
  created_at: string;
  response_deadline: number;
  evidence_locked: boolean;
  latest_verdict_id: string;
  locked_at?: string;
  verdict_at?: string;
  settled_at?: string;
  closed_at?: string;
  challenge_status?: "open" | "submitted" | "completed" | "closed";
  challenge_reason?: string;
  challenge_deadline?: string;
  finalized_at?: string;
  symbolic_completion_note?: string;
  symbolic_completion_proof_url?: string;
  symbolic_completed_at?: string;
}

export interface RespondentReply {
  case_id: string;
  reply_text: string;
  counter_evidence_urls_json: string;
  settlement_offer_type: string;
  settlement_offer_amount: number;
  replied_at: string;
}

export interface RedressVerdict {
  verdict_id: string;
  case_id: string;
  verdict: Verdict;
  remedy_type: RemedyType;
  compensation_bps: number;
  approved_amount: number;
  severity: Severity;
  responsibility: Responsibility;
  confidence: number;
  short_reason: string;
  evidence_packet?: Array<{ source_type: string; source_url: string; retrieval_status: string }>;
  decided_at: string;
  original_decision?: RedressVerdict;
  reviewed_decision?: RedressVerdict;
}

export interface WalletActivity {
  activity_id: string;
  wallet: string;
  action: string;
  case_id: string;
  tx_summary: string;
  created_at: string;
}

export interface PoolStats {
  venue_id: string;
  pool_balance: number;
  pool_paid: number;
  max_compensation: number;
  active_cases: number;
  resolved_cases: number;
  total_cases: number;
}

export interface ContractSummary {
  deployer: string;
  paused: boolean;
  contract_version: string;
  venue_counter: string;
  case_counter: string;
  verdict_counter: string;
  activity_counter: string;
  audit_counter: string;
}
