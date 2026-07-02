"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getVenue, getCasesByVenue } from "@/lib/contract";
import { weiToGen } from "@/lib/constants";
import { RemedyBar } from "@/components/RemedyBar";
import { CaseStatusBadge } from "@/components/CaseStatusBadge";
import type { Venue, ComplaintCase } from "@/lib/types";

export default function VenueDetailPage() {
  const { venueId } = useParams<{ venueId: string }>();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [cases, setCases] = useState<ComplaintCase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const v = await getVenue(venueId);
        const c = await getCasesByVenue(venueId);
        setVenue(v);
        setCases(c);
      } catch {
        setVenue(null);
        setCases([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [venueId]);

  if (loading) return <div className="max-w-4xl mx-auto px-4 py-10 text-sm text-[var(--soft-grey)]">Loading venue…</div>;
  if (!venue) return <div className="max-w-4xl mx-auto px-4 py-10 text-sm">Venue not found.</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 flex flex-col gap-6">
      <div className="civic-panel p-6 flex flex-col gap-3">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-3xl">{venue.name}</h1>
            <p className="text-xs mono text-[var(--soft-grey)] mt-1">{venue.venue_id}</p>
          </div>
          <Link href={`/venues/${venue.venue_id}/fund`} className="px-4 py-2 rounded text-sm mono" style={{ background: "var(--redress-amber)", color: "var(--deep-ink)" }}>
            Fund Pool
          </Link>
        </div>
        <p className="text-sm text-[var(--paper-white)]/80">{venue.scope}</p>
        <RemedyBar supportsMonetary={venue.accepts_monetary_claims} supportsSymbolic={venue.accepts_symbolic_claims} />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 pt-4 border-t border-[var(--line-ash)]/15 text-xs">
          <div><p className="text-[var(--soft-grey)]">Pool Balance</p><p className="mono text-[var(--remedy-green)]">{weiToGen(venue.pool_balance)} GEN</p></div>
          <div><p className="text-[var(--soft-grey)]">Max Compensation</p><p className="mono">{venue.accepts_monetary_claims ? `${weiToGen(venue.max_compensation)} GEN` : "Symbolic only"}</p></div>
          <div><p className="text-[var(--soft-grey)]">Response Window</p><p className="mono">{Math.round(Number(venue.response_window_seconds) / 3600)}h</p></div>
          <div><p className="text-[var(--soft-grey)]">Cases</p><p className="mono">{cases.length}</p></div>
        </div>

        {venue.policy_url && (
          <a href={venue.policy_url} target="_blank" rel="noopener noreferrer" className="text-xs mono text-[var(--process-blue)] hover:underline">
            View venue policy →
          </a>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="font-display text-xl">Cases at this venue</h2>
        {cases.length === 0 && <p className="text-sm text-[var(--soft-grey)]">No cases yet.</p>}
        {cases.map((c) => (
          <Link key={c.case_id} href={`/cases/${c.case_id}`} className="civic-panel p-4 flex items-center justify-between gap-3 hover:border-[var(--redress-amber)]/40 transition-colors">
            <div>
              <p className="font-display">{c.title}</p>
              <p className="text-xs mono text-[var(--soft-grey)]">{c.case_id}</p>
            </div>
            <CaseStatusBadge status={c.status} />
          </Link>
        ))}
      </div>

      <Link href={`/complaints/new?venue=${venue.venue_id}`} className="px-4 py-2 rounded text-sm mono w-fit border border-[var(--line-ash)]/40">
        File a complaint here
      </Link>
    </div>
  );
}
