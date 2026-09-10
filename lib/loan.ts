import type { TrancheId } from "@/lib/mock/catalog";
import { FX_NGN_PER_USD } from "@/lib/money";
import { clamp } from "@/lib/utils";

export function loanApr(score: number, weeks: number, tranche: TrancheId) {
  const base = tranche === "standard" ? 0.168 : 0.102;
  const scoreCut = ((score - 300) / 550) * 0.072;
  const duration = Math.max(0, weeks - 4) * 0.0018;
  return clamp(base - scoreCut + duration, 0.049, 0.24);
}

export function maxLoanUsd(score: number, vaultUsd: number, tranche: TrancheId) {
  if (tranche === "collateral") {
    return Math.max(50_000 / FX_NGN_PER_USD, vaultUsd * 0.7);
  }
  return (80_000 + Math.max(0, score - 500) * 1800) / FX_NGN_PER_USD;
}

export function maxLoanNgn(score: number, vaultCusd: number, tranche: TrancheId) {
  return maxLoanUsd(score, vaultCusd, tranche) * FX_NGN_PER_USD;
}

export function weeklyPayment(principalNgn: number, weeks: number, apr: number) {
  const r = apr / 52;
  if (r === 0) return principalNgn / weeks;
  return (principalNgn * r) / (1 - Math.pow(1 + r, -weeks));
}
