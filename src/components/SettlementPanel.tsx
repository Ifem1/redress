"use client";

import { useState } from "react";
import { weiToGen } from "@/lib/constants";
import { settleCase, recordSymbolicCompletion } from "@/lib/contract";
import { TxPanel } from "./ExplorerLink";
import type { ComplaintCase, RedressVerdict } from "@/lib/types";

export function SettlementPanel({
  caseData,
  verdict,
  isRespondent,
  onSettled,
}: {
  caseData: ComplaintCase;
  verdict: RedressVerdict;
  isRespondent: boolean;
  onSettled?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [tx, setTx] = useState<{ txHash: string; explorerLink: string } | null>(null);
  const [note, setNote] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [error, setError] = useState("");

  const isMonetary = (caseData.status === "settlement_pending" || caseData.status === "finalized") && verdict.approved_amount > 0;
  const isSymbolic = caseData.status === "symbolic_completion_pending";

  async function handleSettle() {
    setLoading(true);
    setError("");
    try {
      const result = await settleCase(caseData.case_id);
      setTx(result);
      onSettled?.();
    } catch (err: any) {
      setError(err?.message || "Settlement failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleSymbolic() {
    setLoading(true);
    setError("");
    try {
      const result = await recordSymbolicCompletion(caseData.case_id, note, proofUrl);
      setTx(result);
      onSettled?.();
    } catch (err: any) {
      setError(err?.message || "Could not record symbolic completion");
    } finally {
      setLoading(false);
    }
  }

  if (!isMonetary && !isSymbolic) return null;

  return (
    <div className="civic-panel p-5 flex flex-col gap-3">
      <p className="text-xs text-[var(--soft-grey)] mono">Settlement</p>

      {isMonetary && (
        <>
          <p className="text-sm">
            Settlement transfers <span className="mono text-[var(--remedy-green)]">{weiToGen(verdict.approved_amount)} GEN</span> from
            the venue pool to the claimant.
          </p>
          <button
            onClick={handleSettle}
            disabled={loading}
            className="px-4 py-2 rounded text-sm font-medium mono"
            style={{ background: "var(--remedy-green)", color: "var(--deep-ink)" }}
          >
            {loading ? "Settling…" : "Settle Case"}
          </button>
        </>
      )}

      {isSymbolic && isRespondent && (
        <>
          <p className="text-sm">Record that the symbolic remedy (apology, correction, acknowledgement) was completed.</p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Completion note"
            className="case-sheet px-3 py-2 text-sm rounded resize-none h-20"
          />
          <input
            value={proofUrl}
            onChange={(e) => setProofUrl(e.target.value)}
            placeholder="Proof URL (optional)"
            className="case-sheet px-3 py-2 text-sm rounded"
          />
          <button
            onClick={handleSymbolic}
            disabled={loading || !note.trim()}
            className="px-4 py-2 rounded text-sm font-medium mono"
            style={{ background: "var(--process-blue)", color: "var(--deep-ink)" }}
          >
            {loading ? "Recording…" : "Record Completion"}
          </button>
        </>
      )}

      {isSymbolic && !isRespondent && (
        <p className="text-sm text-[var(--soft-grey)] italic">Waiting for the respondent to record symbolic completion.</p>
      )}

      {error && <p className="text-xs" style={{ color: "var(--harm-clay)" }}>{error}</p>}
      {tx && <TxPanel txHash={tx.txHash} explorerLink={tx.explorerLink} />}
    </div>
  );
}
