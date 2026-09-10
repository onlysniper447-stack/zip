"use client";

import { useCallback, useMemo } from "react";
import { FIAT_META, QUICK_AMOUNTS, fiatToUsd, formatUsdAsFiat, roundFiat, usdToFiat } from "@/lib/money";
import { railCopy } from "@/lib/payments/engine";
import { LOCAL_ACCOUNTS } from "@/lib/payments/rails";
import { useSessionStore } from "@/stores/session-store";

export function useFiat() {
  const fiat = useSessionStore((s) => s.preferredFiat ?? "NGN");
  const setFiat = useSessionStore((s) => s.setPreferredFiat);
  const meta = FIAT_META[fiat];

  const format = useCallback(
    (amountUsd: number, options?: { compact?: boolean; signed?: boolean }) =>
      formatUsdAsFiat(amountUsd, fiat, options),
    [fiat],
  );
  const fromUsd = useCallback((amountUsd: number) => usdToFiat(amountUsd, fiat), [fiat]);
  const toUsd = useCallback((amount: number) => fiatToUsd(amount, fiat), [fiat]);
  const defaultAmount = useCallback(
    (amountUsd: number) => roundFiat(usdToFiat(amountUsd, fiat), fiat),
    [fiat],
  );
  const accounts = useMemo(() => LOCAL_ACCOUNTS[fiat], [fiat]);

  return {
    fiat,
    setFiat,
    ...meta,
    chips: QUICK_AMOUNTS[fiat],
    accounts,
    railCopy: railCopy(fiat),
    format,
    fromUsd,
    toUsd,
    defaultAmount,
  };
}
