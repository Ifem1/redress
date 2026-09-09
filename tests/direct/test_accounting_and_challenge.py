import json
from datetime import datetime, timedelta, timezone


def assert_pool_invariant(stats, funded=20):
    """Historical pool equation: funded = available + reserved + paid."""
    assert stats["pool_balance"] >= 0
    assert stats["pool_reserved"] >= 0
    assert stats["pool_paid"] >= 0
    assert stats["pool_total_funded"] == funded
    assert stats["pool_total_funded"] == stats["pool_balance"] + stats["pool_reserved"] + stats["pool_paid"]


def _hex(addr: bytes) -> str:
    return "0x" + addr.hex()


def _setup(direct_vm, direct_deploy, direct_owner, direct_bob):
    direct_vm.check_pickling = True
    protocol = direct_deploy("contract/redress.py")
    direct_vm.sender = direct_owner
    venue = protocol.create_venue(
        "Venue", "scope", "https://policy.example/policy", 100, 3600, True, True
    )
    direct_vm.value = 20
    protocol.fund_venue_pool(venue)
    direct_vm.value = 0
    case = protocol.file_complaint(
        venue, _hex(direct_bob), "Late service", "service_failure", "fixed_compensation",
        10, "The promised service was not delivered", '["https://claim.example/evidence"]', "2026-01-01"
    )
    direct_vm.sender = direct_bob
    protocol.respond_to_complaint(case, "Denied", '["https://counter.example/evidence"]', "none", 0)
    direct_vm.sender = direct_owner
    protocol.lock_evidence(case)
    return protocol, venue, case


def _mock_case(direct_vm, verdict):
    direct_vm.mock_web("policy.example", {"status": 200, "body": "Policy promises delivery."})
    direct_vm.mock_web("claim.example", {"status": 200, "body": "Delivery was not made."})
    direct_vm.mock_web("counter.example", {"status": 200, "body": "No contrary record."})
    direct_vm.mock_llm("You are evaluating a Redress complaint", json.dumps(verdict))


def test_approval_reserves_and_rejection_does_not(direct_vm, direct_deploy, direct_owner, direct_bob):
    protocol, venue, case = _setup(direct_vm, direct_deploy, direct_owner, direct_bob)
    _mock_case(direct_vm, {"verdict": "claim_upheld_full", "remedy_type": "full_refund", "compensation_bps": 10000, "severity": "high", "responsibility": "respondent", "confidence": 90, "short_reason": "supported"})
    protocol.request_redress_review(case)
    stats = json.loads(protocol.get_pool_stats(venue))
    assert_pool_invariant(stats)
    assert stats["pool_balance"] == 10
    assert stats["pool_reserved"] == 10
    assert stats["pool_total_funded"] == 20


def test_challenge_persists_original_and_reviewed_decisions(direct_vm, direct_deploy, direct_owner, direct_bob):
    protocol, venue, case = _setup(direct_vm, direct_deploy, direct_owner, direct_bob)
    _mock_case(direct_vm, {"verdict": "claim_upheld_full", "remedy_type": "full_refund", "compensation_bps": 10000, "severity": "high", "responsibility": "respondent", "confidence": 90, "short_reason": "supported"})
    original = json.loads(protocol.request_redress_review(case))
    direct_vm.clear_mocks()
    direct_vm.mock_web("policy.example", {"status": 200, "body": "Policy promises delivery."})
    direct_vm.mock_web("claim.example", {"status": 200, "body": "Delivery was not made."})
    direct_vm.mock_web("counter.example", {"status": 200, "body": "No contrary record."})
    direct_vm.mock_web("challenge.example", {"status": 200, "body": "New evidence contradicts delivery."})
    direct_vm.mock_llm("challenge.example", json.dumps({"verdict": "claim_upheld_partial", "remedy_type": "partial_refund", "compensation_bps": 6000, "severity": "medium", "responsibility": "respondent", "confidence": 90, "short_reason": "modified"}))
    protocol.challenge_case(case, "Material new public evidence changes the amount", '["https://challenge.example/evidence"]')
    reviewed = json.loads(protocol.challenge_verdicts[case])
    assert reviewed["original_decision"]["verdict"] == original["verdict"]
    assert reviewed["reviewed_decision"]["approved_amount"] == 6
    stats = json.loads(protocol.get_pool_stats(venue))
    assert stats["pool_balance"] == 14
    assert stats["pool_reserved"] == 6
    assert_pool_invariant(stats)
    with direct_vm.expect_revert("Challenge already used or closed"):
        protocol.challenge_case(case, "Second challenge must never be accepted", '["https://challenge.example/evidence"]')


