import { createReceiptId } from "@/lib/ids";
import type { FiatCode } from "@/lib/money";
import { planRoute, settleRoute, type PublicSettlement } from "@/lib/payments/engine";
import { delay } from "@/lib/utils";

export type IntentKind = "tip" | "borrow" | "save" | "withdraw" | "offramp" | "receive" | "stock";

export type PaymentIntent = {
  kind: IntentKind;
  amountCusd: number;
  sourceFiat?: FiatCode;
  destFiat?: FiatCode;
  counterparty?: string;
  memo?: string;
  sticker?: string;
};

export type ExecutionResult = PublicSettlement & {
  sponsored: true;
  networkFeeUsd: 0;
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
  return { ...settlement, sponsored: true, networkFeeUsd: 0 };
}

/**
 * UI-facing money movement. The engine routes fiat → USDC/USDT → local rails.
 * The UI only ever receives fiat settlement facts (amount, rail, receipt).
 */
export async function executeIntent(intent: PaymentIntent): Promise<ExecutionResult> {
  if (!Number.isFinite(intent.amountCusd) || intent.amountCusd <= 0) {
    throw new Error("Amount is required");
  }
  if (typeof window !== "undefined") {
    try {
      const response = await fetch("/api/payments/settle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: corridorFor(intent.kind),
          amountUsd: Math.abs(intent.amountCusd),
          sourceFiat: intent.sourceFiat ?? "NGN",
          destFiat: intent.destFiat ?? intent.sourceFiat ?? "NGN",
          counterparty: intent.counterparty,
          memo: intent.memo,
        }),
      });
      if (response.ok) {
        const settlement = (await response.json()) as PublicSettlement;
        return { ...settlement, sponsored: true, networkFeeUsd: 0 };
      }
    } catch {
      /* fall through to local settlement */
    }
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
