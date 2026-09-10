"use client";

import { useMemo, useState } from "react";
import { CreditGauge } from "@/components/borrow/credit-gauge";
import { SlideToConfirm } from "@/components/confirm/slide-to-confirm";
import { PageHeader } from "@/components/flow/page-header";
import { DualValue } from "@/components/money/dual-value";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Sheet } from "@/components/ui/sheet";
import { useFiat } from "@/hooks/use-fiat";
import { executeIntent } from "@/lib/aa/smart-account";
import { haptic } from "@/lib/haptic";
import { loanApr, maxLoanUsd, weeklyPayment } from "@/lib/loan";
import type { TrancheId } from "@/lib/mock/catalog";
import { formatFiat, roundFiat } from "@/lib/money";
import { cn } from "@/lib/utils";
import { useSessionStore } from "@/stores/session-store";
import { useUiStore } from "@/stores/ui-store";
import { useWalletStore, vaultTotal } from "@/stores/wallet-store";

export function BorrowFlow() {
  const score = useSessionStore((s) => s.creditScore);
  const vaults = useWalletStore((s) => s.vaults);
  const loan = useWalletStore((s) => s.loan);
  const applyBorrow = useWalletStore((s) => s.applyBorrow);
  const openReceipt = useUiStore((s) => s.openReceipt);
  const { fiat, toUsd, fromUsd, defaultAmount, railName } = useFiat();
  const [tranche, setTranche] = useState<TrancheId>("standard");
  const [weeks, setWeeks] = useState(8);
  const [amount, setAmount] = useState(() => defaultAmount(100));
  const [amountFiat, setAmountFiat] = useState(fiat);
  const [destination, setDestination] = useState<"wallet" | "rail">("wallet");
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  if (amountFiat !== fiat) {
    setAmountFiat(fiat);
    setAmount(defaultAmount(100));
  }

  const maxUsd = maxLoanUsd(score, vaultTotal(vaults), tranche);
  const maxFiat = roundFiat(fromUsd(maxUsd), fiat);
  const minFiat = roundFiat(fromUsd(13.33), fiat);
  const step = fiat === "NGN" ? 5_000 : 1;
  const capped = Math.min(amount, maxFiat);
  const amountCusd = toUsd(capped);
  const apr = useMemo(() => loanApr(score, weeks, tranche), [score, weeks, tranche]);
  const weekly = weeklyPayment(capped, weeks, apr);

  async function confirmLoan() {
    setBusy(true);
    try {
      const result = await executeIntent({
        kind: "borrow",
        amountCusd,
        sourceFiat: fiat,
        destFiat: fiat,
      });
      applyBorrow({
        principalCusd: amountCusd,
        remainingCusd: amountCusd,
        apr,
        weeks,
        tranche,
        destination,
        startedAt: new Date().toISOString(),
        receiptId: result.receiptId,
      });
      setConfirm(false);
      openReceipt({
        title: destination === "wallet" ? "Deposited to ZIP Wallet" : "Sent to your bank",
        subtitle: `${(apr * 100).toFixed(1)}% · ${weeks} weeks`,
        amountCusd,
        receiptId: result.receiptId,
        railLabel: destination === "rail" ? result.railName : undefined,
        verifiedLabel: result.verifiedLabel,
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader title="Borrow" subtitle="Priced from your repayment history" />
      <div className="px-5 pb-8">
        <Card className="flex flex-col items-center p-5">
          <CreditGauge score={score} />
          <Badge tone="neutral" className="mt-2">
            Verified on Creditcoin
          </Badge>
          <p className="mt-2 text-center text-xs text-muted">
            Strong repayment history. This score is private to you until you share it.
          </p>
        </Card>

        {loan ? (
          <Card className="mt-4">
            <p className="text-xs uppercase tracking-[0.14em] text-muted">Open loan</p>
            <DualValue amountCusd={loan.remainingCusd} size="md" />
            <p className="mt-2 text-xs text-muted">
              {(loan.apr * 100).toFixed(1)}% · {loan.weeks} weeks remaining schedule
            </p>
          </Card>
        ) : null}

        <div className="mt-4 grid grid-cols-2 gap-2">
          {(
            [
              ["standard", "Standard micro-loan", "No extra lock. Higher rate."],
              ["collateral", "Collateralized drawdown", "Backed by your vaults. Lower rate."],
            ] as const
          ).map(([id, title, copy]) => (
            <button
              key={id}
              onClick={() => {
                haptic("light");
                setTranche(id);
                setAmount(Math.min(amount, roundFiat(fromUsd(maxLoanUsd(score, vaultTotal(vaults), id)), fiat)));
              }}
              className={cn(
                "rounded-3xl border p-4 text-left",
                tranche === id ? "border-primary bg-[rgba(217,119,6,0.15)]" : "border-line bg-surface hover:border-primary",
              )}
            >
              <p className="text-sm font-semibold">{title}</p>
              <p className="mt-1 text-[11px] text-muted">{copy}</p>
            </button>
          ))}
        </div>

        <Card className="mt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Amount</p>
            <p className="text-sm font-semibold">{formatFiat(capped, fiat)}</p>
          </div>
          <input
            type="range"
            min={minFiat}
            max={Math.max(minFiat, maxFiat)}
            step={step}
            value={capped}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="mt-3 w-full accent-primary"
          />
          <DualValue amountCusd={amountCusd} size="sm" />

          <div className="mt-5 flex items-center justify-between">
            <p className="text-sm font-medium">Duration</p>
            <p className="text-sm font-semibold">{weeks} weeks</p>
          </div>
          <input
            type="range"
            min={4}
            max={24}
            step={1}
            value={weeks}
            onChange={(e) => setWeeks(Number(e.target.value))}
            className="mt-3 w-full accent-primary"
          />

          <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-black/20 p-3 text-sm">
            <div>
              <p className="text-xs text-muted">Rate</p>
              <p className="font-semibold">{(apr * 100).toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-xs text-muted">Weekly</p>
              <p className="font-semibold">{formatFiat(weekly, fiat)}</p>
            </div>
          </div>
        </Card>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {(
            [
              ["wallet", "ZIP Wallet"],
              ["rail", `Bank · ${railName}`],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setDestination(id)}
              className={cn(
                "rounded-2xl py-3 text-sm font-semibold",
                destination === id ? "bg-primary text-on-accent" : "border border-line bg-surface text-muted hover:border-primary",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {loan ? (
          <p className="mt-5 text-center text-sm font-medium text-muted">
            Finish this plan before opening another loan.
          </p>
        ) : (
          <button
            onClick={() => {
              haptic("medium");
              setConfirm(true);
            }}
            className="mt-5 h-14 w-full rounded-2xl bg-primary text-sm font-bold text-on-accent hover:bg-primary/90"
          >
            Review loan
          </button>
        )}
      </div>

      <Sheet
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Confirm loan"
        subtitle="This creates a repayment plan. Slide to accept."
      >
        <div className="space-y-4">
          <DualValue amountCusd={amountCusd} size="lg" align="center" />
          <dl className="space-y-2 rounded-2xl bg-white/4 p-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Plan</dt>
              <dd>{tranche === "standard" ? "Standard micro-loan" : "Collateralized drawdown"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Rate</dt>
              <dd>{(apr * 100).toFixed(1)}%</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Weekly</dt>
              <dd>{formatFiat(weekly, fiat)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Payout</dt>
              <dd>{destination === "wallet" ? "ZIP Wallet" : `Linked ${railName} account`}</dd>
            </div>
          </dl>
          <SlideToConfirm
            label="Slide to confirm loan"
            loading={busy}
            onConfirm={confirmLoan}
          />
        </div>
      </Sheet>
    </div>
  );
}
