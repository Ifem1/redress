import json
from datetime import datetime, timedelta, timezone


def _hex(addr: bytes) -> str:
    return "0x" + addr.hex()


def test_lock_requires_reply_or_canonical_deadline(direct_vm, direct_deploy, direct_owner, direct_bob):
    protocol = direct_deploy("contract/redress.py")
    direct_vm.sender = direct_owner
    venue = protocol.create_venue("Venue", "scope", "https://policy.example/policy", 100, 3600, True, True)
    direct_vm.value = 10
    protocol.fund_venue_pool(venue)
    direct_vm.value = 0
    direct_vm.sender = direct_owner
    case = protocol.file_complaint(venue, _hex(direct_bob), "Issue", "service_failure", "fixed_compensation", 5, "Not delivered", "[]", "2026-01-01")
    with direct_vm.expect_revert("Respondent response or canonical deadline expiry required"):
        protocol.lock_evidence(case)
    direct_vm.sender = direct_bob
    protocol.respond_to_complaint(case, "Reply", "[]", "none", 0)
    direct_vm.sender = direct_owner
    protocol.lock_evidence(case)
    assert json.loads(protocol.get_case(case))["status"] == "evidence_locked"


def test_lock_allowed_after_canonical_response_deadline(direct_vm, direct_deploy, direct_owner, direct_bob):
    protocol = direct_deploy("contract/redress.py")
    direct_vm.sender = direct_owner
    venue = protocol.create_venue("Venue", "scope", "https://policy.example/policy", 100, 3600, True, True)
    case = protocol.file_complaint(venue, _hex(direct_bob), "Issue", "service_failure", "fixed_compensation", 5, "Not delivered", "[]", "2026-01-01")
    deadline = json.loads(protocol.get_case(case))["response_deadline"]
    direct_vm.warp((datetime.fromisoformat(deadline.replace("Z", "+00:00")) + timedelta(seconds=1)).astimezone(timezone.utc).isoformat().replace("+00:00", "Z"))
    protocol.lock_evidence(case)
    assert json.loads(protocol.get_case(case))["status"] == "evidence_locked"
