# Redress

**A decentralized complaint and compensation protocol.**

Redress lets users file structured harm claims against services, DAOs, products, communities, or contributors. Instead of a binary "guilty or not guilty" ruling, GenLayer validators interpret the complaint, the respondent's answer, the evidence, the venue policy, and the requested remedy — then decide what form of redress is fair: full or partial refund, fixed compensation, service credit, public or private apology, correction, acknowledgement, dismissal, or escalation to human review.

> Not every harm needs punishment. Not every complaint deserves payout. But every serious claim deserves structured interpretation.

Live contract: [`RedressProtocol`](contract/redress.py) on GenLayer StudioNet.

---

## How it works

```
venue created
    ↓
complaint filed
    ↓
awaiting respondent reply
    ↓
evidence locked (complaint + response frozen for review)
    ↓
GenLayer redress review (non-deterministic validator consensus)
    ↓
verdict issued
    ↓
settlement (monetary)  OR  symbolic completion (apology/correction/etc.)
    ↓
closed
```

A **venue** is a complaint desk opened by a DAO, service, or community — it defines scope, policy, accepted remedy types (monetary and/or symbolic), a response window, and an optional compensation pool funded in GEN.

A **case** moves through that lifecycle on-chain. Nothing about the verdict is deterministic: GenLayer validators independently reason over the locked case packet and reach consensus on a canonical JSON verdict (verdict, remedy type, compensation %, severity, responsibility, confidence, short reason).

## Project structure

```
contract/redress.py     GenLayer contract — RedressProtocol
src/app/                Next.js App Router pages
src/components/         Shared UI components (VenueCard, VerdictCard, RemedyTrack, ...)
src/lib/
  contract.ts           genlayer-js read/write wrapper + wallet connection
  types.ts              TypeScript types matching on-chain state
  constants.ts          Enum labels, formatting helpers, color mapping
```

### Routes

| Route | Purpose |
|---|---|
| `/` | Landing page |
| `/venues` | Venue directory |
| `/venues/create` | Open a new venue |
| `/venues/[venueId]` | Venue detail + case list |
| `/venues/[venueId]/fund` | Fund a venue's compensation pool |
| `/complaints/new` | File a complaint (multi-step form) |
| `/cases` | My cases (filed by me / against me) |
| `/cases/[caseId]` | Case detail — complaint, response, remedy track, verdict, settlement |
| `/cases/[caseId]/respond` | Respondent console |
| `/cases/[caseId]/review` | Trigger GenLayer redress review |
| `/cases/[caseId]/verdict` | Verdict detail |
| `/pools` | Pool balances across venues |
| `/dashboard` | Wallet-scoped overview |

## Contract methods (`contract/redress.py`)

- `create_venue`, `fund_venue_pool` (payable), `set_venue_active`
- `file_complaint`, `respond_to_complaint`, `lock_evidence`
- `request_redress_review` — runs `gl.nondet.exec_prompt` + `gl.eq_principle.prompt_comparative` to reach validator consensus on the remedy
- `settle_case` — pays the approved amount from the venue pool to the claimant
- `record_symbolic_completion`, `close_case`
- Reads: `get_venue`, `get_all_venues`, `get_case`, `get_case_verdict`, `get_cases_by_*`, `get_pool_stats`, `get_wallet_activity`, `get_case_audit_log`, `get_contract_summary`, and more.

## Local development

```bash
npm install
cp .env.local.example .env.local
# set NEXT_PUBLIC_CONTRACT_ADDRESS to your deployed RedressProtocol address
npm run dev
```

The app reads/writes exclusively against the GenLayer contract — there is no database. If a page's read fails or returns empty (e.g. no venues exist yet), it shows an empty state rather than placeholder data.

## Deploying the contract

Deploy `contract/redress.py` to GenLayer StudioNet via the GenLayer CLI or Studio, then set `NEXT_PUBLIC_CONTRACT_ADDRESS` (in `.env.local` locally, or as a Vercel environment variable in production) to the deployed address.

## Wallet & network

The frontend connects to an injected wallet (e.g. MetaMask) and prompts to add/switch to GenLayer StudioNet (chain id `61999` / `0xF22F`) using standard `wallet_switchEthereumChain` / `wallet_addEthereumChain` calls — no browser extension beyond a standard EVM wallet is required. The verified deployment for source commit `76d54f9fa1ddbfb55ffe64e9edbd8e177d90ecf6` is `0x89C942494D5543d9c5aB5903cABb9fF35a413191`; deployment transaction `0xa791ebf0ae013135b1136b51b920d5c27e123fa427c2b43319509a8a64bf16e2` finalized with successful execution and majority agreement.

