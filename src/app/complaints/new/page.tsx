"use client";

import { useEffect, useState } from "react";
import { getAllVenues } from "@/lib/contract";
import { ComplaintForm } from "@/components/ComplaintForm";
import type { Venue } from "@/lib/types";

export default function NewComplaintPage() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllVenues()
      .then(setVenues)
      .catch(() => setVenues([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="px-4 py-10">
      <div className="max-w-4xl mx-auto mb-8 text-center">
        <h1 className="font-display text-3xl">File a Complaint</h1>
        <p className="text-sm text-[var(--soft-grey)] mt-1">
          Tell the protocol what happened, what evidence supports it, and what would make the situation fair.
        </p>
      </div>
      {loading ? (
        <p className="text-center text-sm text-[var(--soft-grey)]">Loading venues…</p>
      ) : venues.length === 0 ? (
        <p className="text-center text-sm text-[var(--soft-grey)]">
          No venues exist yet. <a href="/venues/create" className="text-[var(--process-blue)] hover:underline">Open one</a> before filing a complaint.
        </p>
      ) : (
        <ComplaintForm venues={venues} />
      )}
    </div>
  );
}
