import json
from datetime import datetime, timedelta, timezone

from .test_accounting_and_challenge import _setup, _mock_case


def test_canonical_time_window_and_finalization(direct_vm, direct_deploy, direct_owner, direct_bob):
    protocol, venue, case = _setup(direct_vm, direct_deploy, direct_owner, direct_bob)
    _mock_case(direct_vm, {"verdict": "claim_upheld_full", "remedy_type": "full_refund", "compensation_bps": 10000, "severity": "high", "responsibility": "respondent", "confidence": 90, "short_reason": "supported"})
    protocol.request_redress_review(case)
    verdict_at = datetime.fromisoformat(json.loads(protocol.get_case(case))["verdict_at"].replace("Z", "+00:00"))
    direct_vm.warp((verdict_at + timedelta(hours=23, minutes=59, seconds=59)).astimezone(timezone.utc).isoformat().replace("+00:00", "Z"))
    with direct_vm.expect_revert("Challenge window is still open"):
        protocol.finalize_case(case)
    direct_vm.warp((verdict_at + timedelta(hours=24, seconds=1)).astimezone(timezone.utc).isoformat().replace("+00:00", "Z"))
    protocol.finalize_case(case)
    assert json.loads(protocol.get_case(case))["status"] == "finalized"


def test_challenge_after_expiry_is_rejected(direct_vm, direct_deploy, direct_owner, direct_bob):
    protocol, venue, case = _setup(direct_vm, direct_deploy, direct_owner, direct_bob)
    _mock_case(direct_vm, {"verdict": "claim_upheld_full", "remedy_type": "full_refund", "compensation_bps": 10000, "severity": "high", "responsibility": "respondent", "confidence": 90, "short_reason": "supported"})
    protocol.request_redress_review(case)
    verdict_at = datetime.fromisoformat(json.loads(protocol.get_case(case))["verdict_at"].replace("Z", "+00:00"))
    direct_vm.warp((verdict_at + timedelta(hours=24, seconds=1)).astimezone(timezone.utc).isoformat().replace("+00:00", "Z"))
    with direct_vm.expect_revert("Challenge window has expired"):
        protocol.challenge_case(case, "This challenge is intentionally after expiry", '["https://challenge.example/evidence"]')


def test_unsafe_evidence_urls_are_rejected(direct_vm, direct_deploy, direct_owner, direct_bob):
    protocol, venue, case = _setup(direct_vm, direct_deploy, direct_owner, direct_bob)
    for url in ("http://localhost/x", "http://127.0.0.1/x", "http://0.0.0.0/x", "http://10.0.0.1/x", "http://192.168.1.1/x", "http://169.254.1.1/x", "file:///secret", "ftp://example/x", "not-a-url"):
        assert not protocol._valid_public_url(url)