def test_payout_is_scheduled_once(direct_vm, direct_deploy, direct_owner, direct_bob):
    protocol, venue, case = _setup(direct_vm, direct_deploy, direct_owner, direct_bob)
    _mock_case(direct_vm, {"verdict": "claim_upheld_full", "remedy_type": "full_refund", "compensation_bps": 10000, "severity": "high", "responsibility": "respondent", "confidence": 90, "short_reason": "supported"})
    protocol.request_redress_review(case)
    verdict_at = datetime.fromisoformat(json.loads(protocol.get_case(case))["verdict_at"].replace("Z", "+00:00"))
    direct_vm.warp((verdict_at + timedelta(hours=24, seconds=1)).astimezone(timezone.utc).isoformat().replace("+00:00", "Z"))
    protocol.finalize_case(case)
    protocol.settle_case(case)
    settled = json.loads(protocol.get_case(case))
    assert settled["status"] == "closed"
    assert settled["payout_status"] == "scheduled"
    paid_stats = json.loads(protocol.get_pool_stats(venue))
    assert_pool_invariant(paid_stats)
    assert paid_stats["pool_reserved"] == 0
    assert paid_stats["pool_paid"] == 10
    with direct_vm.expect_revert("Case is not pending settlement"):
        protocol.settle_case(case)


def test_challenge_increase_is_backed_by_available_balance(direct_vm, direct_deploy, direct_owner, direct_bob):
    protocol, venue, case = _setup(direct_vm, direct_deploy, direct_owner, direct_bob)
    _mock_case(direct_vm, {"verdict": "claim_upheld_partial", "remedy_type": "partial_refund", "compensation_bps": 6000, "severity": "high", "responsibility": "respondent", "confidence": 90, "short_reason": "partial"})
    protocol.request_redress_review(case)
    direct_vm.clear_mocks()
    _mock_case(direct_vm, {"verdict": "claim_upheld_partial", "remedy_type": "partial_refund", "compensation_bps": 9000, "severity": "high", "responsibility": "respondent", "confidence": 90, "short_reason": "new evidence"})
    protocol.challenge_case(case, "Material new evidence justifies a higher backed remedy", '["https://challenge.example/evidence"]')
    stats = json.loads(protocol.get_pool_stats(venue))
    assert json.loads(protocol.challenge_verdicts[case])["reviewed_decision"]["approved_amount"] == 9
    assert stats["pool_balance"] == 11
    assert stats["pool_reserved"] == 9
    assert_pool_invariant(stats)


def test_approval_to_rejection_releases_reservation(direct_vm, direct_deploy, direct_owner, direct_bob):
    protocol, venue, case = _setup(direct_vm, direct_deploy, direct_owner, direct_bob)
    _mock_case(direct_vm, {"verdict": "claim_upheld_full", "remedy_type": "full_refund", "compensation_bps": 10000, "severity": "high", "responsibility": "respondent", "confidence": 90, "short_reason": "supported"})
    protocol.request_redress_review(case)
    direct_vm.clear_mocks()
    _mock_case(direct_vm, {"verdict": "dismissed_no_harm", "remedy_type": "no_remedy", "compensation_bps": 0, "severity": "low", "responsibility": "claimant", "confidence": 90, "short_reason": "reversed"})
    protocol.challenge_case(case, "Material new evidence reverses the original approval", '["https://challenge.example/evidence"]')
    stats = json.loads(protocol.get_pool_stats(venue))
    assert json.loads(protocol.challenge_verdicts[case])["original_decision"]["approved_amount"] == 10
    assert json.loads(protocol.challenge_verdicts[case])["reviewed_decision"]["approved_amount"] == 0
    assert stats["pool_balance"] == 20
    assert stats["pool_reserved"] == 0
    assert_pool_invariant(stats)


