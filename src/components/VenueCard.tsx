import Link from "next/link";
import { weiToGen } from "@/lib/constants";
import { RemedyBar } from "./RemedyBar";
import type { Venue } from "@/lib/types";

export function VenueCard({ venue }: { venue: Venue }) {
  const poolLow = venue.accepts_monetary_claims && Number(venue.pool_balance) < Number(venue.max_compensation);

  return (
    <Link
      href={`/venues/${venue.venue_id}`}
      className="civic-panel p-5 flex flex-col gap-3 hover:border-[var(--redress-amber)]/50 transition-colors fade-in-up"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg leading-tight">{venue.name}</h3>
          <p className="text-xs text-[var(--soft-grey)] mono mt-0.5">{venue.venue_id}</p>
        </div>
        <span
          className="inline-flex items-center gap-1.5 text-[10px] mono px-2 py-0.5 rounded shrink-0"
          style={{
            color: venue.active ? "var(--remedy-green)" : "var(--harm-clay)",
            background: venue.active ? "rgba(79,143,107,0.12)" : "rgba(184,92,74,0.12)",
          }}
        >
          {venue.active && <span className="w-1.5 h-1.5 rounded-full pulse-soft" style={{ background: "var(--remedy-green)" }} />}
          {venue.active ? "Open for complaints" : "Paused"}
        </span>
      </div>

      <p className="text-sm text-[var(--paper-white)]/80 line-clamp-2">{venue.scope}</p>

      <RemedyBar supportsMonetary={venue.accepts_monetary_claims} supportsSymbolic={venue.accepts_symbolic_claims} />

      <div className="grid grid-cols-2 gap-3 mt-1 pt-3 border-t border-[var(--line-ash)]/15 text-xs">
        <div>
          <p className="text-[var(--soft-grey)]">Pool Balance</p>
          <p className="mono text-[var(--remedy-green)]">{weiToGen(venue.pool_balance)} GEN</p>
        </div>
        <div>
          <p className="text-[var(--soft-grey)]">Max Compensation</p>
          <p className="mono">{venue.accepts_monetary_claims ? `${weiToGen(venue.max_compensation)} GEN` : "Symbolic only"}</p>
        </div>
        <div>
          <p className="text-[var(--soft-grey)]">Response Window</p>
          <p className="mono">{Math.round(Number(venue.response_window_seconds) / 3600)}h</p>
        </div>
        <div>
          <p className="text-[var(--soft-grey)]">Pool Status</p>
          <p className="mono" style={{ color: poolLow ? "var(--harm-clay)" : "var(--remedy-green)" }}>
            {venue.accepts_monetary_claims ? (poolLow ? "Pool low" : "Pool funded") : "Symbolic only"}
          </p>
        </div>
      </div>
    </Link>
  );
}
