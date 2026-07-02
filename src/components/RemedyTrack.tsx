import type { CaseStatus } from "@/lib/types";
import { CASE_STATUS_ORDER, CASE_STATUS_LABELS } from "@/lib/constants";

export function RemedyTrack({ status }: { status: CaseStatus }) {
  const isDismissed = status === "dismissed" || status === "escalated";
  const currentIndex = CASE_STATUS_ORDER.indexOf(status);

  return (
    <div className="flex items-center gap-0 overflow-x-auto pb-2">
      {CASE_STATUS_ORDER.map((s, i) => {
        const done = !isDismissed && currentIndex >= i;
        const isCurrent = s === status;
        return (
          <div key={s} className="flex items-center shrink-0">
            <div className="flex flex-col items-center gap-1 w-24">
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{
                  background: isCurrent ? "var(--redress-amber)" : done ? "var(--remedy-green)" : "var(--line-ash)",
                }}
              />
              <span
                className="text-[10px] text-center leading-tight"
                style={{ color: done || isCurrent ? "var(--paper-white)" : "var(--soft-grey)" }}
              >
                {CASE_STATUS_LABELS[s]}
              </span>
            </div>
            {i < CASE_STATUS_ORDER.length - 1 && (
              <span
                className="h-px w-6 shrink-0 -mt-4"
                style={{ background: done ? "var(--remedy-green)" : "var(--line-ash)", opacity: 0.5 }}
              />
            )}
          </div>
        );
      })}
      {isDismissed && (
        <span className="text-xs mono ml-3" style={{ color: "var(--harm-clay)" }}>
          {CASE_STATUS_LABELS[status]}
        </span>
      )}
    </div>
  );
}
