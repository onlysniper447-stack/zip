"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { DualValue } from "@/components/money/dual-value";
import { useFiat } from "@/hooks/use-fiat";
import { creditcoinPools, defiBlendedApy, defiTotal } from "@/lib/mock/defi-pools";

export function SavePools({
  vaults,
  hide,
  tick,
}: {
  vaults: Array<{ id: string; depositedCusd: number }>;
  hide: boolean;
  tick: number;
}) {
  const { format } = useFiat();
  const pools = creditcoinPools(vaults, tick);
  const total = defiTotal(pools);
  const blended = defiBlendedApy(pools);

  return (
    <div className="mt-3 space-y-3">
      <DualValue amountCusd={total} size="md" masked={hide} />
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-yield">Active Creditcoin DeFi pools</p>
        <p className="shrink-0 text-xs font-bold text-yield">{(blended * 100).toFixed(1)}% blended</p>
      </div>
      <div className="space-y-2">
        {pools.map((pool) => (
          <div key={pool.id} className="rounded-[14px] border border-line bg-surface/80 px-3 py-2.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-bold text-foreground">{pool.name}</p>
                <p className="mt-0.5 text-[11px] font-medium text-muted">
                  {pool.detail} · {pool.protocol}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-bold tabular-nums text-yield">{(pool.apy * 100).toFixed(1)}%</p>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-yield/80">
                  {pool.live ? "Live " : ""}
                  {pool.rateLabel}
                </p>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {pool.pairTokens.map((token) => (
                <Badge key={`${pool.id}-${token}`} tone="neutral">
                  {token}
                </Badge>
              ))}
              <Badge>{pool.pairTag}</Badge>
              {pool.poolShare != null ? (
                <Badge tone="success">{(pool.poolShare * 100).toFixed(1)}% share</Badge>
              ) : null}
              {pool.live ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-yield">
                  <span className="size-1.5 rounded-full bg-yield" />
                  Dynamic
                </span>
              ) : null}
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="font-medium text-muted">Allocated</span>
              <span className="font-bold tabular-nums text-foreground">
                {hide ? "••••" : format(pool.allocatedCusd)}
              </span>
            </div>
          </div>
        ))}
      </div>
      <Link href="/assets" className="inline-block text-sm font-bold text-primary">
        View Assets
      </Link>
    </div>
  );
}
