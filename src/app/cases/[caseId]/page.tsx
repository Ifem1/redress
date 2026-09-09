"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { challengeCase, finalizeCase, getCase, getCaseReply, getCaseVerdict, getConnectedAddress, lockEvidence } from "@/lib/contract";
import { CaseStatusBadge } from "@/components/CaseStatusBadge";
import { RemedyTrack } from "@/components/RemedyTrack";
import { EvidenceLinkList } from "@/components/EvidenceLinkList";
import { ResponsePanel } from "@/components/ResponsePanel";
import { VerdictCard } from "@/components/VerdictCard";
import { SettlementPanel } from "@/components/SettlementPanel";
import { AddressPill } from "@/components/AddressPill";
import { TxPanel } from "@/components/ExplorerLink";
import { HARM_CATEGORY_LABELS, REMEDY_TYPE_LABELS, weiToGen } from "@/lib/constants";
import type { ComplaintCase, RespondentReply, RedressVerdict, CaseStatus } from "@/lib/types";

const LIVE_STATUSES: CaseStatus[] = [
  "awaiting_response", "response_submitted", "evidence_locked",
  "under_genlayer_review", "verdict_issued", "settlement_pending",
  "symbolic_completion_pending",
];
const POLL_INTERVAL_MS = 7000;

