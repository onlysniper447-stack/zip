"use client";

import { ArrowDownUp, ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/flow/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";
import { useFiat } from "@/hooks/use-fiat";
import { executeIntent } from "@/lib/aa/smart-account";
import { haptic } from "@/lib/haptic";
import { formatFiat, roundFiat } from "@/lib/money";
import {
  SWAP_ASSETS,
  SWAP_PAIRS,
  formatSwapUnits,
  fromSwapUsd,
  swapAsset,
  toSwapUsd,
  type SwapTokenId,
} from "@/lib/mock/swap-assets";
import { useUiStore } from "@/stores/ui-store";
import { useWalletStore } from "@/stores/wallet-store";

export function SwapFlow() {
  const { fiat, format, toUsd, fromUsd, defaultAmount } = useFiat();
  const activeCusd = useWalletStore((s) => s.activeCusd);
  const tokens = useWalletStore((s) => s.tokenBalances);
  const hide = useWalletStore((s) => s.hideBalances);
  const applySwap = useWalletStore((s) => s.applySwap);
  const openReceipt = useUiStore((s) => s.openReceipt);

  const [fromId, setFromId] = useState<SwapTokenId>("cash");
  const [toId, setToId] = useState<SwapTokenId>("CTC");
  const [payAmount, setPayAmount] = useState(() => defaultAmount(25));
  const [amountFiat, setAmountFiat] = useState(fiat);
  const [picking, setPicking] = useState<"from" | "to" | null>(null);
  const [busy, setBusy] = useState(false);

  if (fromId === "cash" && amountFiat !== fiat) {
    setAmountFiat(fiat);
    setPayAmount(defaultAmount(25));
  }

  const from = swapAsset(fromId);
  const to = swapAsset(toId);
  const fromTicker = fromId === "cash" ? fiat : from.ticker;
  const toTicker = toId === "cash" ? fiat : to.ticker;

  const available = fromId === "cash" ? fromUsd(activeCusd) : (tokens?.[fromId] ?? 0);
  const payUsd = fromId === "cash" ? toUsd(payAmount) : toSwapUsd(payAmount, fromId);
  const receiveAmount = toId === "cash" ? fromUsd(payUsd) : fromSwapUsd(payUsd, toId);
  const oneFromUsd = fromId === "cash" ? toUsd(1) : from.usd;
  const oneFromInTo = toId === "cash" ? fromUsd(oneFromUsd) : fromSwapUsd(oneFromUsd, toId);
  const overBalance = payAmount > available + 1e-9 || payUsd <= 0;
  const sameAsset = fromId === toId;
  const canSwap = !busy && !overBalance && !sameAsset && payAmount > 0;

  const receiveLabel = useMemo(() => {
    if (toId === "cash") return hide ? "••••" : formatFiat(receiveAmount, fiat);
    return hide ? "••••" : `${formatSwapUnits(receiveAmount, toId)} ${toTicker}`;
  }, [fiat, hide, receiveAmount, toId, toTicker]);

  function availableFor(id: SwapTokenId) {
    if (id === "cash") return fromUsd(activeCusd);
    return tokens?.[id] ?? 0;
  }

  function setPair(nextFrom: SwapTokenId, nextTo: SwapTokenId) {
    setFromId(nextFrom);
    setToId(nextTo);
    if (nextFrom === "cash") setPayAmount(defaultAmount(25));
    else {
      const held = availableFor(nextFrom);
      setPayAmount(held > 0 ? Number((held / 4).toPrecision(4)) : 1);
    }
  }

  function flip() {
    haptic("light");
    const nextPay = toId === "cash" ? roundFiat(receiveAmount, fiat) : Number(receiveAmount.toPrecision(6));
    setFromId(toId);
    setToId(fromId);
    setPayAmount(nextPay > 0 ? nextPay : 0);
  }

  async function submit() {
    if (!canSwap) return;
    setBusy(true);
    haptic("medium");
    try {
      const result = await executeIntent({
        kind: "swap",
        amountCusd: payUsd,
        sourceFiat: fiat,
        destFiat: fiat,
        counterparty: `${fromTicker} → ${toTicker}`,
      });
      applySwap({
        fromId,
        toId,
        fromAmount: fromId === "cash" ? payUsd : payAmount,
        toAmount: toId === "cash" ? payUsd : receiveAmount,
        usd: payUsd,
        receiptId: result.receiptId,
      });
      haptic("success");
      openReceipt({
        title: `Swapped to ${toTicker}`,
        subtitle: `${formatSwapUnits(fromId === "cash" ? fromUsd(payUsd) : payAmount, fromId)} ${fromTicker} → ${toId === "cash" ? formatFiat(fromUsd(payUsd), fiat) : `${formatSwapUnits(receiveAmount, toId)} ${toTicker}`}`,
        amountCusd: 0,
        receiptId: result.receiptId,
        networkFeeLabel: "Sponsored · no extra fee",
        verifiedLabel: result.verifiedLabel,
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader title="Swap" subtitle="Change cash from one kind to another, instantly" />
      <div className="px-5 pb-8">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {SWAP_PAIRS.map((pair) => {
            const active = fromId === pair.from && toId === pair.to;
            return (
              <button
                key={pair.label}
                type="button"
                onClick={() => {
                  haptic("light");
                  setPair(pair.from, pair.to);
                }}
                className={
                  active
                    ? "rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-on-accent"
                    : "rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-muted hover:border-primary"
                }
              >
                {pair.label}
              </button>
            );
          })}
        </div>

        <div className="relative mt-4 space-y-2">
          <Card className="bg-canvas p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">You pay</p>
              <button
                type="button"
                onClick={() => setPicking("from")}
                className="inline-flex items-center gap-1 rounded-full border border-line bg-surface px-2.5 py-1 text-sm font-bold"
              >
                {fromTicker}
                <ChevronDown className="size-3.5 text-muted" />
              </button>
            </div>
            <Input
              type="number"
              value={payAmount}
              min={0}
              onChange={(e) => setPayAmount(Number(e.target.value))}
              className="mt-3 h-14 border-0 bg-transparent px-0 text-3xl font-bold"
            />
            <p className="mt-1 text-xs font-medium text-muted">
              Available {hide ? "••••" : fromId === "cash" ? format(activeCusd) : `${formatSwapUnits(available, fromId)} ${fromTicker}`}
            </p>
          </Card>

          <button
            type="button"
            onClick={flip}
            className="absolute left-1/2 top-1/2 z-10 grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-line bg-surface text-foreground shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
            aria-label="Flip swap direction"
          >
            <ArrowDownUp className="size-4" />
          </button>

          <Card className="bg-canvas p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">You get</p>
              <button
                type="button"
                onClick={() => setPicking("to")}
                className="inline-flex items-center gap-1 rounded-full border border-line bg-surface px-2.5 py-1 text-sm font-bold"
              >
                {toTicker}
                <ChevronDown className="size-3.5 text-muted" />
              </button>
            </div>
            <p className="mt-3 text-3xl font-bold tabular-nums text-foreground">{receiveLabel}</p>
            <p className="mt-1 text-xs font-medium text-muted">
              1 {fromTicker} ≈ {formatSwapUnits(oneFromInTo, toId)} {toTicker}
            </p>
          </Card>
        </div>

        <div className="mt-4 rounded-[16px] border border-[rgba(217,119,6,0.3)] bg-[rgba(217,119,6,0.15)] px-3 py-2 text-sm font-medium text-[#F59E0B]">
          Network fee · sponsored
        </div>
        {sameAsset ? (
          <p className="mt-3 text-sm font-medium text-danger">Pick two different balances to swap.</p>
        ) : overBalance && payAmount > 0 ? (
          <p className="mt-3 text-sm font-medium text-danger">Not enough {fromTicker} for this swap.</p>
        ) : null}

        <Button className="mt-4 w-full" size="lg" disabled={!canSwap} onClick={() => void submit()}>
          {busy ? "Swapping…" : "Confirm & Swap"}
        </Button>
      </div>

      <Sheet
        open={Boolean(picking)}
        onClose={() => setPicking(null)}
        title={picking === "to" ? "Swap to" : "Swap from"}
        subtitle="Cash and Creditcoin pairs"
      >
        <div className="space-y-2">
          {SWAP_ASSETS.map((asset) => {
            const ticker = asset.id === "cash" ? fiat : asset.ticker;
            const held = availableFor(asset.id);
            const disabled = picking === "from" ? asset.id === toId : asset.id === fromId;
            return (
              <button
                key={asset.id}
                type="button"
                disabled={disabled}
                onClick={() => {
                  haptic("light");
                  if (picking === "from") setPair(asset.id, toId);
                  else setPair(fromId, asset.id);
                  setPicking(null);
                }}
                className="flex w-full items-center justify-between rounded-[16px] border border-line bg-canvas px-4 py-3 text-left disabled:opacity-40"
              >
                <div>
                  <p className="text-sm font-bold">{ticker}</p>
                  <p className="text-xs text-muted">
                    {asset.name} · {asset.tag}
                  </p>
                </div>
                <p className="text-sm font-bold tabular-nums">
                  {hide
                    ? "••••"
                    : asset.id === "cash"
                      ? format(activeCusd)
                      : `${formatSwapUnits(held, asset.id)} ${ticker}`}
                </p>
              </button>
            );
          })}
        </div>
      </Sheet>
    </div>
  );
}
