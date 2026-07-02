# Redress

A decentralized complaint and compensation protocol. GenLayer validators interpret harm claims and decide a fair remedy — refund, compensation, apology, correction, dismissal, or escalation — instead of a binary win/lose ruling.

## Structure

- `contract/redress.py` — the `RedressProtocol` GenLayer contract (venues, complaints, responses, evidence lock, GenLayer review, verdicts, settlement, symbolic completion).
- `src/` — Next.js + TypeScript + Tailwind frontend.

## Setup

```bash
npm install
cp .env.local.example .env.local
# set NEXT_PUBLIC_CONTRACT_ADDRESS after deploying contract/redress.py to GenLayer StudioNet
npm run dev
```

Without a deployed contract address, the app falls back to demo venues and cases (see `src/lib/demoData.ts`) so every screen can be reviewed without a live deployment.

## Deploying the contract

Deploy `contract/redress.py` to GenLayer StudioNet using the GenLayer CLI/Studio, then set `NEXT_PUBLIC_CONTRACT_ADDRESS` to the deployed address.

## Lifecycle

```
venue -> complaint -> response -> evidence lock -> GenLayer review -> verdict -> settlement / symbolic completion -> close
```
