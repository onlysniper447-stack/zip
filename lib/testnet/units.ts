import { formatEther, parseEther } from "viem";
import { GAS_RESERVE_CTC, TESTNET_CTC_USD } from "@/lib/testnet/config";

export function cusdToWei(amountCusd: number): bigint {
  if (!Number.isFinite(amountCusd) || amountCusd <= 0) return BigInt(0);
  const ctc = amountCusd / TESTNET_CTC_USD;
  return parseEther(ctc.toFixed(8));
}

export function weiToCusd(wei: bigint): number {
  return Number(formatEther(wei)) * TESTNET_CTC_USD;
}

export const GAS_RESERVE_WEI = parseEther(String(GAS_RESERVE_CTC));
