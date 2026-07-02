"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Scale, Building2, PlusCircle, FileStack, LayoutDashboard, Coins, ExternalLink, LogOut } from "lucide-react";
import { CONTRACT_ADDRESS, connectWallet, getExplorerAddressLink } from "@/lib/contract";

export default function Nav() {
  const pathname = usePathname();
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    const eth = (window as any).ethereum;
    if (!eth) return;
    // Only silently restore the connection if the user explicitly connected
    // earlier in this session. First-time visitors must click Connect Wallet.
    if (sessionStorage.getItem("redress_wallet_connected") !== "1") return;
    eth.request({ method: "eth_accounts" }).then((accs: string[]) => {
      if (accs[0]) setAddress(accs[0]);
    });
  }, []);

  async function connect() {
    setConnecting(true);
    try {
      const addr = await connectWallet();
      setAddress(addr);
      sessionStorage.setItem("redress_wallet_connected", "1");
    } catch (err: any) {
      alert(err?.message || "Could not connect wallet");
    } finally {
      setConnecting(false);
    }
  }

  function disconnect() {
    setAddress(null);
    sessionStorage.removeItem("redress_wallet_connected");
  }

  const nav = [
    { href: "/venues", label: "Venues", icon: Building2 },
    { href: "/complaints/new", label: "File Complaint", icon: PlusCircle },
    { href: "/cases", label: "My Cases", icon: FileStack },
    { href: "/pools", label: "Pools", icon: Coins },
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  ];

  return (
    <nav className="border-b border-[var(--line-ash)]/15 bg-[var(--deep-ink)]/90 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14 gap-4">
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-[var(--redress-amber)]/10 border border-[var(--redress-amber)]/40 flex items-center justify-center">
              <Scale size={14} className="text-[var(--redress-amber)]" />
            </div>
            <span className="font-display font-semibold text-sm tracking-wide">Redress</span>
          </Link>
          {CONTRACT_ADDRESS ? (
            <a
              href={getExplorerAddressLink(CONTRACT_ADDRESS)}
              target="_blank"
              rel="noopener noreferrer"
              title="View contract on StudioNet Explorer"
              className="hidden md:flex items-center gap-1 text-[10px] mono text-[var(--process-blue)] hover:opacity-80 transition-opacity border border-[var(--process-blue)]/25 bg-[var(--process-blue)]/5 px-2 py-0.5 rounded"
            >
              <ExternalLink size={9} />
              {CONTRACT_ADDRESS.slice(0, 6)}…{CONTRACT_ADDRESS.slice(-4)}
            </a>
          ) : (
            <span className="hidden md:inline text-[10px] text-[var(--soft-grey)] mono">StudioNet</span>
          )}
        </div>

        <div className="flex items-center gap-1 overflow-x-auto">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap ${
                pathname.startsWith(href)
                  ? "bg-[var(--redress-amber)]/10 text-[var(--redress-amber)]"
                  : "text-[var(--soft-grey)] hover:text-[var(--paper-white)] hover:bg-white/5"
              }`}
            >
              <Icon size={12} />
              {label}
            </Link>
          ))}
        </div>

        {address ? (
          <div className="flex items-center gap-1 shrink-0">
            <span
              className="text-xs px-3 py-1.5 rounded-l border border-r-0 font-medium mono"
              style={{ borderColor: "rgba(79,143,107,0.4)", color: "var(--remedy-green)", background: "rgba(79,143,107,0.08)" }}
            >
              {address.slice(0, 6)}…{address.slice(-4)}
            </span>
            <button
              onClick={disconnect}
              title="Disconnect wallet"
              className="p-1.5 rounded-r border font-medium transition-colors"
              style={{ borderColor: "rgba(79,143,107,0.4)", color: "var(--remedy-green)", background: "rgba(79,143,107,0.08)" }}
            >
              <LogOut size={13} />
            </button>
          </div>
        ) : (
          <button
            onClick={connect}
            disabled={connecting}
            className="text-xs px-3 py-1.5 rounded border font-medium mono transition-all shrink-0"
            style={{ borderColor: "rgba(217,154,43,0.4)", color: "var(--redress-amber)", background: "rgba(217,154,43,0.08)" }}
          >
            {connecting ? "Connecting…" : "Connect Wallet"}
          </button>
        )}
      </div>
    </nav>
  );
}
