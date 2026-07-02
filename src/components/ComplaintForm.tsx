"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HARM_CATEGORY_LABELS, REMEDY_TYPE_LABELS, genToWei } from "@/lib/constants";
import { fileComplaint } from "@/lib/contract";
import { HarmTimeline } from "./HarmTimeline";
import { TxPanel } from "./ExplorerLink";
import type { Venue, HarmCategory, RemedyType } from "@/lib/types";

const MONETARY_REMEDIES: RemedyType[] = ["full_refund", "partial_refund", "fixed_compensation", "service_credit"];
const SYMBOLIC_REMEDIES: RemedyType[] = ["apology_public", "apology_private", "correction_required", "replacement_or_repair", "acknowledgement_only", "no_remedy"];

export function ComplaintForm({ venues }: { venues: Venue[] }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [venueId, setVenueId] = useState(venues[0]?.venue_id || "");
  const [respondent, setRespondent] = useState("");
  const [title, setTitle] = useState("");
  const [harmCategory, setHarmCategory] = useState<HarmCategory>("service_failure");
  const [incidentDate, setIncidentDate] = useState("");
  const [complaintText, setComplaintText] = useState("");
  const [evidenceUrls, setEvidenceUrls] = useState("");
  const [requestedRemedy, setRequestedRemedy] = useState<RemedyType>("partial_refund");
  const [claimedAmount, setClaimedAmount] = useState("");
  const [priorAttempt, setPriorAttempt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tx, setTx] = useState<{ txHash: string; explorerLink: string } | null>(null);

  const venue = venues.find((v) => v.venue_id === venueId);
  const remedyOptions = venue
    ? [
        ...(venue.accepts_monetary_claims ? MONETARY_REMEDIES : []),
        ...(venue.accepts_symbolic_claims ? SYMBOLIC_REMEDIES : []),
      ]
    : [...MONETARY_REMEDIES, ...SYMBOLIC_REMEDIES];

  useEffect(() => {
    // Always reset the remedy choice when the venue changes, rather than only
    // when the current value becomes invalid — a symbolic remedy picked for
    // one venue can remain "technically valid" after switching to a venue
    // that also accepts monetary claims, silently hiding the amount field.
    setRequestedRemedy(remedyOptions[0] || "no_remedy");
    setClaimedAmount("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [venueId]);

  const steps = [
    "Who is the complaint against?",
    "What happened?",
    "What evidence supports it?",
    "What remedy are you requesting?",
    "Review before locking",
  ];

  async function handleSubmit() {
    setLoading(true);
    setError("");
    try {
      const urlList = evidenceUrls.split("\n").map((u) => u.trim()).filter(Boolean);
      const result = await fileComplaint({
        venue_id: venueId,
        respondent,
        title,
        harm_category: harmCategory,
        requested_remedy: requestedRemedy,
        claimed_amount: genToWei(claimedAmount || "0"),
        complaint_text: priorAttempt ? `${complaintText}\n\nPrivate resolution attempt: ${priorAttempt}` : complaintText,
        evidence_urls_json: JSON.stringify(urlList),
        incident_date_text: incidentDate,
      });
      setTx(result);
    } catch (err: any) {
      setError(err?.message || "Failed to file complaint");
    } finally {
      setLoading(false);
    }
  }

  if (tx) {
    return (
      <div className="case-sheet p-8 max-w-xl mx-auto">
        <h2 className="font-display text-2xl mb-2">Redress filed.</h2>
        <p className="text-sm mb-4">Your complaint has been recorded. The respondent now has a window to reply before evidence is locked for review.</p>
        <TxPanel txHash={tx.txHash} explorerLink={tx.explorerLink} />
        <button onClick={() => router.push("/cases")} className="amber-glow mt-4 px-4 py-2 rounded text-sm mono" style={{ background: "var(--redress-amber)", color: "var(--deep-ink)" }}>
          View My Cases
        </button>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-[220px_1fr] gap-8 max-w-4xl mx-auto">
      <div className="hidden md:block">
        <HarmTimeline activeIndex={step} />
      </div>

      <div className="case-sheet p-6 flex flex-col gap-4">
        <p className="text-xs mono text-[var(--soft-grey)]">Step {step + 1} of {steps.length}</p>
        <h2 className="font-display text-xl">{steps[step]}</h2>

        {step === 0 && (
          <>
            <label className="text-sm">Venue</label>
            <select value={venueId} onChange={(e) => setVenueId(e.target.value)} className="border border-[var(--line-ash)] rounded px-3 py-2 text-sm bg-transparent">
              {venues.map((v) => <option key={v.venue_id} value={v.venue_id}>{v.name}</option>)}
            </select>
            <label className="text-sm">Respondent wallet or identifier</label>
            <input value={respondent} onChange={(e) => setRespondent(e.target.value)} placeholder="0x..." className="border border-[var(--line-ash)] rounded px-3 py-2 text-sm bg-transparent" />
          </>
        )}

        {step === 1 && (
          <>
            <label className="text-sm">Complaint title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Short summary of what happened" className="border border-[var(--line-ash)] rounded px-3 py-2 text-sm bg-transparent" />
            <label className="text-sm">Harm category</label>
            <select value={harmCategory} onChange={(e) => setHarmCategory(e.target.value as HarmCategory)} className="border border-[var(--line-ash)] rounded px-3 py-2 text-sm bg-transparent">
              {Object.entries(HARM_CATEGORY_LABELS).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
            </select>
            <label className="text-sm">Incident date</label>
            <input value={incidentDate} onChange={(e) => setIncidentDate(e.target.value)} placeholder="2026-05-10" className="border border-[var(--line-ash)] rounded px-3 py-2 text-sm bg-transparent" />
            <label className="text-sm">Tell the protocol what happened, what evidence supports it, and what would make the situation fair.</label>
            <textarea value={complaintText} onChange={(e) => setComplaintText(e.target.value)} className="border border-[var(--line-ash)] rounded px-3 py-2 text-sm bg-transparent h-32 resize-none" />
            <label className="text-sm">Did you try to resolve it privately first?</label>
            <textarea value={priorAttempt} onChange={(e) => setPriorAttempt(e.target.value)} placeholder="Optional" className="border border-[var(--line-ash)] rounded px-3 py-2 text-sm bg-transparent h-20 resize-none" />
          </>
        )}

        {step === 2 && (
          <>
            <label className="text-sm">Evidence links (one per line)</label>
            <textarea value={evidenceUrls} onChange={(e) => setEvidenceUrls(e.target.value)} placeholder="https://..." className="border border-[var(--line-ash)] rounded px-3 py-2 text-sm bg-transparent h-32 resize-none mono" />
          </>
        )}

        {step === 3 && (
          <>
            <label className="text-sm">Requested remedy</label>
            <select value={requestedRemedy} onChange={(e) => setRequestedRemedy(e.target.value as RemedyType)} className="border border-[var(--line-ash)] rounded px-3 py-2 text-sm bg-transparent">
              {remedyOptions.map((r) => <option key={r} value={r}>{REMEDY_TYPE_LABELS[r]}</option>)}
            </select>
            {MONETARY_REMEDIES.includes(requestedRemedy) && (
              <>
                <label className="text-sm">Claimed amount (GEN)</label>
                <input value={claimedAmount} onChange={(e) => setClaimedAmount(e.target.value)} placeholder="0.0" className="border border-[var(--line-ash)] rounded px-3 py-2 text-sm bg-transparent mono" />
              </>
            )}
          </>
        )}

        {step === 4 && (
          <div className="flex flex-col gap-2 text-sm">
            <p><strong>Venue:</strong> {venue?.name}</p>
            <p><strong>Respondent:</strong> {respondent}</p>
            <p><strong>Title:</strong> {title}</p>
            <p><strong>Harm category:</strong> {HARM_CATEGORY_LABELS[harmCategory]}</p>
            <p><strong>Requested remedy:</strong> {REMEDY_TYPE_LABELS[requestedRemedy]}</p>
            {claimedAmount && <p><strong>Claimed amount:</strong> {claimedAmount} GEN</p>}
            <p className="text-xs text-[var(--soft-grey)] italic mt-2">
              Once filed, the respondent will have a fixed window to reply before evidence is locked for GenLayer review.
            </p>
          </div>
        )}

        {error && <p className="text-xs" style={{ color: "var(--harm-clay)" }}>{error}</p>}

        <div className="flex justify-between pt-4 border-t border-[var(--line-ash)]/30">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="px-4 py-2 rounded text-sm mono disabled:opacity-30"
          >
            Back
          </button>
          {step < steps.length - 1 ? (
            <button
              onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}
              className="px-4 py-2 rounded text-sm mono"
              style={{ background: "var(--redress-amber)", color: "var(--deep-ink)" }}
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading || !title || !respondent || !complaintText}
              className="amber-glow px-4 py-2 rounded text-sm mono"
              style={{ background: "var(--redress-amber)", color: "var(--deep-ink)" }}
            >
              {loading ? "Filing…" : "File Complaint"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
