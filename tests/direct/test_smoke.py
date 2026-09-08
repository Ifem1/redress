import json


def test_deploy_and_fund(direct_vm, direct_deploy, direct_owner):
    direct_vm.check_pickling = True
    protocol = direct_deploy("contract/redress.py")
    direct_vm.sender = direct_owner
    venue_id = protocol.create_venue(
        "Venue", "scope", "https://policy.example/policy", 100, 3600, True, True
    )
    direct_vm.value = 25
    protocol.fund_venue_pool(venue_id)
    stats = json.loads(protocol.get_pool_stats(venue_id))
    assert stats["pool_balance"] == 25
    assert stats["pool_total_funded"] == 25
