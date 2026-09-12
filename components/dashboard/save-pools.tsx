"use client";

import Link from "next/link";
import { useState } from "react";
import { DualValue } from "@/components/money/dual-value";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";
import { useFiat } from "@/hooks/use-fiat";
import { executeIntent } from "@/lib/aa/smart-account";
import { haptic } from "@/lib/haptic";
import { creditcoinPools, defiBlendedApy, defiTotal, type DefiPool } from "@/lib/mock/defi-pools";
import { useUiStore } from "@/stores/ui-store";
import { useWalletStore } from "@/stores/wallet-store";

export function SavePools({
  vaults,
  hide,
  tick,
}: {
  vaults: Array<{ id: string; depositedCusd: number }>;
  hide: boolean;
  tick: number;
}) {
  const { fiat, format, toUsd, defaultAmount } = useFiat();
  const activeCusd = useWalletStore((s) => s.activeCusd);
  const applySave = useWalletStore((s) => s.applySave);
  const applyWithdraw = useWalletStore((s) => s.applyWithdraw);
  const openReceipt = useUiStore((s) => s.openReceipt);
  const pools = creditcoinPools(vaults, tick);
  const total = defiTotal(pools);
  const blended = defiBlendedApy(pools);

  const [pool, setPool] = useState<DefiPool | null>(null);
  const [mode, setMode] = useState<"deposit" | "withdraw">("deposit");
  const [amount, setAmount] = useState(() => defaultAmount(25));
  const [amountFiat, setAmountFiat] = useState(fiat);
  const [busy, setBusy] = useState(false);

  if (amountFiat !== fiat) {
    setAmountFiat(fiat);
    setAmount(defaultAmount(25));
  }

  const position = pool?.allocatedCusd ?? 0;
  const amountCusd = toUsd(amount);
  const available = mode === "deposit" ? activeCusd : position;
  const canSubmit =
    Boolean(pool) && Number.isFinite(amountCusd) && amountCusd > 0 && amountCusd <= available + 1e-9 && !busy;

  function open(next: DefiPool, nextMode: "deposit" | "withdraw") {
    haptic("light");
    setPool(next);
    setMode(nextMode);
    const cap = nextMode === "deposit" ? activeCusd : next.allocatedCusd;
    setAmount(Math.min(defaultAmount(25), defaultAmount(Math.max(cap, 0))));
  }

  async function submit() {
    if (!pool || !canSubmit) return;
    setBusy(true);
    try {
      const result = await executeIntent({
        kind: mode === "deposit" ? "save" : "withdraw",
        amountCusd,
        sourceFiat: fiat,
        destFiat: fiat,
        counterparty: pool.id,
      });
      if (mode === "deposit") applySave(pool.id, amountCusd, result.receiptId);
      else applyWithdraw(pool.id, amountCusd, result.receiptId);
      setPool(null);
      openReceipt({
        title: mode === "deposit" ? `Deposited to ${pool.name}` : `Withdrawn from ${pool.name}`,
        subtitle: "Anytime · no lock",
        amountCusd: mode === "deposit" ? -amountCusd : amountCusd,
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
    <div className="mt-3 space-y-3">
      <DualValue amountCusd={total} size="md" masked={hide} />
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-yield">Active Creditcoin DeFi pools</p>
        <p className="shrink-0 text-xs font-bold text-yield">{(blended * 100).toFixed(1)}% blended</p>
      </div>
      <div className="space-y-2">
        {pools.map((item) => (
          <div key={item.id} className="rounded-[14px] border border-line bg-surface/80 px-3 py-2.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-bold text-foreground">{item.name}</p>
                <p className="mt-0.5 text-[11px] font-medium text-muted">
                  {item.detail} · {item.protocol}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-bold tabular-nums text-yield">{(item.apy * 100).toFixed(1)}%</p>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-yield/80">
                  {item.live ? "Live " : ""}
                  {item.rateLabel}
                </p>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {item.pairTokens.map((token) => (
                <Badge key={`${item.id}-${token}`} tone="neutral">
                  {token}
                </Badge>
              ))}
              <Badge>{item.pairTag}</Badge>
              <Badge tone="success">Anytime</Badge>
              {item.poolShare != null ? (
                <Badge tone="neutral">{(item.poolShare * 100).toFixed(1)}% share</Badge>
              ) : null}
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="font-medium text-muted">Allocated</span>
              <span className="font-bold tabular-nums text-foreground">
                {hide ? "••••" : format(item.allocatedCusd)}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button size="sm" onClick={() => open(item, "deposit")}>
                Deposit
              </Button>
              <Button size="sm" variant="secondary" disabled={item.allocatedCusd <= 0} onClick={() => open(item, "withdraw")}>
                Withdraw
              </Button>
            </div>
          </div>
        ))}
      </div>
      <Link href="/settings/holdings" className="inline-block text-sm font-bold text-primary">
        View Assets
      </Link>

      <Sheet
        open={Boolean(pool)}
        onClose={() => setPool(null)}
        title={pool ? `${mode === "deposit" ? "Deposit to" : "Withdraw from"} ${pool.name}` : ""}
        subtitle="Anytime · no lock"
      >
        <div className="space-y-4">
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            min={fiat === "NGN" ? 1000 : 1}
            aria-label={mode === "deposit" ? "Deposit amount" : "Withdraw amount"}
          />
          <DualValue amountCusd={amountCusd} size="md" />
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted">
              {mode === "deposit"
                ? `Available in ZIP Wallet · ${format(activeCusd)}`
                : `Available in pool · ${format(position)}`}
            </p>
            <button
              type="button"
              className="text-xs font-bold text-primary"
              onClick={() => setAmount(defaultAmount(available))}
            >
              Use all
            </button>
          </div>
          {!canSubmit && amountCusd > available ? (
            <p className="text-sm font-medium text-danger">Not enough available for this amount.</p>
          ) : null}
          <Button className="w-full" size="lg" disabled={!canSubmit} onClick={() => void submit()}>
            {busy ? (mode === "deposit" ? "Depositing…" : "Withdrawing…") : mode === "deposit" ? "Deposit now" : "Withdraw now"}
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
