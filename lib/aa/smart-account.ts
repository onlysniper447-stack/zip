import { createReceiptId } from "@/lib/ids";
import type { FiatCode } from "@/lib/money";
import { planRoute, settleRoute, type PublicSettlement } from "@/lib/payments/engine";
import { delay } from "@/lib/utils";
import type { SwapTokenId } from "@/lib/mock/swap-assets";

export type IntentKind = "tip" | "borrow" | "save" | "withdraw" | "offramp" | "receive" | "stock" | "swap";

export type PaymentIntent = {
  kind: IntentKind;
  amountCusd: number;
  sourceFiat?: FiatCode;
  destFiat?: FiatCode;
  counterparty?: string;
  memo?: string;
  sticker?: string;
  units?: number;
  fromToken?: SwapTokenId;
  toToken?: SwapTokenId;
  side?: "buy" | "sell";
};

export type ExecutionResult = PublicSettlement & {
  sponsored: true;
  networkFeeUsd: 0;
  attested: boolean;
  verifiedLabel: string;
  txHash?: string;
  explorerUrl?: string;
};

function corridorFor(kind: IntentKind) {
  if (kind === "tip" || kind === "receive") return "customer_pay" as const;
  return "merchant_settle" as const;
}

async function settleLocal(intent: PaymentIntent): Promise<ExecutionResult> {
  const sourceFiat = intent.sourceFiat ?? "NGN";
  const destFiat = intent.destFiat ?? sourceFiat;
  const plan = planRoute({
    kind: corridorFor(intent.kind),
    amountUsd: Math.abs(intent.amountCusd),
    sourceFiat,
    destFiat,
    counterparty: intent.counterparty,
    memo: intent.memo,
  });
  const settlement = await settleRoute(plan);
  return { ...settlement, sponsored: true, networkFeeUsd: 0, attested: settlement.attested, verifiedLabel: settlement.verifiedLabel };
}

/**
 * UI-facing money movement. On Creditcoin Testnet this submits a real transaction
 * from the user's ZIP account. The UI still only shows fiat, $handles, and receipts.
 */
export async function executeIntent(intent: PaymentIntent): Promise<ExecutionResult> {
  if (!Number.isFinite(intent.amountCusd) || intent.amountCusd <= 0) {
    throw new Error("Amount is required");
  }
  if (typeof window !== "undefined") {
    const { executeOnchain } = await import("@/lib/testnet/execute");
    return executeOnchain(intent);
  }
  return settleLocal(intent);
}

export async function createPasskey(displayName: string) {
  if (typeof window === "undefined" || !window.PublicKeyCredential) {
    await delay(600);
    return { ok: true as const, method: "demo" as const, displayName };
  }
  try {
    await delay(400);
    return { ok: true as const, method: "passkey" as const, displayName };
  } catch {
    return { ok: true as const, method: "demo" as const, displayName };
  }
}

export { createReceiptId };
