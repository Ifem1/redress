"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAllVenues } from "@/lib/contract";
import { VenueCard } from "@/components/VenueCard";
import type { Venue } from "@/lib/types";

export default function VenuesPage() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllVenues()
      .then(setVenues)
      .catch(() => setVenues([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl">Redress Venues</h1>
          <p className="text-sm text-[var(--soft-grey)] mt-1">Places where complaints can be answered fairly.</p>
        </div>
        <Link href="/venues/create" className="px-4 py-2 rounded text-sm mono" style={{ background: "var(--redress-amber)", color: "var(--deep-ink)" }}>
          Open a Venue
        </Link>
      </div>

      {loading ? (
        <p className="text-sm text-[var(--soft-grey)]">Loading venues…</p>
      ) : venues.length === 0 ? (
        <p className="text-sm text-[var(--soft-grey)]">No venues have been created yet. Be the first to open one.</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {venues.map((v) => <VenueCard key={v.venue_id} venue={v} />)}
        </div>
      )}
    </div>
  );
}
