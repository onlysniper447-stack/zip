"use client";

import { useEffect, useMemo, useState } from "react";
import { VAULTS } from "@/lib/mock/catalog";
import { apyToPerSecond } from "@/lib/money";
import { useWalletStore, vaultTotal } from "@/stores/wallet-store";

export function useTickingYield() {
  const vaults = useWalletStore((s) => s.vaults);
  const origin = useWalletStore((s) => s.yieldOriginMs);
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  return useMemo(() => {
    const blended =
      vaults.reduce((sum, position) => {
        const vault = VAULTS.find((item) => item.id === position.id);
        return sum + position.depositedCusd * (vault?.apy ?? 0);
      }, 0) / Math.max(vaultTotal(vaults), 1);

    const perSecondUsd = vaults.reduce((sum, position) => {
      const vault = VAULTS.find((item) => item.id === position.id);
      const apy = vault?.apy ?? 0;
      return sum + apyToPerSecond(position.depositedCusd, apy);
    }, 0);

    const elapsed = now === null ? 0 : Math.max(0, (now - origin) / 1000);
    const sessionUsd = perSecondUsd * elapsed;
    const dailyUsd = perSecondUsd * 60 * 60 * 24;

    return {
      blendedApy: Number.isFinite(blended) ? blended : 0,
      sessionUsd,
      dailyUsd,
      perSecondUsd,
      sessionNgn: sessionUsd * 1500,
      dailyNgn: dailyUsd * 1500,
    };
  }, [now, origin, vaults]);
}
