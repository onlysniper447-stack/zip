"use client";

import { useState } from "react";
import { SlideToConfirm } from "@/components/confirm/slide-to-confirm";
import { PageHeader } from "@/components/flow/page-header";
import { DualValue } from "@/components/money/dual-value";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";
import { useFiat } from "@/hooks/use-fiat";
import { executeIntent } from "@/lib/aa/smart-account";
import { haptic } from "@/lib/haptic";
import { formatFiat } from "@/lib/money";
import { accountLabel } from "@/lib/payments/rails";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/stores/ui-store";
import { useWalletStore } from "@/stores/wallet-store";

export function OffRampFlow() {
  const { fiat, format, toUsd, defaultAmount, accounts, railName, eta, railCopy } = useFiat();
  const activeCusd = useWalletStore((s) => s.activeCusd);
  const applyOfframp = useWalletStore((s) => s.applyOfframp);
  const openReceipt = useUiStore((s) => s.openReceipt);
  const [amount, setAmount] = useState(() => defaultAmount(50));
  const [amountFiat, setAmountFiat] = useState(fiat);
  const [kind, setKind] = useState<"bank" | "wallet">("bank");
  const [destination, setDestination] = useState(accounts[0]?.id ?? "");
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  if (amountFiat !== fiat) {
    setAmountFiat(fiat);
    setAmount(defaultAmount(50));
    const first = accounts.find((item) => item.kind === "bank") ?? accounts[0];
    setKind(first?.kind === "wallet" ? "wallet" : "bank");
    setDestination(first?.id ?? "");
  }

  const amountCusd = toUsd(amount);
  const visible = accounts.filter((item) => (kind === "wallet" ? item.kind === "wallet" : item.kind === "bank"));
  const selected = accounts.find((item) => item.id === destination);
  const destLabel = selected ? accountLabel(selected) : railName;
  const hasWallets = accounts.some((item) => item.kind === "wallet");

  async function send() {
    setBusy(true);
    try {
      const result = await executeIntent({
        kind: "offramp",
        amountCusd,
        sourceFiat: fiat,
        destFiat: fiat,
        counterparty: destLabel,
      });
      applyOfframp({ amountCusd, destination: destLabel, receiptId: result.receiptId });
      setConfirm(false);
      openReceipt({
        title: "Cash out started",
        subtitle: `Usually arrives in ${eta.toLowerCase()}`,
        amountCusd: -amountCusd,
        counterparty: destLabel,
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
    <div>
      <PageHeader title="Cash out" subtitle={`To your local ${railName} account`} />
      <div className="px-5 pb-8">
        <Card>
          <p className="text-xs uppercase tracking-[0.14em] text-muted">Amount</p>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="mt-3 text-2xl font-semibold"
          />
          <div className="mt-3">
            <DualValue amountCusd={amountCusd} size="sm" />
          </div>
          <p className="mt-2 text-xs text-muted">Available {format(activeCusd)}</p>
        </Card>

        {hasWallets ? (
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setKind("bank");
                setDestination(accounts.find((item) => item.kind === "bank")?.id ?? "");
              }}
              className={cn(
                "rounded-2xl py-3 text-sm font-bold",
                kind === "bank" ? "bg-primary text-on-accent" : "border border-line bg-surface text-muted hover:border-primary",
              )}
            >
              Bank
            </button>
            <button
              onClick={() => {
                setKind("wallet");
                setDestination(accounts.find((item) => item.kind === "wallet")?.id ?? "");
              }}
              className={cn(
                "rounded-2xl py-3 text-sm font-bold",
                kind === "wallet" ? "bg-primary text-on-accent" : "border border-line bg-surface text-muted hover:border-primary",
              )}
            >
              Instant wallet
            </button>
          </div>
        ) : null}

        <div className="mt-3 space-y-2">
          {visible.map((item) => (
            <button
              key={item.id}
              onClick={() => setDestination(item.id)}
              className={cn(
                "flex w-full items-center justify-between rounded-2xl p-4 text-left",
                destination === item.id
                  ? "bg-[rgba(217,119,6,0.15)] ring-1 ring-primary"
                  : "border border-line bg-surface hover:border-primary",
              )}
            >
              <span className="text-sm font-semibold">{item.name}</span>
              {item.last4 ? <span className="text-xs text-muted">··{item.last4}</span> : null}
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            haptic("medium");
            setConfirm(true);
          }}
          disabled={amountCusd <= 0 || amountCusd > activeCusd}
          className="mt-5 h-14 w-full rounded-2xl bg-primary text-sm font-bold text-on-accent disabled:opacity-40 hover:bg-primary/90"
        >
          Review cash out
        </button>
      </div>

      <Sheet open={confirm} onClose={() => setConfirm(false)} title="Confirm cash out" subtitle={destLabel}>
        <div className="space-y-4">
          <DualValue amountCusd={amountCusd} size="lg" align="center" />
          <p className="text-center text-xs text-muted">This cannot be undone once it hits {railName}.</p>
          <div className="rounded-2xl border border-[rgba(217,119,6,0.3)] bg-[rgba(217,119,6,0.15)] px-3 py-2 text-xs text-[#F59E0B]">
            {railCopy}
          </div>
          <SlideToConfirm label={`Slide to send ${formatFiat(amount, fiat)}`} loading={busy} onConfirm={send} />
        </div>
      </Sheet>
    </div>
  );
}
