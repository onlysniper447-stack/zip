import { NextResponse } from "next/server";
import { attestForSettlement } from "@/lib/attestcoin/client";
import { planRoute, settleRoute, type CorridorKind } from "@/lib/payments/engine";
import { isFiatCode, type FiatCode } from "@/lib/money";

type Body = {
  kind?: CorridorKind;
  amountUsd?: number;
  sourceFiat?: string;
  destFiat?: string;
  counterparty?: string;
  memo?: string;
};

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const amountUsd = Number(body.amountUsd);
  const sourceFiat = body.sourceFiat;
  const destFiat = body.destFiat;

  if (!Number.isFinite(amountUsd) || amountUsd <= 0) {
    return NextResponse.json({ error: "Amount is required" }, { status: 400 });
  }
  if (!sourceFiat || !isFiatCode(sourceFiat) || !destFiat || !isFiatCode(destFiat)) {
    return NextResponse.json({ error: "Supported fiat rails are USD, EUR, GBP, and NGN" }, { status: 400 });
  }

  const plan = planRoute({
    kind: body.kind,
    amountUsd,
    sourceFiat: sourceFiat as FiatCode,
    destFiat: destFiat as FiatCode,
    counterparty: body.counterparty,
    memo: body.memo,
  });
  const attestation = await attestForSettlement();
  const settlement = await settleRoute(plan, attestation);
  return NextResponse.json(settlement);
}
