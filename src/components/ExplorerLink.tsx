import { ExternalLink } from "lucide-react";
import { getExplorerTxLink } from "@/lib/contract";

export function ExplorerLink({ txHash, label }: { txHash: string; label?: string }) {
  return (
    <a
      href={getExplorerTxLink(txHash)}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-xs mono text-[var(--process-blue)] hover:opacity-80 transition-opacity"
    >
      <ExternalLink size={11} />
      {label || `${txHash.slice(0, 10)}…`}
    </a>
  );
}

export function TxPanel({ txHash, explorerLink }: { txHash: string; explorerLink: string }) {
  return (
    <div className="civic-panel p-3 mt-3">
      <p className="text-xs text-[var(--soft-grey)] mb-1">Transaction confirmed</p>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <span className="mono text-xs">{txHash.slice(0, 18)}…</span>
        <a
          href={explorerLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-[var(--process-blue)] hover:underline"
        >
          <ExternalLink size={11} /> View on Explorer
        </a>
      </div>
    </div>
  );
}
