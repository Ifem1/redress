"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createVenue } from "@/lib/contract";
import { genToWei } from "@/lib/constants";
import { TxPanel } from "@/components/ExplorerLink";

export default function CreateVenuePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [scope, setScope] = useState("");
  const [policyUrl, setPolicyUrl] = useState("");
  const [maxCompensation, setMaxCompensation] = useState("");
  const [responseWindowHours, setResponseWindowHours] = useState("72");
  const [monetary, setMonetary] = useState(true);
  const [symbolic, setSymbolic] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tx, setTx] = useState<{ txHash: string; explorerLink: string } | null>(null);

  async function handleSubmit() {
    setLoading(true);
    setError("");
    try {
      const result = await createVenue({
        name,
        scope,
        policy_url: policyUrl,
        max_compensation: monetary ? genToWei(maxCompensation || "0") : BigInt(0),
        response_window_seconds: BigInt(Number(responseWindowHours) * 3600),
        accepts_monetary_claims: monetary,
        accepts_symbolic_claims: symbolic,
      });
      setTx(result);
    } catch (err: any) {
      setError(err?.message || "Failed to create venue");
    } finally {
      setLoading(false);
    }
  }

  if (tx) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16">
        <div className="case-sheet p-8">
          <h2 className="font-display text-2xl mb-2">Venue opened.</h2>
          <p className="text-sm mb-4">Fund the pool to start accepting monetary claims.</p>
          <TxPanel txHash={tx.txHash} explorerLink={tx.explorerLink} />
          <button onClick={() => router.push("/venues")} className="amber-glow mt-4 px-4 py-2 rounded text-sm mono" style={{ background: "var(--redress-amber)", color: "var(--deep-ink)" }}>
            View Venues
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-16">
      <h1 className="font-display text-3xl mb-1">Open a place where complaints can be answered fairly.</h1>
      <p className="text-sm text-[var(--soft-grey)] mb-8">Set the scope, policy, and remedy modes for your venue.</p>

      <div className="case-sheet p-6 flex flex-col gap-4">
        <label className="text-sm">Venue name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} className="border border-[var(--line-ash)] rounded px-3 py-2 text-sm bg-transparent" />

        <label className="text-sm">Complaint scope</label>
        <textarea value={scope} onChange={(e) => setScope(e.target.value)} className="border border-[var(--line-ash)] rounded px-3 py-2 text-sm bg-transparent h-24 resize-none" placeholder="e.g. bounty payment delays, unclear contributor rejection" />

        <label className="text-sm">Policy URL</label>
        <input value={policyUrl} onChange={(e) => setPolicyUrl(e.target.value)} className="border border-[var(--line-ash)] rounded px-3 py-2 text-sm bg-transparent" placeholder="https://" />

        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={monetary} onChange={(e) => setMonetary(e.target.checked)} /> Monetary claims
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={symbolic} onChange={(e) => setSymbolic(e.target.checked)} /> Symbolic claims
          </label>
        </div>

        {monetary && (
          <>
            <label className="text-sm">Max compensation per case (GEN)</label>
            <input value={maxCompensation} onChange={(e) => setMaxCompensation(e.target.value)} className="border border-[var(--line-ash)] rounded px-3 py-2 text-sm bg-transparent mono" placeholder="250" />
          </>
        )}

        <label className="text-sm">Response window (hours)</label>
        <input value={responseWindowHours} onChange={(e) => setResponseWindowHours(e.target.value)} className="border border-[var(--line-ash)] rounded px-3 py-2 text-sm bg-transparent mono" />

        {error && <p className="text-xs" style={{ color: "var(--harm-clay)" }}>{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading || !name || !scope || (!monetary && !symbolic)}
          className="amber-glow px-4 py-2 rounded text-sm mono mt-2"
          style={{ background: "var(--redress-amber)", color: "var(--deep-ink)" }}
        >
          {loading ? "Creating…" : "Create Venue"}
        </button>
      </div>
    </div>
  );
}
