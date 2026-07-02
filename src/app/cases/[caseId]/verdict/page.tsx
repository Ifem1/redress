"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getCase, getCaseVerdict } from "@/lib/contract";
import { VerdictCard } from "@/components/VerdictCard";
import { SettlementPanel } from "@/components/SettlementPanel";
import type { ComplaintCase, RedressVerdict } from "@/lib/types";

export default function VerdictPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const [caseData, setCaseData] = useState<ComplaintCase | null>(null);
  const [verdict, setVerdict] = useState<RedressVerdict | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const c = await getCase(caseId);
        const v = await getCaseVerdict(caseId);
        if (!c || !v?.verdict_id) throw new Error("missing");
        setCaseData(c);
        setVerdict(v);
      } catch {
        setCaseData(null);
        setVerdict(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [caseId]);

  if (loading) return <div className="max-w-2xl mx-auto px-4 py-16 text-sm text-[var(--soft-grey)]">Loading verdict…</div>;
  if (!verdict || !caseData) return <div className="max-w-2xl mx-auto px-4 py-16 text-sm">No verdict available yet.</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl mb-1">Verdict</h1>
        <p className="text-sm text-[var(--soft-grey)]">
          This is the remedy the protocol found fair based on the locked case packet.
        </p>
      </div>

      <VerdictCard verdict={verdict} />
      <SettlementPanel caseData={caseData} verdict={verdict} isRespondent={false} />

      <Link href={`/cases/${caseId}`} className="text-sm mono text-[var(--process-blue)] hover:underline w-fit">
        ← Back to case
      </Link>
    </div>
  );
}