Wallet connection is explicit and session-scoped: first-time visitors see "Connect Wallet" and must click it; once connected, the session stays connected until the tab is closed or you click disconnect.

## Design language

Civic Remedy Interface — a calm, document-driven aesthetic (deep ink / paper white / redress amber / remedy green / harm clay / process blue) built around case sheets, remedy tracks, and a proportionality dial, rather than a generic dispute-app dashboard. See [Redress-Frontend-Agent-Implementation-Guide.md] for the full design spec this app was built against.

## What Redress is not

## Trust and settlement model

Redress records a venue policy URL and freezes claimant/respondent source URLs before review. During GenLayer consensus, every validator independently retrieves the policy and public evidence with `gl.nondet.web.get`; retrieval status and bounded excerpts are included in the decision packet. Pages are untrusted data and are never treated as instructions. Invalid, unreachable, or entirely unusable sources produce an insufficient-evidence result.

Venue funding is payable GEN, read from `gl.message.value`; caller-supplied numbers are not accepted as deposits. Each venue accounts for `pool_total_funded`, available `pool_balance`, `pool_reserved`, and `pool_paid`. A positive monetary decision moves funds into reservation, and settlement can only emit one external GEN transfer after the 24-hour challenge window and explicit finalization. A single challenge changes the case to `challenge_pending`; it cannot be repeated. Policy content is frozen at first adjudication with retrieval status, digest, timestamp, and bounded excerpt, and challenge review continues to use that frozen snapshot. Non-monetary verdicts are deterministically normalized to zero compensation. The payout transfer is scheduled with `on="finalized"`; if a child transfer fails, GenLayer does not automatically refund the emitted value, so the claim is permanently closed before emission and cannot be retried. The verified deployment is configured through `NEXT_PUBLIC_CONTRACT_ADDRESS`.

The accounting fields have precise meanings: `pool_total_funded` is cumulative GEN received by a venue; `pool_balance` is currently available GEN; `pool_reserved` is the liability reserved for finalized, unpaid claims; and `pool_paid` is cumulative GEN emitted into finalized payout messages. A payout moves `reserved` to `paid` and marks the case `payout_status=scheduled` in the same successful contract execution before emitting `emit_transfer(..., on="finalized")`. Because a finalized child transfer is not automatically refundable on child failure, Redress never returns scheduled value to `available` and never permits a second emission path. Recovery of a failed child transfer would require an explicit future protocol method and a separately verified reconciliation mechanism.

The application-level Redress challenge window is distinct from GenLayer's protocol-level transaction appeal/finality lifecycle. The former is enforced from the canonical transaction datetime supplied to the Intelligent Contract; the latter is handled by GenLayer transaction status/finality. The Direct Mode suite covers payable funding and the complete economic lifecycle; live payable funding requires an approved browser wallet/provider or signer path because the installed CLI write command submits payable calls with zero value.

The final deployment also has a live payable funding proof using GenLayerJS `writeContract(..., value)`: transaction `0x814c94fb750edd229130cf23bce551aa5d13ab5c299993756db709f5843e43e5` sent `1 GEN` to `fund_venue_pool("VENUE-1")`. The canonical pool state afterward was `pool_total_funded=1 GEN`, `pool_balance=1 GEN`, `pool_reserved=0`, and `pool_paid=0`; the receipt finalized with majority agreement and successful validator execution.

A second funded live case used `VENUE-2`: funding transaction `0x16bea04d2365e2d013c49af6bad949f6710308f993cb0bf5111891a37667ec83` finalized with `1 GEN` available, complaint transaction `0x8369ad6d56f6f3dfb23dc06057335c1c8db2779330e4e32e294e0986b17e6963`, and review transaction `0x15bad70907e2db1ecd26e27485ab427457b4650905f1fcefe1ba51fdcab3f174` reached accepted majority consensus. The real public evidence was insufficient, producing `dismissed_insufficient_evidence` with `approved_amount=0`; canonical accounting remained `pool_balance=1 GEN`, `pool_reserved=0`, `pool_paid=0`.

Not a court clone, not a moderation-ban-appeal tool, not a deterministic refund calculator, not a reputation/token system. It's a fairness layer: GenLayer validators decide the proportionate remedy, not just the winner.
