"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { requestRedressReview } from "@/lib/contract";

const CRITERIA = [
  "Evidence strength",
  "Responsibility",
  "Proportionality",
  "Harm severity",
  "Requested remedy fairness",
  "Bad faith risk",
  "Escalation need",
];

export default function ReviewPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleReview() {
    setLoading(true);
    setError("");
    try {
      await requestRedressReview(caseId);
      router.push(`/cases/${caseId}`);
    } catch (err: any) {
      // GenLayer consensus can take minutes; a client-side timeout doesn't
      // necessarily mean the on-chain request failed. Let the user check the
      // case page (which polls automatically) instead of dead-ending here.
      setError(
        (err?.message || "Review request timed out") +
          " — GenLayer review can take several minutes. Check the case page; it may still complete.",
      );
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl mb-1">GenLayer Redress Review</h1>
        <p className="text-sm text-[var(--soft-grey)]">
          GenLayer validators are interpreting harm, responsibility, evidence, and proportionality.
        </p>
      </div>

      <div className="civic-panel p-5">
        <p className="text-xs mono text-[var(--soft-grey)] mb-3">Locked case packet · {caseId}</p>
        <p className="text-sm">
          GenLayer validators are not checking a fixed rule. They are interpreting whether the requested
          remedy is fair, excessive, insufficient, or unsupported.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {CRITERIA.map((c) => (
          <div key={c} className="case-sheet p-3 text-xs text-center font-medium">
            {c}
          </div>
        ))}
      </div>

      {error && (
        <div className="flex flex-col gap-2">
          <p className="text-xs" style={{ color: "var(--harm-clay)" }}>{error}</p>
          <Link href={`/cases/${caseId}`} className="text-xs mono text-[var(--process-blue)] hover:underline w-fit">
            Go to case →
          </Link>
        </div>
      )}

      <button
        onClick={handleReview}
        disabled={loading}
        className="amber-glow px-4 py-3 rounded text-sm mono flex items-center justify-center gap-2"
        style={{ background: "var(--redress-amber)", color: "var(--deep-ink)" }}
      >
        {loading && (
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--deep-ink)] pulse-soft" />
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--deep-ink)] pulse-soft" style={{ animationDelay: "0.3s" }} />
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--deep-ink)] pulse-soft" style={{ animationDelay: "0.6s" }} />
          </span>
        )}
        {loading ? "GenLayer validators are interpreting the remedy… (this can take a few minutes)" : "Request Redress Review"}
      </button>
    </div>
  );
}
