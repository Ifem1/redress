"use client";

import { useEffect, useState } from "react";
import { getAllVenues, getPoolStats } from "@/lib/contract";
import { PoolBalanceCard } from "@/components/PoolBalanceCard";
import type { PoolStats, Venue } from "@/lib/types";

export default function PoolsPage() {
  const [stats, setStats] = useState<PoolStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const venues: Venue[] = await getAllVenues();
        const results = await Promise.all(venues.map((v) => getPoolStats(v.venue_id)));
        setStats(results.filter(Boolean) as PoolStats[]);
      } catch {
        setStats([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl">Pool Dashboard</h1>
        <p className="text-sm text-[var(--soft-grey)] mt-1">
          Redress does not print money. Compensation comes from a funded pool or escrow.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-[var(--soft-grey)]">Loading pools…</p>
      ) : stats.length === 0 ? (
        <p className="text-sm text-[var(--soft-grey)]">No venue pools yet.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {stats.map((s) => <PoolBalanceCard key={s.venue_id} stats={s} />)}
        </div>
      )}
    </div>
  );
}