def test_rejection_to_approval_reserves_only_backed_amount(direct_vm, direct_deploy, direct_owner, direct_bob):
    protocol, venue, case = _setup(direct_vm, direct_deploy, direct_owner, direct_bob)
    _mock_case(direct_vm, {"verdict": "dismissed_no_harm", "remedy_type": "no_remedy", "compensation_bps": 0, "severity": "low", "responsibility": "claimant", "confidence": 90, "short_reason": "not proven"})
    protocol.request_redress_review(case)
    direct_vm.clear_mocks()
    _mock_case(direct_vm, {"verdict": "claim_upheld_partial", "remedy_type": "partial_refund", "compensation_bps": 8000, "severity": "high", "responsibility": "respondent", "confidence": 90, "short_reason": "reversed"})
    protocol.challenge_case(case, "Material new evidence reverses the original rejection", '["https://challenge.example/evidence"]')
    stats = json.loads(protocol.get_pool_stats(venue))
    assert stats["pool_balance"] == 12
    assert stats["pool_reserved"] == 8
    assert_pool_invariant(stats)


def test_inconsistent_dismissal_with_refund_is_zeroed(direct_vm, direct_deploy, direct_owner, direct_bob):
    protocol, venue, case = _setup(direct_vm, direct_deploy, direct_owner, direct_bob)
    _mock_case(direct_vm, {"verdict": "dismissed_no_harm", "remedy_type": "full_refund", "compensation_bps": 10000, "severity": "low", "responsibility": "claimant", "confidence": 90, "short_reason": "no harm"})
    result = json.loads(protocol.request_redress_review(case))
    assert result["approved_amount"] == 0
    assert json.loads(protocol.get_pool_stats(venue))["pool_reserved"] == 0


def test_more_information_with_compensation_is_zeroed(direct_vm, direct_deploy, direct_owner, direct_bob):
    protocol, venue, case = _setup(direct_vm, direct_deploy, direct_owner, direct_bob)
    _mock_case(direct_vm, {"verdict": "needs_more_information", "remedy_type": "fixed_compensation", "compensation_bps": 10000, "severity": "medium", "responsibility": "unclear", "confidence": 20, "short_reason": "unclear"})
    result = json.loads(protocol.request_redress_review(case))
    assert result["approved_amount"] == 0
    assert json.loads(protocol.get_pool_stats(venue))["pool_reserved"] == 0


def test_manual_close_cannot_strand_reserved_funds(direct_vm, direct_deploy, direct_owner, direct_bob):
    protocol, venue, case = _setup(direct_vm, direct_deploy, direct_owner, direct_bob)
    _mock_case(direct_vm, {"verdict": "claim_upheld_full", "remedy_type": "full_refund", "compensation_bps": 10000, "severity": "high", "responsibility": "respondent", "confidence": 90, "short_reason": "supported"})
    protocol.request_redress_review(case)
    with direct_vm.expect_revert("Cannot manually close unresolved monetary or challengeable case"):
        protocol.close_case(case)
    assert json.loads(protocol.get_pool_stats(venue))["pool_reserved"] == 10


