"use client";

import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import type {
  Venue, ComplaintCase, RespondentReply, RedressVerdict,
  WalletActivity, PoolStats, ContractSummary,
} from "./types";

export const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "") as `0x${string}`;

const EXPLORER = "https://explorer-studio.genlayer.com";

const STUDIONET_CHAIN_PARAMS = {
  chainId: "0xF22F", // 61999 in hex
  chainName: "Genlayer Studio Network",
  nativeCurrency: { name: "GEN Token", symbol: "GEN", decimals: 18 },
  rpcUrls: ["https://studio.genlayer.com/api"],
  blockExplorerUrls: ["https://explorer-studio.genlayer.com"],
};

export function getExplorerTxLink(txHash: string): string {
  return `${EXPLORER}/tx/${txHash}`;
}

export function getExplorerAddressLink(address: string): string {
  return `${EXPLORER}/address/${address}`;
}

// ─── Network switch (EIP-3326 / EIP-3085, NO Snaps) ──────────────────────────

async function ensureStudioNet(eth: any) {
  try {
    await eth.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: STUDIONET_CHAIN_PARAMS.chainId }],
    });
  } catch (err: any) {
    if (err?.code === 4902) {
      await eth.request({
        method: "wallet_addEthereumChain",
        params: [STUDIONET_CHAIN_PARAMS],
      });
    } else {
      throw err;
    }
  }
}

function getEth(): any {
  if (typeof window === "undefined") throw new Error("No browser environment");
  const eth = (window as any).ethereum;
  if (!eth) throw new Error("No wallet found. Install MetaMask.");
  return eth;
}

export async function getConnectedAddress(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const eth = (window as any).ethereum;
  if (!eth) return null;
  try {
    const accounts: string[] = await eth.request({ method: "eth_accounts" });
    return accounts[0] || null;
  } catch {
    return null;
  }
}

export async function connectWallet(): Promise<string> {
  const eth = getEth();
  const accounts: string[] = await eth.request({ method: "eth_requestAccounts" });
  if (!accounts[0]) throw new Error("No wallet connected");
  await ensureStudioNet(eth);
  return accounts[0];
}

// ─── Clients ──────────────────────────────────────────────────────────────────

const readClient = createClient({ chain: studionet });

async function getWriteClient() {
  const eth = getEth();
  const accounts: string[] = await eth.request({ method: "eth_requestAccounts" });
  if (!accounts[0]) throw new Error("No wallet connected");
  await ensureStudioNet(eth);
  return createClient({
    chain: studionet,
    account: accounts[0] as `0x${string}`,
    provider: eth,
  });
}

async function write(
  functionName: string,
  args: unknown[],
  value: bigint = BigInt(0),
): Promise<{ txHash: string; explorerLink: string }> {
  const client = await getWriteClient();
  const txHash = await (client as any).writeContract({
    address: CONTRACT_ADDRESS,
    functionName,
    args,
    value,
  });
  return { txHash: txHash as string, explorerLink: getExplorerTxLink(txHash as string) };
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Contract read timed out")), ms);
    promise.then((v) => { clearTimeout(timer); resolve(v); }, (e) => { clearTimeout(timer); reject(e); });
  });
}

async function read(functionName: string, args: unknown[]): Promise<unknown> {
  if (!CONTRACT_ADDRESS) throw new Error("Contract address not configured");
  // @ts-expect-error args typing
  return withTimeout(readClient.readContract({ address: CONTRACT_ADDRESS, functionName, args }), 8000);
}

function parseJson<T>(raw: unknown, fallback: T): T {
  if (!raw || raw === "{}" || raw === "[]" || raw === "") return fallback;
  try {
    return JSON.parse(raw as string) as T;
  } catch {
    return fallback;
  }
}

// ─── Venue writes ─────────────────────────────────────────────────────────────

export async function createVenue(params: {
  name: string; scope: string; policy_url: string; max_compensation: bigint;
  response_window_seconds: bigint; accepts_monetary_claims: boolean; accepts_symbolic_claims: boolean;
}) {
  return write("create_venue", [
    params.name, params.scope, params.policy_url, params.max_compensation,
    params.response_window_seconds, params.accepts_monetary_claims, params.accepts_symbolic_claims,
  ]);
}

export async function fundVenuePool(venueId: string, amountWei: bigint) {
  return write("fund_venue_pool", [venueId], amountWei);
}

