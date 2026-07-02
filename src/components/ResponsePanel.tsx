import { EvidenceLinkList } from "./EvidenceLinkList";
import { weiToGen } from "@/lib/constants";
import type { RespondentReply } from "@/lib/types";

export function ResponsePanel({ reply }: { reply: RespondentReply | null }) {
  if (!reply || !reply.reply_text) {
    return (
      <div className="civic-panel p-5">
        <p className="text-xs text-[var(--soft-grey)] mono mb-2">Response Record</p>
        <p className="text-sm text-[var(--soft-grey)] italic">No response submitted yet.</p>
      </div>
    );
  }

  return (
    <div className="civic-panel p-5 flex flex-col gap-3">
      <p className="text-xs text-[var(--soft-grey)] mono">Response Record</p>
      <p className="text-sm whitespace-pre-wrap">{reply.reply_text}</p>

      {reply.settlement_offer_amount > 0 && (
        <div className="text-xs px-3 py-2 rounded" style={{ background: "rgba(217,154,43,0.08)", border: "1px solid rgba(217,154,43,0.3)" }}>
          Settlement offer: <span className="mono">{weiToGen(reply.settlement_offer_amount)} GEN</span>
          {reply.settlement_offer_type ? ` (${reply.settlement_offer_type})` : ""}
        </div>
      )}

      <div>
        <p className="text-xs text-[var(--soft-grey)] mb-1">Counter-Evidence</p>
        <EvidenceLinkList urlsJson={reply.counter_evidence_urls_json} />
      </div>

      <p className="text-[10px] text-[var(--soft-grey)] mono">Replied {new Date(reply.replied_at).toLocaleString()}</p>
    </div>
  );
}
