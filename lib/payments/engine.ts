import { createReceiptId } from "@/lib/ids";
import {
  FIAT_META,
  type FiatCode,
  type SettlementRail,
  type Stablecoin,
  usdToFiat,
} from "@/lib/money";
import { delay } from "@/lib/utils";

export type CorridorKind = "customer_pay" | "merchant_settle";

export type PaymentRouteInput = {
  kind?: CorridorKind;
  amountUsd: number;
  sourceFiat: FiatCode;
  destFiat: FiatCode;
  counterparty?: string;
  memo?: string;
};

export type InternalHop = {
  step: "capture" | "swap" | "offramp" | "credit";
  label: string;
};

export type RoutePlan = {
  kind: CorridorKind;
  sourceFiat: FiatCode;
  destFiat: FiatCode;
  amountSource: number;
  amountDest: number;
  amountUsd: number;
  stablecoin: Stablecoin;
  stablecoinAmount: number;
  rail: SettlementRail;
  railName: string;
  eta: string;
  hops: InternalHop[];
};

export type PublicSettlement = {
  receiptId: string;
  amount: number;
  fiat: FiatCode;
  rail: SettlementRail;
  railName: string;
  eta: string;
  status: "complete";
  settledAt: string;
};

function pickStablecoin(destFiat: FiatCode): Stablecoin {
  return destFiat === "NGN" ? "USDT" : "USDC";
}

/**
 * Fiat IN → USDC/USDT swap → local-rail off-ramp → bank credit.
 * Hops stay internal. Callers should only surface PublicSettlement to the UI.
 */
export function planRoute(input: PaymentRouteInput): RoutePlan {
  const kind = input.kind ?? (input.sourceFiat === input.destFiat ? "merchant_settle" : "customer_pay");
  const dest = FIAT_META[input.destFiat];
  const source = FIAT_META[input.sourceFiat];
  const stablecoin = pickStablecoin(input.destFiat);
  const amountSource = usdToFiat(input.amountUsd, input.sourceFiat);
  const amountDest = usdToFiat(input.amountUsd, input.destFiat);

  const hops: InternalHop[] =
    kind === "customer_pay"
      ? [
          { step: "capture", label: `Capture ${source.label} from payer` },
          { step: "swap", label: `Route via ${stablecoin}` },
          { step: "offramp", label: `Off-ramp onto ${dest.railName}` },
          { step: "credit", label: `Credit merchant in ${dest.label}` },
        ]
      : [
          { step: "capture", label: `Receive ${stablecoin} at the desk` },
          { step: "swap", label: `Auto-convert ${stablecoin} → ${dest.label}` },
          { step: "offramp", label: `Clear via ${dest.railName}` },
          { step: "credit", label: `Pay out to local account` },
        ];

  return {
    kind,
    sourceFiat: input.sourceFiat,
    destFiat: input.destFiat,
    amountSource,
    amountDest,
    amountUsd: input.amountUsd,
    stablecoin,
    stablecoinAmount: input.amountUsd,
    rail: dest.rail,
    railName: dest.railName,
    eta: dest.eta,
    hops,
  };
}

export async function settleRoute(plan: RoutePlan): Promise<PublicSettlement> {
  await delay(plan.kind === "customer_pay" ? 700 : 1100);
  return toPublicSettlement(plan);
}

export function toPublicSettlement(plan: RoutePlan, receiptId = createReceiptId()): PublicSettlement {
  return {
    receiptId,
    amount: plan.amountDest,
    fiat: plan.destFiat,
    rail: plan.rail,
    railName: plan.railName,
    eta: plan.eta,
    status: "complete",
    settledAt: new Date().toISOString(),
  };
}

export function railCopy(fiat: FiatCode) {
  const meta = FIAT_META[fiat];
  return `${meta.railName} · ${meta.eta}`;
}
