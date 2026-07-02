# v0.2.18
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *

import json
import typing
from datetime import datetime, timezone


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


class RedressProtocol(gl.Contract):
    """
    RedressProtocol — Redress

    A decentralized complaint and compensation protocol.

    Product purpose:
    Redress lets users file structured harm claims against services, DAOs,
    products, communities, or contributors. Instead of a binary "guilty or
    not guilty" ruling, GenLayer validators interpret the complaint, the
    respondent's answer, the evidence, the venue policy, and the requested
    remedy, then decide what form of redress is fair: full or partial
    refund, fixed compensation, service credit, public or private apology,
    correction, acknowledgement, dismissal, or escalation to human review.

    Not every harm needs punishment. Not every complaint deserves payout.
    But every serious claim deserves structured interpretation.

    What belongs on-chain:
    - venue registry, scope, policy reference, and compensation pool
    - complaint case records and their lifecycle status
    - respondent replies and settlement offers
    - locked evidence packets (URLs / references, not raw files)
    - GenLayer consensus redress verdicts
    - settlement and symbolic-completion records
    - wallet activity index and audit trail

    What stays off-chain:
    - full evidence files, screenshots, contracts, chat logs. Only URLs or
      references belong here.
    """

    deployer: str
    paused: bool

    venue_counter: u256
    case_counter: u256
    verdict_counter: u256
    activity_counter: u256
    audit_counter: u256

    venues: TreeMap[str, str]          # venue_id -> Venue JSON
    cases: TreeMap[str, str]           # case_id -> ComplaintCase JSON
    replies: TreeMap[str, str]         # case_id -> RespondentReply JSON
    verdicts: TreeMap[str, str]        # case_id -> RedressVerdict JSON
    activities: TreeMap[str, str]      # activity_id -> Activity JSON
    audit_logs: TreeMap[str, str]      # audit_id -> AuditLog JSON

    all_venue_index: str                     # pipe-separated venue_ids
    owner_venue_index: TreeMap[str, str]      # owner -> venue_ids
    venue_case_index: TreeMap[str, str]       # venue_id -> case_ids
    claimant_case_index: TreeMap[str, str]    # claimant -> case_ids
    respondent_case_index: TreeMap[str, str]  # respondent -> case_ids
    status_case_index: TreeMap[str, str]      # status -> case_ids
    wallet_activity_index: TreeMap[str, str]  # wallet -> activity_ids
    case_audit_index: TreeMap[str, str]       # case_id -> audit_ids

    def __init__(self) -> None:
        self.deployer = gl.message.sender_address.as_hex
        self.paused = False

        self.venue_counter = u256(0)
        self.case_counter = u256(0)
        self.verdict_counter = u256(0)
        self.activity_counter = u256(0)
        self.audit_counter = u256(0)

        self.venues = TreeMap()
        self.cases = TreeMap()
        self.replies = TreeMap()
        self.verdicts = TreeMap()
        self.activities = TreeMap()
        self.audit_logs = TreeMap()

        self.all_venue_index = ""
        self.owner_venue_index = TreeMap()
        self.venue_case_index = TreeMap()
        self.claimant_case_index = TreeMap()
        self.respondent_case_index = TreeMap()
        self.status_case_index = TreeMap()
        self.wallet_activity_index = TreeMap()
        self.case_audit_index = TreeMap()

    # ──────────────────────────────────────────────────────────────────────────
    # Internal helpers
    # ──────────────────────────────────────────────────────────────────────────

    def _sender(self) -> str:
        return gl.message.sender_address.as_hex.lower()

    def _json(self, value: typing.Any) -> str:
        return json.dumps(value, sort_keys=True)

    def _load(self, raw: str) -> typing.Any:
        if raw is None or raw == "":
            return {}
        return json.loads(raw)

    def _require_not_paused(self) -> None:
        if self.paused:
            raise gl.vm.UserError("Contract is paused")

    def _require_deployer(self) -> None:
        if self._sender() != self.deployer.lower():
            raise gl.vm.UserError("Only deployer")

    def _require_non_empty(self, value: str, field_name: str) -> None:
        if value is None or len(value.strip()) == 0:
            raise gl.vm.UserError(field_name + " is required")

    def _limit(self, value: typing.Any, max_len: int) -> str:
        text = str(value) if value is not None else ""
        if len(text) > max_len:
            return text[:max_len]
        return text

    def _to_int(self, value: typing.Any, fallback: int = 0) -> int:
        try:
            return int(value)
        except Exception:
            return fallback

    def _bounded_score(self, value: typing.Any, fallback: int) -> int:
        score = self._to_int(value, fallback)
        if score < 0:
            return 0
        if score > 100:
            return 100
        return score

    def _bounded_bps(self, value: typing.Any, fallback: int) -> int:
        bps = self._to_int(value, fallback)
        if bps < 0:
            return 0
        if bps > 10000:
            return 10000
        return bps

    def _append(self, existing: str, item: str) -> str:
        if existing is None or existing == "":
            return item
        return existing + "|" + item

    def _append_unique(self, existing: str, item: str) -> str:
        if existing is None or existing == "":
            return item
        parts = existing.split("|")
        for part in parts:
            if part == item:
                return existing
        return existing + "|" + item

    def _remove_from_pipe_list(self, existing: str, item: str) -> str:
        if existing is None or existing == "":
            return ""
        parts = [p for p in existing.split("|") if p != item]
        return "|".join(parts)

    def _split_ids(self, raw: str) -> typing.List[str]:
        if raw is None or raw == "":
            return []
        return [p.strip() for p in raw.split("|") if p.strip() != ""]

    def _next_venue_id(self) -> str:
        self.venue_counter = self.venue_counter + u256(1)
        return "VENUE-" + str(self.venue_counter)

    def _next_case_id(self) -> str:
        self.case_counter = self.case_counter + u256(1)
        return "CASE-" + str(self.case_counter)

    def _next_verdict_id(self) -> str:
        self.verdict_counter = self.verdict_counter + u256(1)
        return "VRD-" + str(self.verdict_counter)

    def _next_activity_id(self) -> str:
        self.activity_counter = self.activity_counter + u256(1)
        return "ACT-" + str(self.activity_counter)

    def _next_audit_id(self) -> str:
        self.audit_counter = self.audit_counter + u256(1)
        return "AUDIT-" + str(self.audit_counter)

    def _require_venue_exists(self, venue_id: str) -> typing.Any:
        raw = self.venues.get(venue_id, "")
        if raw == "":
            raise gl.vm.UserError("Venue not found: " + venue_id)
        return self._load(raw)

    def _require_case_exists(self, case_id: str) -> typing.Any:
        raw = self.cases.get(case_id, "")
        if raw == "":
            raise gl.vm.UserError("Case not found: " + case_id)
        return self._load(raw)

    def _require_case_claimant(self, case: typing.Any) -> None:
        if case.get("claimant", "").lower() != self._sender():
            raise gl.vm.UserError("Only claimant")

    def _require_case_respondent(self, case: typing.Any) -> None:
        if case.get("respondent", "").lower() != self._sender():
            raise gl.vm.UserError("Only respondent")

    def _record_activity(self, wallet: str, action: str, case_id: str, tx_summary: str) -> None:
        activity_id = self._next_activity_id()
        record = {
            "activity_id": activity_id,
            "wallet": wallet.lower(),
            "action": action,
            "case_id": case_id,
            "tx_summary": self._limit(tx_summary, 300),
            "created_at": _now(),
        }
        self.activities[activity_id] = self._json(record)
        self.wallet_activity_index[wallet.lower()] = self._append(
            self.wallet_activity_index.get(wallet.lower(), ""), activity_id
        )

    def _record_audit(self, case_id: str, event_type: str, actor: str, summary: str) -> str:
        audit_id = self._next_audit_id()
        entry = {
            "audit_id": audit_id,
            "case_id": case_id,
            "event_type": event_type,
            "actor": actor.lower(),
            "summary": self._limit(summary, 600),
            "created_at": _now(),
        }
        self.audit_logs[audit_id] = self._json(entry)
        if case_id != "":
            self.case_audit_index[case_id] = self._append(
                self.case_audit_index.get(case_id, ""), audit_id
            )
        return audit_id

    def _update_status_index(self, old_status: str, new_status: str, case_id: str) -> None:
        if old_status != "":
            self.status_case_index[old_status] = self._remove_from_pipe_list(
                self.status_case_index.get(old_status, ""), case_id
            )
        self.status_case_index[new_status] = self._append_unique(
            self.status_case_index.get(new_status, ""), case_id
        )

    # ──────────────────────────────────────────────────────────────────────────
    # Enum normalisation
    # ──────────────────────────────────────────────────────────────────────────

    ALLOWED_HARM_CATEGORIES = (
        "service_failure", "non_delivery", "delayed_delivery",
        "misleading_information", "unfair_moderation",
        "contributor_mistreatment", "payment_dispute", "product_defect",
        "broken_promise", "policy_violation", "reputational_harm", "other",
    )

    ALLOWED_VERDICTS = (
        "claim_upheld_full", "claim_upheld_partial", "symbolic_redress_only",
        "respondent_already_remedied", "needs_more_information",
        "dismissed_no_harm", "dismissed_insufficient_evidence",
        "dismissed_bad_faith", "escalated_human_review",
    )

    ALLOWED_REMEDY_TYPES = (
        "full_refund", "partial_refund", "fixed_compensation", "service_credit",
        "apology_public", "apology_private", "correction_required",
        "replacement_or_repair", "acknowledgement_only", "no_remedy", "manual_review",
    )

    ALLOWED_SEVERITIES = ("low", "medium", "high", "critical")

    ALLOWED_RESPONSIBILITY = ("respondent", "claimant", "shared", "unclear", "external")

    def _normalise_harm_category(self, value: str) -> str:
        v = value.strip().lower()
        if v not in self.ALLOWED_HARM_CATEGORIES:
            raise gl.vm.UserError("Invalid harm_category: " + value)
        return v

    def _normalise_remedy_type_input(self, value: str) -> str:
        v = value.strip().lower()
        if v not in self.ALLOWED_REMEDY_TYPES:
            raise gl.vm.UserError("Invalid requested remedy: " + value)
        return v

    def _normalise_verdict(self, value: typing.Any) -> str:
        v = str(value).strip().lower()
        if v in self.ALLOWED_VERDICTS:
            return v
        return "needs_more_information"

    def _normalise_remedy_type(self, value: typing.Any) -> str:
        v = str(value).strip().lower()
        if v in self.ALLOWED_REMEDY_TYPES:
            return v
        return "manual_review"

    def _normalise_severity(self, value: typing.Any) -> str:
        v = str(value).strip().lower()
        if v in self.ALLOWED_SEVERITIES:
            return v
        return "medium"

    def _normalise_responsibility(self, value: typing.Any) -> str:
        v = str(value).strip().lower()
        if v in self.ALLOWED_RESPONSIBILITY:
            return v
        return "unclear"

    def _normalise_verdict_payload(self, raw: typing.Any) -> typing.Any:
        if isinstance(raw, str):
            parsed = json.loads(raw)
        else:
            parsed = raw

        return {
            "verdict": self._normalise_verdict(parsed.get("verdict", "needs_more_information")),
            "remedy_type": self._normalise_remedy_type(parsed.get("remedy_type", "manual_review")),
            "compensation_bps": self._bounded_bps(parsed.get("compensation_bps", 0), 0),
            "severity": self._normalise_severity(parsed.get("severity", "medium")),
            "responsibility": self._normalise_responsibility(parsed.get("responsibility", "unclear")),
            "confidence": self._bounded_score(parsed.get("confidence", 50), 50),
            "short_reason": self._limit(parsed.get("short_reason", ""), 600),
        }

    def _inconclusive_verdict(self) -> typing.Any:
        return {
            "verdict": "needs_more_information",
            "remedy_type": "manual_review",
            "compensation_bps": 0,
            "severity": "medium",
            "responsibility": "unclear",
            "confidence": 0,
            "short_reason": "Consensus could not be reached; please resubmit with more evidence.",
        }

    def _status_from_verdict(self, verdict: str) -> str:
        mapping = {
            "claim_upheld_full": "settlement_pending",
            "claim_upheld_partial": "settlement_pending",
            "symbolic_redress_only": "symbolic_completion_pending",
            "respondent_already_remedied": "closed",
            "needs_more_information": "verdict_issued",
            "dismissed_no_harm": "dismissed",
            "dismissed_insufficient_evidence": "dismissed",
            "dismissed_bad_faith": "dismissed",
            "escalated_human_review": "escalated",
        }
        return mapping.get(verdict, "verdict_issued")

    def _is_monetary_remedy(self, remedy_type: str) -> bool:
        return remedy_type in ("full_refund", "partial_refund", "fixed_compensation", "service_credit")

    # ──────────────────────────────────────────────────────────────────────────
    # Contract status
    # ──────────────────────────────────────────────────────────────────────────

    @gl.public.view
    def get_deployer(self) -> str:
        return self.deployer

    @gl.public.view
    def get_contract_version(self) -> str:
        return "1.0.0"

    @gl.public.view
    def is_paused(self) -> bool:
        return self.paused

    @gl.public.write
    def pause_contract(self) -> None:
        self._require_deployer()
        self.paused = True
        self._record_audit("", "CONTRACT_PAUSED", self._sender(), "Contract paused by deployer")

    @gl.public.write
    def unpause_contract(self) -> None:
        self._require_deployer()
        self.paused = False
        self._record_audit("", "CONTRACT_UNPAUSED", self._sender(), "Contract unpaused by deployer")

    # ──────────────────────────────────────────────────────────────────────────
    # 1. Create Venue / Fund Pool
    # ──────────────────────────────────────────────────────────────────────────

    @gl.public.write
    def create_venue(
        self,
        name: str,
        scope: str,
        policy_url: str,
        max_compensation: u256,
        response_window_seconds: u256,
        accepts_monetary_claims: bool,
        accepts_symbolic_claims: bool,
    ) -> str:
        self._require_not_paused()
        self._require_non_empty(name, "name")
        if not accepts_monetary_claims and not accepts_symbolic_claims:
            raise gl.vm.UserError("At least one remedy mode must be enabled")
        if int(response_window_seconds) < 3600:
            raise gl.vm.UserError("response_window_seconds must be at least 1 hour")

        sender = self._sender()
        venue_id = self._next_venue_id()
        now = _now()

        record = {
            "venue_id": venue_id,
            "owner": sender,
            "name": self._limit(name, 200),
            "scope": self._limit(scope, 1200),
            "policy_url": self._limit(policy_url, 600),
            "max_compensation": str(int(max_compensation)),
            "response_window_seconds": str(int(response_window_seconds)),
            "accepts_monetary_claims": accepts_monetary_claims,
            "accepts_symbolic_claims": accepts_symbolic_claims,
            "active": True,
            "pool_balance": 0,
            "pool_reserved": 0,
            "pool_paid": 0,
            "created_at": now,
        }

        self.venues[venue_id] = self._json(record)
        self.all_venue_index = self._append_unique(self.all_venue_index, venue_id)
        self.owner_venue_index[sender] = self._append_unique(
            self.owner_venue_index.get(sender, ""), venue_id
        )

        self._record_activity(sender, "create_venue", "", "Venue created: " + name)
        self._record_audit(venue_id, "VENUE_CREATED", sender, "Venue created: " + name)

        return venue_id

    @gl.public.write.payable
    def fund_venue_pool(self, venue_id: str) -> None:
        self._require_not_paused()
        venue = self._require_venue_exists(venue_id)

        amount = int(gl.message.value)
        if amount <= 0:
            raise gl.vm.UserError("Must send GEN to fund the pool")

        venue["pool_balance"] = self._to_int(venue.get("pool_balance", 0)) + amount
        self.venues[venue_id] = self._json(venue)

        sender = self._sender()
        self._record_activity(sender, "fund_venue_pool", "", "Funded venue " + venue_id + " with " + str(amount) + " wei GEN")
        self._record_audit(venue_id, "POOL_FUNDED", sender, "Pool funded with " + str(amount) + " wei GEN")

    @gl.public.write
    def set_venue_active(self, venue_id: str, active: bool) -> None:
        sender = self._sender()
        venue = self._require_venue_exists(venue_id)
        if venue.get("owner", "") != sender:
            raise gl.vm.UserError("Only venue owner")
        venue["active"] = active
        self.venues[venue_id] = self._json(venue)
        self._record_audit(venue_id, "VENUE_ACTIVE_SET", sender, "Venue active set to " + str(active))

    # ──────────────────────────────────────────────────────────────────────────
    # 2. File Complaint
    # ──────────────────────────────────────────────────────────────────────────

    @gl.public.write
    def file_complaint(
        self,
        venue_id: str,
        respondent: str,
        title: str,
        harm_category: str,
        requested_remedy: str,
        claimed_amount: u256,
        complaint_text: str,
        evidence_urls_json: str,
        incident_date_text: str,
    ) -> str:
        self._require_not_paused()

        venue = self._require_venue_exists(venue_id)
        if not venue.get("active", False):
            raise gl.vm.UserError("Venue is not active")

        self._require_non_empty(title, "title")
        self._require_non_empty(complaint_text, "complaint_text")
        self._require_non_empty(respondent, "respondent")

        final_harm_category = self._normalise_harm_category(harm_category)
        final_remedy = self._normalise_remedy_type_input(requested_remedy)

        max_compensation = self._to_int(venue.get("max_compensation", 0), 0)
        claimed = int(claimed_amount)
        if self._is_monetary_remedy(final_remedy) and max_compensation > 0 and claimed > max_compensation:
            raise gl.vm.UserError("Claimed amount exceeds venue max compensation")
        if self._is_monetary_remedy(final_remedy) and not venue.get("accepts_monetary_claims", False):
            raise gl.vm.UserError("Venue does not accept monetary claims")
        if not self._is_monetary_remedy(final_remedy) and not venue.get("accepts_symbolic_claims", False):
            raise gl.vm.UserError("Venue does not accept symbolic claims")

        if len(evidence_urls_json) > 2400:
            raise gl.vm.UserError("evidence_urls_json is too long")

        sender = self._sender()
        case_id = self._next_case_id()
        now = _now()
        response_window = self._to_int(venue.get("response_window_seconds", 259200), 259200)

        record = {
            "case_id": case_id,
            "venue_id": venue_id,
            "claimant": sender,
            "respondent": respondent.strip().lower(),
            "title": self._limit(title, 220),
            "harm_category": final_harm_category,
            "requested_remedy": final_remedy,
            "claimed_amount": claimed,
            "complaint_text": self._limit(complaint_text, 4000),
            "evidence_urls_json": self._limit(evidence_urls_json, 2400),
            "incident_date_text": self._limit(incident_date_text, 120),
            "status": "awaiting_response",
            "created_at": now,
            "response_deadline": response_window,
            "evidence_locked": False,
            "latest_verdict_id": "",
        }

        self.cases[case_id] = self._json(record)

        self.venue_case_index[venue_id] = self._append_unique(
            self.venue_case_index.get(venue_id, ""), case_id
        )
        self.claimant_case_index[sender] = self._append_unique(
            self.claimant_case_index.get(sender, ""), case_id
        )
        self.respondent_case_index[record["respondent"]] = self._append_unique(
            self.respondent_case_index.get(record["respondent"], ""), case_id
        )

        self._update_status_index("", "awaiting_response", case_id)

        self._record_activity(sender, "file_complaint", case_id, "Complaint filed: " + title)
        self._record_audit(case_id, "COMPLAINT_FILED", sender, "Complaint filed against " + record["respondent"])

        return case_id

    # ──────────────────────────────────────────────────────────────────────────
    # 3. Respondent Reply
    # ──────────────────────────────────────────────────────────────────────────

    @gl.public.write
    def respond_to_complaint(
        self,
        case_id: str,
        reply_text: str,
        counter_evidence_urls_json: str,
        settlement_offer_type: str,
        settlement_offer_amount: u256,
    ) -> None:
        self._require_not_paused()

        case = self._require_case_exists(case_id)
        self._require_case_respondent(case)

        if case.get("status", "") != "awaiting_response":
            raise gl.vm.UserError("Case is not awaiting a response")
        if case.get("evidence_locked", False):
            raise gl.vm.UserError("Evidence already locked")

        sender = self._sender()
        now = _now()

        reply = {
            "case_id": case_id,
            "reply_text": self._limit(reply_text, 4000),
            "counter_evidence_urls_json": self._limit(counter_evidence_urls_json, 2400),
            "settlement_offer_type": self._limit(settlement_offer_type, 80),
            "settlement_offer_amount": int(settlement_offer_amount),
            "replied_at": now,
        }
        self.replies[case_id] = self._json(reply)

        old_status = case.get("status", "")
        case["status"] = "response_submitted"
        self.cases[case_id] = self._json(case)
        self._update_status_index(old_status, "response_submitted", case_id)

        self._record_activity(sender, "respond_to_complaint", case_id, "Respondent replied")
        self._record_audit(case_id, "RESPONSE_SUBMITTED", sender, "Respondent submitted a reply")

    # ──────────────────────────────────────────────────────────────────────────
    # 4. Evidence Lock
    # ──────────────────────────────────────────────────────────────────────────

    @gl.public.write
    def lock_evidence(self, case_id: str) -> None:
        self._require_not_paused()

        case = self._require_case_exists(case_id)
        sender = self._sender()
        if sender != case.get("claimant", "") and sender != case.get("respondent", ""):
            raise gl.vm.UserError("Only claimant or respondent can lock evidence")

        if case.get("evidence_locked", False):
            raise gl.vm.UserError("Evidence already locked")
        if case.get("status", "") not in ("awaiting_response", "response_submitted"):
            raise gl.vm.UserError("Case is not in a lockable state")

        case["evidence_locked"] = True
        old_status = case.get("status", "")
        case["status"] = "evidence_locked"
        case["locked_at"] = _now()
        self.cases[case_id] = self._json(case)
        self._update_status_index(old_status, "evidence_locked", case_id)

        self._record_activity(sender, "lock_evidence", case_id, "Evidence packet locked")
        self._record_audit(case_id, "EVIDENCE_LOCKED", sender, "Complaint and response evidence locked for review")

    # ──────────────────────────────────────────────────────────────────────────
    # 5. GenLayer Redress Review
    # ──────────────────────────────────────────────────────────────────────────

    def _run_consensus_verdict(self, case: typing.Any, venue: typing.Any, reply: typing.Any) -> typing.Any:
        def _cap(s: typing.Any, n: int = 260) -> str:
            text = str(s) if s else "not provided"
            return text[:n]

        case_context = self._json({
            "title": _cap(case.get("title", ""), 120),
            "harm_category": case.get("harm_category", "other"),
            "requested_remedy": case.get("requested_remedy", "manual_review"),
            "claimed_amount": case.get("claimed_amount", 0),
            "complaint_text": _cap(case.get("complaint_text", ""), 900),
            "evidence_urls": _cap(case.get("evidence_urls_json", ""), 400),
            "incident_date": case.get("incident_date_text", "unknown"),
        })

        respondent_context = self._json({
            "reply_text": _cap(reply.get("reply_text", "No response was submitted."), 900),
            "counter_evidence_urls": _cap(reply.get("counter_evidence_urls_json", ""), 400),
            "settlement_offer_type": reply.get("settlement_offer_type", "none"),
            "settlement_offer_amount": reply.get("settlement_offer_amount", 0),
        })

        venue_context = self._json({
            "name": venue.get("name", ""),
            "scope": _cap(venue.get("scope", ""), 400),
            "policy_url": venue.get("policy_url", ""),
            "max_compensation": venue.get("max_compensation", 0),
            "accepts_monetary_claims": venue.get("accepts_monetary_claims", False),
            "accepts_symbolic_claims": venue.get("accepts_symbolic_claims", False),
        })

        def evaluate_once() -> str:
            prompt = f"""
You are evaluating a Redress complaint on a decentralized complaint and
compensation protocol.

Your task is to decide whether the claimant experienced harm, whether the
respondent is responsible, and what remedy is fair and proportionate.

Do not maximise punishment. Do not automatically side with the claimant.
Do not dismiss harm merely because it is hard to quantify. A missing
respondent reply does not automatically prove guilt.

Consider:
- strength of evidence
- timeline consistency
- respondent responsibility
- claimant contribution
- venue policy or promise made
- proportionality of the requested remedy
- whether a symbolic remedy is enough
- whether financial remedy is justified
- whether the case needs escalation to human/legal review

Venue policy:
{venue_context}

Complaint:
{case_context}

Respondent reply:
{respondent_context}

Return only this exact JSON object, no surrounding text:
{{
  "verdict": "claim_upheld_full | claim_upheld_partial | symbolic_redress_only | respondent_already_remedied | needs_more_information | dismissed_no_harm | dismissed_insufficient_evidence | dismissed_bad_faith | escalated_human_review",
  "remedy_type": "full_refund | partial_refund | fixed_compensation | service_credit | apology_public | apology_private | correction_required | replacement_or_repair | acknowledgement_only | no_remedy | manual_review",
  "compensation_bps": <0-10000>,
  "severity": "low | medium | high | critical",
  "responsibility": "respondent | claimant | shared | unclear | external",
  "confidence": <0-100>,
  "short_reason": "<one sentence, snake_case-friendly summary>"
}}
"""
            raw = gl.nondet.exec_prompt(prompt, response_format="json")
            try:
                data = json.loads(raw) if isinstance(raw, str) else raw
                v = self._normalise_verdict_payload(data)
            except Exception:
                v = self._inconclusive_verdict()
            return json.dumps(v, sort_keys=True)

        consensus_json = gl.eq_principle.prompt_comparative(
            evaluate_once,
            principle="""
Outputs are equivalent if verdict and remedy_type match exactly, and
compensation_bps differs by no more than 1000 basis points. severity,
responsibility, confidence, and short_reason may differ in wording as long
as the core finding is the same.
""",
        )

        try:
            return self._normalise_verdict_payload(consensus_json)
        except Exception:
            return self._inconclusive_verdict()

    @gl.public.write
    def request_redress_review(self, case_id: str) -> str:
        self._require_not_paused()

        case = self._require_case_exists(case_id)
        if not case.get("evidence_locked", False):
            raise gl.vm.UserError("Evidence must be locked before review")
        if case.get("status", "") not in ("evidence_locked",):
            raise gl.vm.UserError("Case is not ready for review")

        venue = self._require_venue_exists(case.get("venue_id", ""))
        reply = self._load(self.replies.get(case_id, "{}"))

        old_status = case.get("status", "")
        case["status"] = "under_genlayer_review"
        self.cases[case_id] = self._json(case)
        self._update_status_index(old_status, "under_genlayer_review", case_id)

        verdict = self._run_consensus_verdict(case, venue, reply)

        # Compute approved amount for monetary remedies
        claimed = self._to_int(case.get("claimed_amount", 0), 0)
        approved_amount = 0
        if verdict["remedy_type"] == "full_refund":
            approved_amount = claimed
        elif verdict["remedy_type"] in ("partial_refund", "fixed_compensation", "service_credit"):
            approved_amount = (claimed * verdict["compensation_bps"]) // 10000

        max_compensation = self._to_int(venue.get("max_compensation", 0), 0)
        if max_compensation > 0 and approved_amount > max_compensation:
            approved_amount = max_compensation

        pool_balance = self._to_int(venue.get("pool_balance", 0), 0)
        if approved_amount > pool_balance:
            approved_amount = pool_balance

        verdict_id = self._next_verdict_id()
        now = _now()

        verdict_record = {
            "verdict_id": verdict_id,
            "case_id": case_id,
            "verdict": verdict["verdict"],
            "remedy_type": verdict["remedy_type"],
            "compensation_bps": verdict["compensation_bps"],
            "approved_amount": approved_amount,
            "severity": verdict["severity"],
            "responsibility": verdict["responsibility"],
            "confidence": verdict["confidence"],
            "short_reason": verdict["short_reason"],
            "decided_at": now,
        }
        self.verdicts[case_id] = self._json(verdict_record)

        new_status = self._status_from_verdict(verdict["verdict"])
        if new_status == "settlement_pending" and approved_amount <= 0:
            new_status = "symbolic_completion_pending"

        old_status = case.get("status", "")
        case["status"] = new_status
        case["latest_verdict_id"] = verdict_id
        case["verdict_at"] = now
        self.cases[case_id] = self._json(case)
        self._update_status_index(old_status, new_status, case_id)

        self._record_activity(
            self._sender(), "request_redress_review", case_id,
            "GenLayer consensus verdict: " + verdict["verdict"],
        )
        self._record_audit(
            case_id, "GENLAYER_REDRESS_VERDICT", "GENLAYER_CONSENSUS",
            "Consensus verdict: " + verdict["verdict"] + " / remedy: " + verdict["remedy_type"],
        )

        return self._json(verdict_record)

    # ──────────────────────────────────────────────────────────────────────────
    # 6. Settlement
    # ──────────────────────────────────────────────────────────────────────────

    @gl.public.write
    def settle_case(self, case_id: str) -> None:
        self._require_not_paused()

        case = self._require_case_exists(case_id)
        if case.get("status", "") != "settlement_pending":
            raise gl.vm.UserError("Case is not pending settlement")

        verdict = self._load(self.verdicts.get(case_id, "{}"))
        approved_amount = self._to_int(verdict.get("approved_amount", 0), 0)
        if approved_amount <= 0:
            raise gl.vm.UserError("No approved amount to settle")

        venue = self._require_venue_exists(case.get("venue_id", ""))
        pool_balance = self._to_int(venue.get("pool_balance", 0), 0)
        if approved_amount > pool_balance:
            raise gl.vm.UserError("Venue pool has insufficient funds for settlement")

        venue["pool_balance"] = pool_balance - approved_amount
        venue["pool_paid"] = self._to_int(venue.get("pool_paid", 0), 0) + approved_amount
        self.venues[case.get("venue_id", "")] = self._json(venue)

        old_status = case.get("status", "")
        case["status"] = "closed"
        case["settled_at"] = _now()
        self.cases[case_id] = self._json(case)
        self._update_status_index(old_status, "closed", case_id)

        claimant_address = Address(case.get("claimant", ""))
        claimant_address.transfer(u256(approved_amount))

        sender = self._sender()
        self._record_activity(sender, "settle_case", case_id, "Settled " + str(approved_amount) + " wei GEN to claimant")
        self._record_audit(case_id, "CASE_SETTLED", sender, "Settlement paid: " + str(approved_amount) + " wei GEN")

    # ──────────────────────────────────────────────────────────────────────────
    # 7. Symbolic Completion / Close
    # ──────────────────────────────────────────────────────────────────────────

    @gl.public.write
    def record_symbolic_completion(self, case_id: str, completion_note: str, proof_url: str) -> None:
        self._require_not_paused()

        case = self._require_case_exists(case_id)
        self._require_case_respondent(case)

        if case.get("status", "") != "symbolic_completion_pending":
            raise gl.vm.UserError("Case is not pending symbolic completion")

        sender = self._sender()
        now = _now()

        case["symbolic_completion_note"] = self._limit(completion_note, 1200)
        case["symbolic_completion_proof_url"] = self._limit(proof_url, 600)
        case["symbolic_completed_at"] = now

        old_status = case.get("status", "")
        case["status"] = "closed"
        self.cases[case_id] = self._json(case)
        self._update_status_index(old_status, "closed", case_id)

        self._record_activity(sender, "record_symbolic_completion", case_id, "Symbolic remedy recorded")
        self._record_audit(case_id, "SYMBOLIC_COMPLETION_RECORDED", sender, "Symbolic remedy completed: " + completion_note)

    @gl.public.write
    def close_case(self, case_id: str) -> None:
        self._require_not_paused()

        case = self._require_case_exists(case_id)
        sender = self._sender()
        if sender != case.get("claimant", "") and sender != case.get("respondent", ""):
            raise gl.vm.UserError("Only claimant or respondent can close this case")

        if case.get("status", "") in ("closed", "dismissed"):
            raise gl.vm.UserError("Case is already closed")

        old_status = case.get("status", "")
        case["status"] = "closed"
        case["closed_at"] = _now()
        self.cases[case_id] = self._json(case)
        self._update_status_index(old_status, "closed", case_id)

        self._record_activity(sender, "close_case", case_id, "Case closed")
        self._record_audit(case_id, "CASE_CLOSED", sender, "Case manually closed")

    # ──────────────────────────────────────────────────────────────────────────
    # Read — venues
    # ──────────────────────────────────────────────────────────────────────────

    @gl.public.view
    def get_venue(self, venue_id: str) -> str:
        return self.venues.get(venue_id, "{}")

    @gl.public.view
    def get_all_venues(self) -> str:
        result: typing.List[typing.Any] = []
        for venue_id in self._split_ids(self.all_venue_index):
            raw = self.venues.get(venue_id, "")
            if raw == "":
                continue
            result.append(self._load(raw))
        return self._json(result)

    @gl.public.view
    def get_venues_by_owner(self, owner: str) -> str:
        result: typing.List[typing.Any] = []
        for venue_id in self._split_ids(self.owner_venue_index.get(owner.strip().lower(), "")):
            raw = self.venues.get(venue_id, "")
            if raw == "":
                continue
            result.append(self._load(raw))
        return self._json(result)

    # ──────────────────────────────────────────────────────────────────────────
    # Read — cases
    # ──────────────────────────────────────────────────────────────────────────

    @gl.public.view
    def get_case(self, case_id: str) -> str:
        return self.cases.get(case_id, "{}")

    @gl.public.view
    def get_case_reply(self, case_id: str) -> str:
        return self.replies.get(case_id, "{}")

    @gl.public.view
    def get_case_verdict(self, case_id: str) -> str:
        return self.verdicts.get(case_id, "{}")

    @gl.public.view
    def get_cases_by_venue(self, venue_id: str) -> str:
        result: typing.List[typing.Any] = []
        for case_id in self._split_ids(self.venue_case_index.get(venue_id, "")):
            raw = self.cases.get(case_id, "")
            if raw == "":
                continue
            result.append(self._load(raw))
        return self._json(result)

    @gl.public.view
    def get_cases_by_claimant(self, claimant: str) -> str:
        result: typing.List[typing.Any] = []
        for case_id in self._split_ids(self.claimant_case_index.get(claimant.strip().lower(), "")):
            raw = self.cases.get(case_id, "")
            if raw == "":
                continue
            result.append(self._load(raw))
        return self._json(result)

    @gl.public.view
    def get_cases_by_respondent(self, respondent: str) -> str:
        result: typing.List[typing.Any] = []
        for case_id in self._split_ids(self.respondent_case_index.get(respondent.strip().lower(), "")):
            raw = self.cases.get(case_id, "")
            if raw == "":
                continue
            result.append(self._load(raw))
        return self._json(result)

    @gl.public.view
    def get_cases_by_status(self, status: str) -> str:
        result: typing.List[typing.Any] = []
        for case_id in self._split_ids(self.status_case_index.get(status.strip().lower(), "")):
            raw = self.cases.get(case_id, "")
            if raw == "":
                continue
            result.append(self._load(raw))
        return self._json(result)

    # ──────────────────────────────────────────────────────────────────────────
    # Read — activity / audit / stats
    # ──────────────────────────────────────────────────────────────────────────

    @gl.public.view
    def get_wallet_activity(self, wallet_address: str) -> str:
        ids = self._split_ids(self.wallet_activity_index.get(wallet_address.strip().lower(), ""))
        result: typing.List[typing.Any] = []
        for i in range(len(ids) - 1, -1, -1):
            raw = self.activities.get(ids[i], "")
            if raw == "":
                continue
            result.append(self._load(raw))
        return self._json(result)

    @gl.public.view
    def get_case_audit_log(self, case_id: str) -> str:
        result: typing.List[typing.Any] = []
        for audit_id in self._split_ids(self.case_audit_index.get(case_id, "")):
            raw = self.audit_logs.get(audit_id, "")
            if raw == "":
                continue
            result.append(self._load(raw))
        return self._json(result)

    @gl.public.view
    def get_pool_stats(self, venue_id: str) -> str:
        venue = self._require_venue_exists(venue_id)
        case_ids = self._split_ids(self.venue_case_index.get(venue_id, ""))

        active = 0
        resolved = 0
        for case_id in case_ids:
            raw = self.cases.get(case_id, "")
            if raw == "":
                continue
            case = self._load(raw)
            if case.get("status", "") in ("closed", "dismissed"):
                resolved += 1
            else:
                active += 1

        return self._json({
            "venue_id": venue_id,
            "pool_balance": venue.get("pool_balance", 0),
            "pool_paid": venue.get("pool_paid", 0),
            "max_compensation": venue.get("max_compensation", 0),
            "active_cases": active,
            "resolved_cases": resolved,
            "total_cases": len(case_ids),
        })

    @gl.public.view
    def get_contract_summary(self) -> str:
        return self._json({
            "deployer": self.deployer,
            "paused": self.paused,
            "contract_version": "1.0.0",
            "venue_counter": str(self.venue_counter),
            "case_counter": str(self.case_counter),
            "verdict_counter": str(self.verdict_counter),
            "activity_counter": str(self.activity_counter),
            "audit_counter": str(self.audit_counter),
        })

    @gl.public.view
    def get_all_venue_index(self) -> str:
        return self.all_venue_index
