"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getConnectedAddress, getCasesByClaimant, getCasesByRespondent, getVenuesByOwner, getWalletActivity } from "@/lib/contract";
import { CaseStatusBadge } from "@/components/CaseStatusBadge";
import type { ComplaintCase, Venue, WalletActivity } from "@/lib/types";

export default function DashboardPage() {
  const [address, setAddress] = useState<string | null>(null);
  const [filed, setFiled] = useState<ComplaintCase[]>([]);
  const [against, setAgainst] = useState<ComplaintCase[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [activity, setActivity] = useState<WalletActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const addr = await getConnectedAddress();
      setAddress(addr);
      if (!addr) {
        setLoading(false);
        return;
      }
      try {
        const [f, a, v, act] = await Promise.all([
          getCasesByClaimant(addr), getCasesByRespondent(addr), getVenuesByOwner(addr), getWalletActivity(addr),
        ]);
        setFiled(f);
        setAgainst(a);
        setVenues(v);
        setActivity(act);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const awaitingMyResponse = against.filter((c) => c.status === "awaiting_response");
  const awaitingSettlement = [...filed, ...against].filter((c) => c.status === "settlement_pending" || c.status === "symbolic_completion_pending");
  const closed = [...filed, ...against].filter((c) => c.status === "closed" || c.status === "dismissed");

  if (loading) return <div className="max-w-5xl mx-auto px-4 py-10 text-sm text-[var(--soft-grey)]">Loading dashboard…</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 flex flex-col gap-8">
      <div>
        <h1 className="font-display text-3xl">Dashboard</h1>
        <p className="text-sm text-[var(--soft-grey)] mt-1">{address ? `Connected as ${address.slice(0, 6)}…${address.slice(-4)}` : "Connect your wallet to see your cases and venues."}</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="civic-panel p-4"><p className="text-xs text-[var(--soft-grey)]">Complaints filed</p><p className="font-display text-2xl">{filed.length}</p></div>
        <div className="civic-panel p-4"><p className="text-xs text-[var(--soft-grey)]">Complaints against me</p><p className="font-display text-2xl">{against.length}</p></div>
        <div className="civic-panel p-4"><p className="text-xs text-[var(--soft-grey)]">Venues I own</p><p className="font-display text-2xl">{venues.length}</p></div>
      </div>

      <Section title="Awaiting my response" items={awaitingMyResponse} />
      <Section title="Awaiting settlement" items={awaitingSettlement} />
      <Section title="Closed cases" items={closed} />

      {venues.length > 0 && (
        <div>
          <h2 className="font-display text-xl mb-3">Venues I own</h2>
          <div className="flex flex-col gap-2">
            {venues.map((v) => (
              <Link key={v.venue_id} href={`/venues/${v.venue_id}`} className="civic-panel p-3 text-sm hover:border-[var(--redress-amber)]/40 transition-colors">
                {v.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, items }: { title: string; items: ComplaintCase[] }) {
  if (!items.length) return null;
  return (
    <div>
      <h2 className="font-display text-xl mb-3">{title}</h2>
      <div className="flex flex-col gap-2">
        {items.map((c) => (
          <Link key={c.case_id} href={`/cases/${c.case_id}`} className="civic-panel p-3 flex items-center justify-between gap-3 hover:border-[var(--redress-amber)]/40 transition-colors">
            <span className="text-sm truncate">{c.title}</span>
            <CaseStatusBadge status={c.status} />
          </Link>
        ))}
      </div>
    </div>
  );
}
