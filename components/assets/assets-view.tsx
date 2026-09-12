"use client";

import { ArrowLeftRight, PieChart, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { EmbeddedWallet } from "@/components/assets/embedded-wallet";
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

export function AssetsView() {
  const [stocksOpen, setStocksOpen] = useState(false);
  const hide = useWalletStore((s) => s.hideBalances);
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
  const totalCusd = vaultCusd + stocksCusd + swapCusd;
  const openVaults = vaults.filter((item) => item.depositedCusd > 0);

  return (
    <div>
      <header className="sticky top-0 z-10 bg-background/90 px-5 py-4 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <span className="grid size-10 place-items-center rounded-full bg-primary/15 text-primary">
            <PieChart className="size-5" />
          </span>
          <div>
            <h1 className="text-lg font-semibold leading-none">Assets</h1>
            <p className="mt-1 text-xs text-muted">Wallet, vaults, and holdings</p>
          </div>
        </div>
      </header>

      <div className="px-5 pb-8">
        <EmbeddedWallet />

        <Card className="mt-4 bg-[radial-gradient(120%_80%_at_100%_0%,rgba(217,119,6,0.18),transparent_50%),#1A1612]">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Portfolio</p>
          <div className="mt-2">
            <DualValue amountCusd={totalCusd} size="lg" masked={hide} />
          </div>
          <p className="mt-2 text-sm font-medium text-yield">
            {(yieldNow.blendedApy * 100).toFixed(1)}% blended · {hide ? "••" : format(yieldNow.dailyUsd)} / day
          </p>
        </Card>

        <div className="mt-5 flex items-center justify-between">
          <h2 className="text-base font-bold">Swap balances</h2>
          <p className="text-sm font-medium text-muted">{hide ? "••••" : format(swapCusd)}</p>
        </div>
        <div className="mt-3 space-y-2">
          {SWAP_COINS.map((asset) => {
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
          })}
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
        <Link
          href="/save"
          onClick={() => haptic("light")}
          className="mt-3 inline-block text-sm font-bold text-primary"
        >
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