export default function CaseDetailPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const [caseData, setCaseData] = useState<ComplaintCase | null>(null);
  const [reply, setReply] = useState<RespondentReply | null>(null);
  const [verdict, setVerdict] = useState<RedressVerdict | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [locking, setLocking] = useState(false);
  const [lockTx, setLockTx] = useState<{ txHash: string; explorerLink: string } | null>(null);
  const [error, setError] = useState("");
  const [challengeReason, setChallengeReason] = useState("");
  const [challengeUrls, setChallengeUrls] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const statusRef = useRef<string | undefined>(undefined);

  async function refresh(showSpinner: boolean) {
    if (showSpinner) setLoading(true);
    try {
      const c = await getCase(caseId);
      if (!c) throw new Error("not found");
      setCaseData(c);
      statusRef.current = c.status;
      const [r, v] = await Promise.all([getCaseReply(caseId), getCaseVerdict(caseId)]);
      setReply(r);
      setVerdict(v?.verdict_id ? v : null);
    } catch {
      if (showSpinner) {
        setCaseData(null);
        setVerdict(null);
      }
    } finally {
      if (showSpinner) setLoading(false);
    }
  }

  useEffect(() => {
    refresh(true);
    getConnectedAddress().then(setAddress);

    const interval = setInterval(() => {
      if (statusRef.current && LIVE_STATUSES.includes(statusRef.current as CaseStatus)) {
        refresh(false);
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  async function handleLock() {
    setLocking(true);
    setError("");
    try {
      const result = await lockEvidence(caseId);
      setLockTx(result);
      refresh(false);
    } catch (err: any) {
      setError(err?.message || "Could not lock evidence");
    } finally {
      setLocking(false);
    }
  }

  async function handleChallenge() {
    setActionLoading(true); setError("");
    try { await challengeCase(caseId, challengeReason, JSON.stringify(challengeUrls.split("\n").map((u) => u.trim()).filter(Boolean))); setChallengeReason(""); setChallengeUrls(""); await refresh(false); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : "Could not submit challenge"); }
    finally { setActionLoading(false); }
  }

  async function handleFinalize() {
    setActionLoading(true); setError("");
    try { await finalizeCase(caseId); await refresh(false); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : "Could not finalize case"); }
    finally { setActionLoading(false); }
  }

  if (loading) return <div className="max-w-5xl mx-auto px-4 py-10 text-sm text-[var(--soft-grey)]">Loading case…</div>;
  if (!caseData) return <div className="max-w-5xl mx-auto px-4 py-10 text-sm">Case not found.</div>;

  const isClaimant = address?.toLowerCase() === caseData.claimant.toLowerCase();
  const isRespondent = address?.toLowerCase() === caseData.respondent.toLowerCase();
  const canLock = (isClaimant || isRespondent) && !caseData.evidence_locked && caseData.status !== "closed" && caseData.status !== "dismissed";
  const canRequestReview = caseData.status === "evidence_locked";
  const reviewing = caseData.status === "under_genlayer_review";

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 flex flex-col gap-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl">{caseData.title}</h1>
          <p className="text-xs mono text-[var(--soft-grey)] mt-1">{caseData.case_id} · {caseData.venue_id}</p>
        </div>
        <CaseStatusBadge status={caseData.status} />
      </div>

      <NextStepBanner
        caseData={caseData}
        isClaimant={isClaimant}
        isRespondent={isRespondent}
        canLock={canLock}
        canRequestReview={canRequestReview}
        reviewing={reviewing}
        hasVerdict={!!verdict}
      />

      <div className="civic-panel p-4 overflow-x-auto">
        <RemedyTrack status={caseData.status} />
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        <div className="case-sheet p-5 flex flex-col gap-3 md:col-span-1">
          <p className="text-xs mono text-[var(--soft-grey)]">Complaint Record</p>
          <div className="flex flex-col gap-1 text-xs">
            <p>Claimant: <AddressPill address={caseData.claimant} you={isClaimant} /></p>
            <p>Respondent: <AddressPill address={caseData.respondent} you={isRespondent} /></p>
          </div>
          <p className="text-xs text-[var(--soft-grey)]">{HARM_CATEGORY_LABELS[caseData.harm_category]} · {caseData.incident_date_text}</p>
          <p className="text-sm whitespace-pre-wrap">{caseData.complaint_text}</p>
          <div className="pt-2 border-t border-[var(--line-ash)]/40 text-xs">
            <p className="text-[var(--soft-grey)]">Requested remedy</p>
            <p className="mono">{REMEDY_TYPE_LABELS[caseData.requested_remedy]}</p>
            {caseData.claimed_amount > 0 && <p className="mono mt-1">{weiToGen(caseData.claimed_amount)} GEN claimed</p>}
          </div>
          <div>
            <p className="text-xs text-[var(--soft-grey)] mb-1">Evidence</p>
            <EvidenceLinkList urlsJson={caseData.evidence_urls_json} />
          </div>
        </div>

        <div className="md:col-span-1">
          <ResponsePanel reply={reply} />
          {isRespondent && caseData.status === "awaiting_response" && (
            <Link href={`/cases/${caseId}/respond`} className="amber-glow mt-3 block text-center px-4 py-2 rounded text-sm mono" style={{ background: "var(--process-blue)", color: "var(--deep-ink)" }}>
              Answer the complaint
            </Link>
          )}
        </div>

        <div className="md:col-span-1 flex flex-col gap-4">
          {verdict ? (
            <VerdictCard verdict={verdict} />
          ) : reviewing ? (
            <div className="civic-panel p-5 amber-glow">
              <p className="text-xs mono text-[var(--soft-grey)] mb-2">Remedy Track</p>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full pulse-soft" style={{ background: "var(--redress-amber)" }} />
                <span className="w-2 h-2 rounded-full pulse-soft" style={{ background: "var(--redress-amber)", animationDelay: "0.3s" }} />
                <span className="w-2 h-2 rounded-full pulse-soft" style={{ background: "var(--redress-amber)", animationDelay: "0.6s" }} />
              </div>
              <p className="text-sm">GenLayer validators are interpreting the remedy. This can take 1–5 minutes.</p>
              <p className="text-xs text-[var(--soft-grey)] mt-2">This page refreshes itself — no need to reload.</p>
            </div>
          ) : (
            <div className="civic-panel p-5">
              <p className="text-xs mono text-[var(--soft-grey)] mb-2">Remedy Track</p>
              <p className="text-sm text-[var(--soft-grey)] italic">No verdict yet.</p>
              {canRequestReview && (
                <Link href={`/cases/${caseId}/review`} className="amber-glow mt-3 block text-center px-4 py-2 rounded text-sm mono" style={{ background: "var(--redress-amber)", color: "var(--deep-ink)" }}>
                  Request GenLayer Review
                </Link>
              )}
            </div>
          )}

          {canLock && (
            <div className="civic-panel p-5 clay-glow">
              <p className="text-sm mb-3">
                Lock the case packet before validator review. This preserves the complaint and response exactly as
                they will be interpreted.
              </p>
              <button onClick={handleLock} disabled={locking} className="px-4 py-2 rounded text-sm mono w-full" style={{ background: "var(--harm-clay)", color: "var(--paper-white)" }}>
                {locking ? "Locking…" : "Lock Evidence"}
              </button>
              {error && <p className="text-xs mt-2" style={{ color: "var(--harm-clay)" }}>{error}</p>}
              {lockTx && <TxPanel txHash={lockTx.txHash} explorerLink={lockTx.explorerLink} />}
            </div>
          )}

          {verdict && <SettlementPanel caseData={caseData} verdict={verdict} isRespondent={isRespondent} onSettled={() => refresh(false)} />}
          {verdict && (isClaimant || isRespondent) && caseData.challenge_status === "open" &&
            ["settlement_pending", "symbolic_completion_pending", "verdict_issued", "dismissed"].includes(caseData.status) && (
            <div className="civic-panel p-5 flex flex-col gap-3">
              <p className="text-xs mono text-[var(--soft-grey)]">Application challenge window</p>
              <textarea value={challengeReason} onChange={(e) => setChallengeReason(e.target.value)} placeholder="Material reason (at least 20 characters)" className="case-sheet px-3 py-2 text-sm rounded resize-none h-20" />
              <textarea value={challengeUrls} onChange={(e) => setChallengeUrls(e.target.value)} placeholder="New public evidence URL(s), one per line" className="case-sheet px-3 py-2 text-sm rounded resize-none h-16" />
              <button onClick={handleChallenge} disabled={actionLoading || challengeReason.trim().length < 20 || !challengeUrls.trim()} className="px-4 py-2 rounded text-sm mono" style={{ background: "var(--redress-amber)", color: "var(--deep-ink)" }}>{actionLoading ? "Submitting…" : "Submit Challenge"}</button>
            </div>
          )}
          {verdict && caseData.challenge_status === "completed" && caseData.status !== "finalized" && (
            <button onClick={handleFinalize} disabled={actionLoading} className="px-4 py-2 rounded text-sm mono" style={{ background: "var(--process-blue)", color: "var(--deep-ink)" }}>{actionLoading ? "Finalizing…" : "Finalize Case"}</button>
          )}
          {error && <p className="text-xs" style={{ color: "var(--harm-clay)" }}>{error}</p>}
        </div>
      </div>
    </div>
  );
}

function NextStepBanner({
  caseData, isClaimant, isRespondent, canLock, canRequestReview, reviewing, hasVerdict,
}: {
  caseData: ComplaintCase;
  isClaimant: boolean;
  isRespondent: boolean;
  canLock: boolean;
  canRequestReview: boolean;
  reviewing: boolean;
  hasVerdict: boolean;
}) {
  const { caseId } = useParams<{ caseId: string }>();
  const isParty = isClaimant || isRespondent;
  if (!isParty) return null;

  let content: { text: string; cta?: { label: string; href: string } } | null = null;

  if (isRespondent && caseData.status === "awaiting_response") {
    content = { text: "This complaint is waiting on your response.", cta: { label: "Answer the complaint", href: `/cases/${caseId}/respond` } };
  } else if (canLock) {
    content = { text: "Both sides have had their say. Lock the evidence to move this case toward review.", cta: undefined };
  } else if (canRequestReview) {
    content = { text: "Evidence is locked. Request the GenLayer review to get a remedy verdict.", cta: { label: "Request GenLayer Review", href: `/cases/${caseId}/review` } };
  } else if (reviewing) {
    content = { text: "GenLayer validators are deliberating. This page will update automatically.", cta: undefined };
  } else if (hasVerdict && (caseData.status === "settlement_pending" || caseData.status === "symbolic_completion_pending")) {
    content = {
      text: caseData.status === "settlement_pending"
        ? "A verdict was reached. Settlement is ready to be executed."
        : isRespondent
          ? "A verdict was reached. Record proof that the symbolic remedy was completed."
          : "A verdict was reached. Waiting on the respondent to complete the symbolic remedy.",
    };
  } else if (caseData.status === "closed") {
    content = { text: "This case is closed." };
  } else if (caseData.status === "dismissed") {
    content = { text: "This case was dismissed." };
  }

  if (!content) return null;

  return (
    <div className="civic-panel px-5 py-3 flex items-center justify-between gap-3 flex-wrap" style={{ borderColor: "rgba(217,154,43,0.35)" }}>
      <p className="text-sm">{content.text}</p>
      {content.cta && (
        <Link href={content.cta.href} className="amber-glow shrink-0 px-4 py-1.5 rounded text-xs mono" style={{ background: "var(--redress-amber)", color: "var(--deep-ink)" }}>
          {content.cta.label}
        </Link>
      )}
    </div>
  );
}
