"use client";

import { ArrowLeftRight, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/components/flow/page-header";
import { DualValue } from "@/components/money/dual-value";
import { StocksDrawer } from "@/components/stocks/stocks-drawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useFiat } from "@/hooks/use-fiat";
import { useTickingYield } from "@/hooks/use-ticking-yield";
import { haptic } from "@/lib/haptic";
import { VAULTS } from "@/lib/mock/catalog";
import { MARKET } from "@/lib/mock/stocks";
import { SWAP_COINS, formatSwapUnits, tokenBalancesUsd } from "@/lib/mock/swap-assets";
import { useWalletStore, vaultTotal } from "@/stores/wallet-store";

export function HoldingsView() {
  const [stocksOpen, setStocksOpen] = useState(false);
  const hide = useWalletStore((s) => s.hideBalances);
  const activeCusd = useWalletStore((s) => s.activeCusd);
  const vaults = useWalletStore((s) => s.vaults);
  const holdings = useWalletStore((s) => s.holdings) ?? [];
  const tokens = useWalletStore((s) => s.tokenBalances);
  const { format } = useFiat();
  const yieldNow = useTickingYield();
  const vaultCusd = vaultTotal(vaults);
  const stocksCusd = holdings.reduce((sum, item) => {
    const asset = MARKET.find((row) => row.symbol === item.symbol);
    return sum + item.shares * (asset?.priceUsd ?? 0);
  }, 0);
  const swapCusd = tokenBalancesUsd(tokens);
  const totalCusd = activeCusd + vaultCusd + stocksCusd + swapCusd;
  const openVaults = vaults.filter((item) => item.depositedCusd > 0);
  const openTokens = SWAP_COINS.filter((asset) => (tokens?.[asset.id] ?? 0) > 0);

  return (
    <div>
      <PageHeader title="Asset holdings" subtitle="Everything in your ZIP Wallet" />
      <div className="px-5 pb-8">
        <Card className="bg-[radial-gradient(120%_80%_at_100%_0%,rgba(217,119,6,0.18),transparent_50%),#1A1612]">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Total</p>
          <div className="mt-2">
            <DualValue amountCusd={totalCusd} size="lg" masked={hide} />
          </div>
          <p className="mt-2 text-sm font-medium text-yield">
            {(yieldNow.blendedApy * 100).toFixed(1)}% blended · {hide ? "••" : format(yieldNow.dailyUsd)} / day
          </p>
        </Card>

        <h2 className="mt-6 text-base font-bold">Cash</h2>
        <Card className="mt-3 flex items-center justify-between p-4">
          <div>
            <p className="text-sm font-bold">Spendable</p>
            <p className="text-xs text-muted">Ready to tip, swap, or cash out</p>
          </div>
          <p className="text-sm font-bold">{hide ? "••••" : format(activeCusd)}</p>
        </Card>

        <div className="mt-6 flex items-center justify-between">
          <h2 className="text-base font-bold">Swap balances</h2>
          <p className="text-sm font-medium text-muted">{hide ? "••••" : format(swapCusd)}</p>
        </div>
        <div className="mt-3 space-y-2">
          {openTokens.length === 0 ? (
            <Card className="p-4 text-sm text-muted">No swap balances yet.</Card>
          ) : (
            openTokens.map((asset) => {
              const held = tokens?.[asset.id] ?? 0;
              return (
                <Card key={asset.id} className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm font-bold">{asset.ticker}</p>
                    <p className="text-xs text-muted">
                      {asset.name} · {asset.tag}
                    </p>
                  </div>
                  <p className="text-sm font-bold tabular-nums">
                    {hide ? "••••" : `${formatSwapUnits(held, asset.id)} ${asset.ticker}`}
                  </p>
                </Card>
              );
            })
          )}
        </div>
        <Link
          href="/swap"
          onClick={() => haptic("light")}
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-primary"
        >
          <ArrowLeftRight className="size-3.5" />
          Open Swap
        </Link>

        <div className="mt-6 flex items-center justify-between">
          <h2 className="text-base font-bold">Save</h2>
          <p className="text-sm font-medium text-muted">{hide ? "••••" : format(vaultCusd)}</p>
        </div>
        <div className="mt-3 space-y-2">
          {openVaults.length === 0 ? (
            <Card className="p-4 text-sm text-muted">No vault deposits yet.</Card>
          ) : (
            openVaults.map((position) => {
              const vault = VAULTS.find((item) => item.id === position.id);
              return (
                <Card key={position.id} className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm font-bold">{vault?.name ?? position.id}</p>
                    <p className="text-xs text-muted">{vault?.tagline}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{hide ? "••••" : format(position.depositedCusd)}</p>
                    <Badge tone="success">{((vault?.apy ?? 0) * 100).toFixed(1)}%</Badge>
                  </div>
                </Card>
              );
            })
          )}
        </div>
        <Link href="/save" onClick={() => haptic("light")} className="mt-3 inline-block text-sm font-bold text-primary">
          Manage Save
        </Link>

        <div className="mt-6 flex items-center justify-between">
          <h2 className="text-base font-bold">Stocks</h2>
          <p className="text-sm font-medium text-muted">{hide ? "••••" : format(stocksCusd)}</p>
        </div>
        <div className="mt-3 space-y-2">
          {holdings.length === 0 ? (
            <Card className="p-4 text-sm text-muted">No holdings yet.</Card>
          ) : (
            holdings.map((item) => {
              const asset = MARKET.find((row) => row.symbol === item.symbol);
              const value = item.shares * (asset?.priceUsd ?? 0);
              return (
                <Card key={item.symbol} className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm font-bold">{item.symbol}</p>
                    <p className="text-xs text-muted">
                      {item.shares.toFixed(4)} shares
                      {asset?.apy ? ` · ${(asset.apy * 100).toFixed(1)}% APY` : ""}
                    </p>
                  </div>
                  <p className="text-sm font-bold">{hide ? "••••" : format(value)}</p>
                </Card>
              );
            })
          )}
        </div>
        <Button
          className="mt-5 w-full"
          variant="secondary"
          onClick={() => {
            haptic("light");
            setStocksOpen(true);
          }}
        >
          <TrendingUp className="size-4" />
          Trade stocks
        </Button>
      </div>
      <StocksDrawer open={stocksOpen} onClose={() => setStocksOpen(false)} />
    </div>
  );
}