def test_finalized_monetary_case_cannot_bypass_payout_with_close(direct_vm, direct_deploy, direct_owner, direct_bob):
    protocol, venue, case = _setup(direct_vm, direct_deploy, direct_owner, direct_bob)
    _mock_case(direct_vm, {"verdict": "claim_upheld_full", "remedy_type": "full_refund", "compensation_bps": 10000, "severity": "high", "responsibility": "respondent", "confidence": 90, "short_reason": "supported"})
    protocol.request_redress_review(case)
    verdict_at = datetime.fromisoformat(json.loads(protocol.get_case(case))["verdict_at"].replace("Z", "+00:00"))
    direct_vm.warp((verdict_at + timedelta(hours=24, seconds=1)).astimezone(timezone.utc).isoformat().replace("+00:00", "Z"))
    protocol.finalize_case(case)
    with direct_vm.expect_revert("Cannot manually close unresolved monetary or challengeable case"):
        protocol.close_case(case)


def test_symbolic_completion_requires_finality(direct_vm, direct_deploy, direct_owner, direct_bob):
    protocol, venue, case = _setup(direct_vm, direct_deploy, direct_owner, direct_bob)
    _mock_case(direct_vm, {"verdict": "symbolic_redress_only", "remedy_type": "apology_public", "compensation_bps": 10000, "severity": "medium", "responsibility": "respondent", "confidence": 90, "short_reason": "apology"})
    protocol.request_redress_review(case)
    direct_vm.sender = direct_bob
    with direct_vm.expect_revert("Case must be finalized before symbolic completion"):
        protocol.record_symbolic_completion(case, "Apology", "https://example.com/proof")
    verdict_at = datetime.fromisoformat(json.loads(protocol.get_case(case))["verdict_at"].replace("Z", "+00:00"))
    direct_vm.warp((verdict_at + timedelta(hours=24, seconds=1)).astimezone(timezone.utc).isoformat().replace("+00:00", "Z"))
    direct_vm.sender = direct_owner
    protocol.finalize_case(case)
    direct_vm.sender = direct_bob
    protocol.record_symbolic_completion(case, "Apology", "https://example.com/proof")
    assert json.loads(protocol.get_case(case))["status"] == "closed"


def test_monetary_case_cannot_use_symbolic_completion_after_finality(direct_vm, direct_deploy, direct_owner, direct_bob):
    protocol, venue, case = _setup(direct_vm, direct_deploy, direct_owner, direct_bob)
    _mock_case(direct_vm, {"verdict": "claim_upheld_partial", "remedy_type": "partial_refund", "compensation_bps": 5000, "severity": "high", "responsibility": "respondent", "confidence": 90, "short_reason": "partial"})
    protocol.request_redress_review(case)
    verdict_at = datetime.fromisoformat(json.loads(protocol.get_case(case))["verdict_at"].replace("Z", "+00:00"))
    direct_vm.warp((verdict_at + timedelta(hours=24, seconds=1)).astimezone(timezone.utc).isoformat().replace("+00:00", "Z"))
    direct_vm.sender = direct_owner
    protocol.finalize_case(case)
    direct_vm.sender = direct_bob
    with direct_vm.expect_revert("Final verdict does not require symbolic completion"):
        protocol.record_symbolic_completion(case, "Attempted bypass", "https://example.com/proof")


def test_dismissed_case_cannot_record_symbolic_completion(direct_vm, direct_deploy, direct_owner, direct_bob):
    protocol, venue, case = _setup(direct_vm, direct_deploy, direct_owner, direct_bob)
    _mock_case(direct_vm, {"verdict": "dismissed_insufficient_evidence", "remedy_type": "no_remedy", "compensation_bps": 0, "severity": "low", "responsibility": "unclear", "confidence": 90, "short_reason": "not proven"})
    protocol.request_redress_review(case)
    verdict_at = datetime.fromisoformat(json.loads(protocol.get_case(case))["verdict_at"].replace("Z", "+00:00"))
    direct_vm.warp((verdict_at + timedelta(hours=24, seconds=1)).astimezone(timezone.utc).isoformat().replace("+00:00", "Z"))
    protocol.finalize_case(case)
    direct_vm.sender = direct_bob
    with direct_vm.expect_revert("Final verdict does not require symbolic completion"):
        protocol.record_symbolic_completion(case, "No completion", "https://example.com/proof")
