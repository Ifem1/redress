"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fundVenuePool } from "@/lib/contract";
import { genToWei } from "@/lib/constants";
import { TxPanel } from "@/components/ExplorerLink";

export default function FundVenuePage() {
  const { venueId } = useParams<{ venueId: string }>();
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tx, setTx] = useState<{ txHash: string; explorerLink: string } | null>(null);

  async function handleFund() {
    setLoading(true);
    setError("");
    try {
      const result = await fundVenuePool(venueId, genToWei(amount || "0"));
      setTx(result);
    } catch (err: any) {
      setError(err?.message || "Funding failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <h1 className="font-display text-2xl mb-1">Fund the compensation pool</h1>
      <p className="text-sm text-[var(--soft-grey)] mb-6">Venue: <span className="mono">{venueId}</span></p>

      {tx ? (
        <div className="case-sheet p-6">
          <p className="text-sm mb-3">Pool funded successfully.</p>
          <TxPanel txHash={tx.txHash} explorerLink={tx.explorerLink} />
          <button onClick={() => router.push(`/venues/${venueId}`)} className="mt-4 px-4 py-2 rounded text-sm mono" style={{ background: "var(--redress-amber)", color: "var(--deep-ink)" }}>
            Back to Venue
          </button>
        </div>
      ) : (
        <div className="case-sheet p-6 flex flex-col gap-4">
          <label className="text-sm">Amount (GEN)</label>
          <input value={amount} onChange={(e) => setAmount(e.target.value)} className="border border-[var(--line-ash)] rounded px-3 py-2 text-sm bg-transparent mono" placeholder="50" />
          {error && <p className="text-xs" style={{ color: "var(--harm-clay)" }}>{error}</p>}
          <button onClick={handleFund} disabled={loading || !amount} className="px-4 py-2 rounded text-sm mono" style={{ background: "var(--redress-amber)", color: "var(--deep-ink)" }}>
            {loading ? "Funding…" : "Fund Pool"}
          </button>
        </div>
      )}
    </div>
  );
}