export async function setVenueActive(venueId: string, active: boolean) {
  return write("set_venue_active", [venueId, active]);
}

// ─── Complaint writes ─────────────────────────────────────────────────────────

export async function fileComplaint(params: {
  venue_id: string; respondent: string; title: string; harm_category: string;
  requested_remedy: string; claimed_amount: bigint; complaint_text: string;
  evidence_urls_json: string; incident_date_text: string;
}) {
  return write("file_complaint", [
    params.venue_id, params.respondent, params.title, params.harm_category,
    params.requested_remedy, params.claimed_amount, params.complaint_text,
    params.evidence_urls_json, params.incident_date_text,
  ]);
}

export async function respondToComplaint(params: {
  case_id: string; reply_text: string; counter_evidence_urls_json: string;
  settlement_offer_type: string; settlement_offer_amount: bigint;
}) {
  return write("respond_to_complaint", [
    params.case_id, params.reply_text, params.counter_evidence_urls_json,
    params.settlement_offer_type, params.settlement_offer_amount,
  ]);
}

export async function lockEvidence(caseId: string) {
  return write("lock_evidence", [caseId]);
}

export async function requestRedressReview(caseId: string) {
  return write("request_redress_review", [caseId]);
}

export async function settleCase(caseId: string) {
  return write("settle_case", [caseId]);
}

export async function recordSymbolicCompletion(caseId: string, completionNote: string, proofUrl: string) {
  return write("record_symbolic_completion", [caseId, completionNote, proofUrl]);
}

export async function closeCase(caseId: string) {
  return write("close_case", [caseId]);
}

// ─── Reads ────────────────────────────────────────────────────────────────────

export async function getVenue(venueId: string): Promise<Venue | null> {
  const r = await read("get_venue", [venueId]);
  return parseJson<Venue | null>(r, null);
}

export async function getAllVenues(): Promise<Venue[]> {
  const r = await read("get_all_venues", []);
  return parseJson<Venue[]>(r, []);
}

export async function getVenuesByOwner(owner: string): Promise<Venue[]> {
  const r = await read("get_venues_by_owner", [owner]);
  return parseJson<Venue[]>(r, []);
}

export async function getCase(caseId: string): Promise<ComplaintCase | null> {
  const r = await read("get_case", [caseId]);
  return parseJson<ComplaintCase | null>(r, null);
}

export async function getCaseReply(caseId: string): Promise<RespondentReply | null> {
  const r = await read("get_case_reply", [caseId]);
  return parseJson<RespondentReply | null>(r, null);
}

export async function getCaseVerdict(caseId: string): Promise<RedressVerdict | null> {
  const r = await read("get_case_verdict", [caseId]);
  return parseJson<RedressVerdict | null>(r, null);
}

export async function getCasesByVenue(venueId: string): Promise<ComplaintCase[]> {
  const r = await read("get_cases_by_venue", [venueId]);
  return parseJson<ComplaintCase[]>(r, []);
}

export async function getCasesByClaimant(claimant: string): Promise<ComplaintCase[]> {
  const r = await read("get_cases_by_claimant", [claimant]);
  return parseJson<ComplaintCase[]>(r, []);
}

export async function getCasesByRespondent(respondent: string): Promise<ComplaintCase[]> {
  const r = await read("get_cases_by_respondent", [respondent]);
  return parseJson<ComplaintCase[]>(r, []);
}

export async function getCasesByStatus(status: string): Promise<ComplaintCase[]> {
  const r = await read("get_cases_by_status", [status]);
  return parseJson<ComplaintCase[]>(r, []);
}

export async function getWalletActivity(address: string): Promise<WalletActivity[]> {
  const r = await read("get_wallet_activity", [address]);
  return parseJson<WalletActivity[]>(r, []);
}

export async function getCaseAuditLog(caseId: string) {
  const r = await read("get_case_audit_log", [caseId]);
  return parseJson<any[]>(r, []);
}

export async function getPoolStats(venueId: string): Promise<PoolStats | null> {
  const r = await read("get_pool_stats", [venueId]);
  return parseJson<PoolStats | null>(r, null);
}

export async function getContractSummary(): Promise<ContractSummary | null> {
  const r = await read("get_contract_summary", []);
  return parseJson<ContractSummary | null>(r, null);
}
