import { weiToGen } from "@/lib/constants";
import type { PoolStats } from "@/lib/types";

export function PoolBalanceCard({ stats }: { stats: PoolStats }) {
  return (
    <div className="civic-panel p-5 flex flex-col gap-3">
      <p className="text-xs text-[var(--soft-grey)] mono">{stats.venue_id}</p>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-xs text-[var(--soft-grey)]">Pool Balance</p>
          <p className="mono text-lg text-[var(--remedy-green)]">{weiToGen(stats.pool_balance)} GEN</p>
        </div>
        <div>
          <p className="text-xs text-[var(--soft-grey)]">Claims Paid</p>
          <p className="mono text-lg">{weiToGen(stats.pool_paid)} GEN</p>
        </div>
        <div>
          <p className="text-xs text-[var(--soft-grey)]">Active Cases</p>
          <p className="mono">{stats.active_cases}</p>
        </div>
        <div>
          <p className="text-xs text-[var(--soft-grey)]">Resolved Cases</p>
          <p className="mono">{stats.resolved_cases}</p>
        </div>
      </div>
      <p className="text-[10px] text-[var(--soft-grey)] italic pt-2 border-t border-[var(--line-ash)]/15">
        Redress does not print money. Compensation comes from this funded pool.
      </p>
    </div>
  );
}
