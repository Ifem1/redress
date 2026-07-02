import { getExplorerAddressLink } from "@/lib/contract";

export function AddressPill({ address, you }: { address: string; you?: boolean }) {
  if (!address) return <span className="mono text-xs text-[var(--soft-grey)]">unassigned</span>;
  const short = `${address.slice(0, 6)}…${address.slice(-4)}`;
  return (
    <a
      href={getExplorerAddressLink(address)}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 mono text-xs px-2 py-0.5 rounded border border-[var(--line-ash)]/30 hover:border-[var(--redress-amber)]/60 transition-colors"
      title={address}
    >
      {short}
      {you && <span className="text-[var(--remedy-green)]">· you</span>}
    </a>
  );
}
