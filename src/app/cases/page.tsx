"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getConnectedAddress, getCasesByClaimant, getCasesByRespondent } from "@/lib/contract";
import { CaseStatusBadge } from "@/components/CaseStatusBadge";
import { HARM_CATEGORY_LABELS, REMEDY_TYPE_LABELS, weiToGen } from "@/lib/constants";
import type { ComplaintCase } from "@/lib/types";

type Tab = "filed" | "against_me" | "all";

export default function MyCasesPage() {
  const [tab, setTab] = useState<Tab>("all");
  const [filed, setFiled] = useState<ComplaintCase[]>([]);
  const [against, setAgainst] = useState<ComplaintCase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const address = await getConnectedAddress();
      if (!address) {
        setFiled([]);
        setAgainst([]);
        setLoading(false);
        return;
      }
      try {
        const [f, a] = await Promise.all([getCasesByClaimant(address), getCasesByRespondent(address)]);
        setFiled(f);
        setAgainst(a);
      } catch {
        setFiled([]);
        setAgainst([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const list = tab === "filed" ? filed : tab === "against_me" ? against : [...filed, ...against];

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 flex flex-col gap-6">
      <h1 className="font-display text-3xl">My Cases</h1>

      <div className="flex gap-2">
        {(["all", "filed", "against_me"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-3 py-1.5 rounded text-xs mono"
            style={{
              background: tab === t ? "var(--redress-amber)" : "transparent",
              color: tab === t ? "var(--deep-ink)" : "var(--soft-grey)",
              border: `1px solid ${tab === t ? "var(--redress-amber)" : "var(--line-ash)"}44`,
            }}
          >
            {t === "all" ? "All" : t === "filed" ? "Filed by me" : "Against me"}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-[var(--soft-grey)]">Loading cases…</p>
      ) : (
        <div className="flex flex-col gap-3">
          {list.length === 0 && <p className="text-sm text-[var(--soft-grey)]">No cases found. Connect your wallet to see cases you filed or that were filed against you.</p>}
          {list.map((c) => (
            <Link key={c.case_id} href={`/cases/${c.case_id}`} className="civic-panel p-4 flex items-center justify-between gap-3 flex-wrap hover:border-[var(--redress-amber)]/40 transition-colors">
              <div className="min-w-0">
                <p className="font-display truncate">{c.title}</p>
                <p className="text-xs mono text-[var(--soft-grey)]">{c.case_id} · {HARM_CATEGORY_LABELS[c.harm_category]}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs mono text-[var(--soft-grey)]">{REMEDY_TYPE_LABELS[c.requested_remedy]}</span>
                {c.claimed_amount > 0 && <span className="text-xs mono">{weiToGen(c.claimed_amount)} GEN</span>}
                <CaseStatusBadge status={c.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
