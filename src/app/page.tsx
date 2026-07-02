import Link from "next/link";
import { Scale, FileText, MessageSquareQuote, ShieldCheck } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-16 flex flex-col gap-20">
      <section className="flex flex-col items-center text-center gap-6">
        <span className="text-xs mono px-3 py-1 rounded-full border border-[var(--redress-amber)]/40 text-[var(--redress-amber)]">
          Civic Remedy Interface · GenLayer StudioNet
        </span>
        <h1 className="font-display text-4xl md:text-6xl leading-tight max-w-3xl">
          A decentralized protocol for complaints, accountability, and fair remedy.
        </h1>
        <p className="text-base md:text-lg text-[var(--paper-white)]/75 max-w-2xl">
          File harm claims against services, DAOs, products, or contributors. GenLayer validators interpret
          the evidence and decide whether compensation, apology, correction, refund, dismissal, or escalation is fair.
        </p>
        <div className="flex gap-3 flex-wrap justify-center">
          <Link href="/complaints/new" className="px-6 py-3 rounded text-sm font-medium mono" style={{ background: "var(--redress-amber)", color: "var(--deep-ink)" }}>
            File a Complaint
          </Link>
          <Link href="/venues/create" className="px-6 py-3 rounded text-sm font-medium mono border border-[var(--line-ash)]/40">
            Open a Redress Venue
          </Link>
        </div>

        <div className="relative w-full max-w-2xl h-56 mt-8 hidden md:block">
          <div className="case-sheet absolute left-1/2 -translate-x-[calc(50%+70px)] top-6 w-64 p-4 rotate-[-6deg] shadow-xl">
            <p className="text-xs mono text-[var(--soft-grey)] mb-1">01 · Complaint</p>
            <p className="text-sm font-display">Late Bounty Payment</p>
          </div>
          <div className="case-sheet absolute left-1/2 -translate-x-1/2 top-3 w-64 p-4 shadow-xl z-10">
            <p className="text-xs mono text-[var(--soft-grey)] mb-1">02 · Response</p>
            <p className="text-sm font-display">Respondent Reply Logged</p>
          </div>
          <div className="case-sheet absolute left-1/2 -translate-x-[calc(50%-70px)] top-6 w-64 p-4 rotate-[6deg] shadow-xl">
            <p className="text-xs mono text-[var(--soft-grey)] mb-1">03 · Remedy</p>
            <p className="text-sm font-display" style={{ color: "var(--remedy-green)" }}>Partial Refund Approved</p>
          </div>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-6">
        {[
          { icon: FileText, title: "Structured claims", body: "Complaints deserve more than chaos. Every case becomes a transparent file: claim, response, evidence." },
          { icon: MessageSquareQuote, title: "Proportional remedy", body: "Not every case needs punishment. Some need refund. Some need apology. Some need correction. Some need dismissal." },
          { icon: ShieldCheck, title: "Fair to both sides", body: "The respondent gets a real console to reply, offer settlement, or prove the remedy was already given." },
        ].map(({ icon: Icon, title, body }) => (
          <div key={title} className="civic-panel p-6 flex flex-col gap-3">
            <Icon size={20} className="text-[var(--redress-amber)]" />
            <h3 className="font-display text-lg">{title}</h3>
            <p className="text-sm text-[var(--paper-white)]/75">{body}</p>
          </div>
        ))}
      </section>

      <section className="civic-panel p-8 flex flex-col md:flex-row items-center gap-6 justify-between">
        <div className="flex items-center gap-3">
          <Scale size={28} className="text-[var(--redress-amber)]" />
          <p className="font-display text-xl max-w-md">
            Redress turns harm claims into structured remedy decisions.
          </p>
        </div>
        <Link href="/venues" className="px-5 py-2.5 rounded text-sm mono border border-[var(--line-ash)]/40 shrink-0">
          Browse Venues
        </Link>
      </section>
    </div>
  );
}
