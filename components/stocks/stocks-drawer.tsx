"use client";

import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { SlideToConfirm } from "@/components/confirm/slide-to-confirm";
import { DualValue } from "@/components/money/dual-value";
import { Sparkline } from "@/components/stocks/sparkline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";
import { useFiat } from "@/hooks/use-fiat";
import { executeIntent } from "@/lib/aa/smart-account";
import { haptic } from "@/lib/haptic";
import { MARKET, type MarketAsset } from "@/lib/mock/stocks";
import { formatFiat } from "@/lib/money";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/stores/ui-store";
import { useWalletStore } from "@/stores/wallet-store";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function StocksDrawer({ open, onClose }: Props) {
  const [market, setMarket] = useState(MARKET);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const { fiat, format, toUsd, defaultAmount } = useFiat();
  const [amount, setAmount] = useState(() => defaultAmount(30));
  const [amountFiat, setAmountFiat] = useState(fiat);
  const [busy, setBusy] = useState(false);
  const activeCusd = useWalletStore((s) => s.activeCusd);
  const holdings = useWalletStore((s) => s.holdings) ?? [];
  const applyStockTrade = useWalletStore((s) => s.applyStockTrade);
  const openReceipt = useUiStore((s) => s.openReceipt);

  useEffect(() => {
    if (!open) return;
    const id = window.setInterval(() => {
      setMarket((current) =>
        current.map((asset) => {
          const tick = asset.priceUsd * (1 + (Math.random() - 0.48) * 0.0012);
          const next = Number(tick.toFixed(4));
          const series = [...asset.series.slice(1), next];
          const openPrice = series[0] ?? next;
          const changePct = ((next - openPrice) / openPrice) * 100;
          return { ...asset, priceUsd: next, series, changePct: Number(changePct.toFixed(2)) };
        }),
      );
    }, 1600);
    return () => window.clearInterval(id);
  }, [open]);

  if (amountFiat !== fiat) {
    setAmountFiat(fiat);
    setAmount(defaultAmount(30));
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return market;
    return market.filter(
      (asset) =>
        asset.symbol.toLowerCase().includes(q) ||
        asset.name.toLowerCase().includes(q) ||
        (asset.kind === "treasury" && ("tbill".includes(q) || "notes".includes(q))),
    );
  }, [market, query]);

  const selected = market.find((item) => item.id === selectedId) ?? null;
  const holding = holdings.find((item) => item.symbol === selected?.symbol)?.shares ?? 0;
  const amountCusd = toUsd(amount);
  const shares = selected ? amountCusd / selected.priceUsd : 0;
  const canSell = side === "sell" && shares <= holding + 1e-8;
  const canBuy = side === "buy" && amountCusd > 0 && amountCusd <= activeCusd;
  const canSubmit = Boolean(selected) && shares > 0 && (side === "buy" ? canBuy : canSell) && !busy;

  async function trade() {
    if (!selected || !canSubmit) return;
    setBusy(true);
    try {
      const result = await executeIntent({
        kind: "stock",
        amountCusd,
        sourceFiat: fiat,
        destFiat: fiat,
        counterparty: selected.symbol,
        side,
      });
      applyStockTrade({
        symbol: selected.symbol,
        side,
        shares,
        priceUsd: selected.priceUsd,
        receiptId: result.receiptId,
      });
      setSelectedId(null);
      onClose();
      openReceipt({
        title: `${side === "buy" ? "Bought" : "Sold"} ${selected.symbol}`,
        subtitle: `${shares.toFixed(4)} shares · ${formatFiat(amount, fiat)}`,
        amountCusd: side === "buy" ? -amountCusd : amountCusd,
        counterparty: selected.name,
        receiptId: result.receiptId,
        railLabel: result.railName,
        verifiedLabel: result.verifiedLabel,
        explorerUrl: result.explorerUrl,
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet
      open={open}
      onClose={() => {
        setSelectedId(null);
        setQuery("");
        onClose();
      }}
      title={selected ? selected.symbol : "Stocks"}
      subtitle={
        selected
          ? selected.name
          : "US equities & T-Bills, shown in your currency."
      }
    >
      {selected ? (
        <TradePanel
          asset={selected}
          side={side}
          setSide={setSide}
          amount={amount}
          setAmount={setAmount}
          shares={shares}
          holding={holding}
          amountCusd={amountCusd}
          canSubmit={canSubmit}
          busy={busy}
          onBack={() => setSelectedId(null)}
          onConfirm={trade}
        />
      ) : (
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-3.5 size-4 text-muted" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search AAPL, TSLA, VOO, TBILL"
              className="pl-10"
            />
          </div>
          {filtered.map((asset) => {
            const slice = holdings.find((item) => item.symbol === asset.symbol)?.shares ?? 0;
            const up = asset.changePct >= 0;
            return (
              <button
                key={asset.id}
                onClick={() => {
                  haptic("light");
                  setSelectedId(asset.id);
                }}
                className="flex w-full items-center gap-3 rounded-[16px] border border-line bg-canvas p-3 text-left hover:border-primary"
              >
                <span className="grid size-11 place-items-center rounded-[12px] bg-[rgba(217,119,6,0.15)] text-[11px] font-bold text-foreground">
                  {asset.symbol.slice(0, 2)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-foreground">{asset.symbol}</span>
                  <span className="block text-xs font-medium text-muted">
                    {asset.name}
                    {asset.apy ? ` · ${(asset.apy * 100).toFixed(1)}% APY` : ""}
                    {slice > 0 ? ` · ${slice.toFixed(3)} held` : ""}
                  </span>
                </span>
                <span className="w-16">
                  <Sparkline points={asset.series} up={up} height={28} />
                </span>
                <span className="text-right">
                  <span className="block text-sm font-bold text-foreground">{format(asset.priceUsd)}</span>
                  <span className={cn("block text-xs font-medium", up ? "text-yield" : "text-danger")}>
                    {up ? "+" : ""}
                    {asset.changePct.toFixed(2)}%
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </Sheet>
  );
}

function TradePanel({
  asset,
  side,
  setSide,
  amount,
  setAmount,
  shares,
  holding,
  amountCusd,
  canSubmit,
  busy,
  onBack,
  onConfirm,
}: {
  asset: MarketAsset;
  side: "buy" | "sell";
  setSide: (side: "buy" | "sell") => void;
  amount: number;
  setAmount: (value: number) => void;
  shares: number;
  holding: number;
  amountCusd: number;
  canSubmit: boolean;
  busy: boolean;
  onBack: () => void;
  onConfirm: () => void;
}) {
  const { fiat, format } = useFiat();
  const up = asset.changePct >= 0;
  const liveLabel = useMemo(
    () => `${up ? "+" : ""}${asset.changePct.toFixed(2)}% today`,
    [asset.changePct, up],
  );

  return (
    <div className="space-y-4">
      <Card className="bg-canvas p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted">{asset.name}</p>
            <p className="mt-1 text-3xl font-bold text-foreground">{format(asset.priceUsd)}</p>
            <p className={cn("mt-1 text-sm font-medium", up ? "text-yield" : "text-danger")}>{liveLabel}</p>
          </div>
          {asset.apy ? (
            <Badge tone="success">{(asset.apy * 100).toFixed(1)}% APY</Badge>
          ) : (
            <Badge tone={up ? "success" : "warn"}>US equity</Badge>
          )}
        </div>
        <Sparkline points={asset.series} up={up} className="mt-4" />
      </Card>

      <div className="grid grid-cols-2 gap-2 rounded-[16px] bg-canvas p-1">
        {(["buy", "sell"] as const).map((item) => (
          <button
            key={item}
            onClick={() => setSide(item)}
            className={cn(
              "rounded-[12px] py-2.5 text-sm font-bold capitalize",
              side === item ? "bg-primary text-on-accent" : "text-muted",
            )}
          >
            {item}
          </button>
        ))}
      </div>

      <Input
        type="number"
        min={fiat === "NGN" ? 1000 : 1}
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
        aria-label="Amount"
      />
      <DualValue amountCusd={amountCusd} size="md" />
      <p className="text-sm font-medium text-muted">
        {shares.toFixed(4)} shares · you hold {holding.toFixed(4)}
      </p>

      {amountCusd >= 66 ? (
        <SlideToConfirm
          label={`${side === "buy" ? "Slide to buy" : "Slide to sell"} ${asset.symbol}`}
          disabled={!canSubmit}
          loading={busy}
          onConfirm={onConfirm}
        />
      ) : (
        <Button className="w-full" size="lg" disabled={!canSubmit} onClick={onConfirm}>
          {side === "buy" ? "Buy" : "Sell"} {formatFiat(amount, fiat)}
        </Button>
      )}
      <button onClick={onBack} className="w-full text-sm font-medium text-muted">
        Back to market
      </button>
    </div>
  );
}
