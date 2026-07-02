"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { respondToComplaint } from "@/lib/contract";
import { genToWei } from "@/lib/constants";
import { TxPanel } from "@/components/ExplorerLink";

export default function RespondPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const router = useRouter();
  const [replyText, setReplyText] = useState("");
  const [counterEvidence, setCounterEvidence] = useState("");
  const [offerType, setOfferType] = useState("");
  const [offerAmount, setOfferAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tx, setTx] = useState<{ txHash: string; explorerLink: string } | null>(null);

  async function handleSubmit() {
    setLoading(true);
    setError("");
    try {
      const urls = counterEvidence.split("\n").map((u) => u.trim()).filter(Boolean);
      const result = await respondToComplaint({
        case_id: caseId,
        reply_text: replyText,
        counter_evidence_urls_json: JSON.stringify(urls),
        settlement_offer_type: offerType,
        settlement_offer_amount: genToWei(offerAmount || "0"),
      });
      setTx(result);
    } catch (err: any) {
      setError(err?.message || "Failed to submit response");
    } finally {
      setLoading(false);
    }
  }

  if (tx) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16">
        <div className="case-sheet p-8">
          <h2 className="font-display text-2xl mb-2">Response submitted.</h2>
          <TxPanel txHash={tx.txHash} explorerLink={tx.explorerLink} />
          <button onClick={() => router.push(`/cases/${caseId}`)} className="amber-glow mt-4 px-4 py-2 rounded text-sm mono" style={{ background: "var(--redress-amber)", color: "var(--deep-ink)" }}>
            Back to Case
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-16">
      <h1 className="font-display text-2xl mb-1">Answer the complaint before it becomes a remedy decision.</h1>
      <p className="text-sm text-[var(--soft-grey)] mb-6">Case: <span className="mono">{caseId}</span></p>

      <div className="case-sheet p-6 flex flex-col gap-4">
        <label className="text-sm">Your response</label>
        <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} className="border border-[var(--line-ash)] rounded px-3 py-2 text-sm bg-transparent h-32 resize-none" placeholder="Explain what happened from your side, dispute or accept the claim, or note that remedy was already provided." />

        <label className="text-sm">Counter-evidence links (one per line)</label>
        <textarea value={counterEvidence} onChange={(e) => setCounterEvidence(e.target.value)} className="border border-[var(--line-ash)] rounded px-3 py-2 text-sm bg-transparent h-20 resize-none mono" placeholder="https://..." />

        <label className="text-sm">Optional settlement offer type</label>
        <input value={offerType} onChange={(e) => setOfferType(e.target.value)} className="border border-[var(--line-ash)] rounded px-3 py-2 text-sm bg-transparent" placeholder="e.g. partial_refund" />

        <label className="text-sm">Optional settlement offer amount (GEN)</label>
        <input value={offerAmount} onChange={(e) => setOfferAmount(e.target.value)} className="border border-[var(--line-ash)] rounded px-3 py-2 text-sm bg-transparent mono" placeholder="0.0" />

        {error && <p className="text-xs" style={{ color: "var(--harm-clay)" }}>{error}</p>}

        <button onClick={handleSubmit} disabled={loading || !replyText} className="px-4 py-2 rounded text-sm mono" style={{ background: "var(--process-blue)", color: "var(--deep-ink)" }}>
          {loading ? "Submitting…" : "Submit Response"}
        </button>
      </div>
    </div>
  );
}
