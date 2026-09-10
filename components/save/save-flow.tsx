"use client";

import { useState } from "react";
import { SlideToConfirm } from "@/components/confirm/slide-to-confirm";
import { PageHeader } from "@/components/flow/page-header";
import { DualValue } from "@/components/money/dual-value";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";
import { useFiat } from "@/hooks/use-fiat";
import { useTickingYield } from "@/hooks/use-ticking-yield";
import { executeIntent } from "@/lib/aa/smart-account";
import { haptic } from "@/lib/haptic";
import { VAULTS, type Vault, type VaultId } from "@/lib/mock/catalog";
import { useUiStore } from "@/stores/ui-store";
import { useWalletStore } from "@/stores/wallet-store";

export function SaveFlow() {
  const positions = useWalletStore((s) => s.vaults);
  const activeCusd = useWalletStore((s) => s.activeCusd);
  const applySave = useWalletStore((s) => s.applySave);
  const applyWithdraw = useWalletStore((s) => s.applyWithdraw);
  const openReceipt = useUiStore((s) => s.openReceipt);
  const yieldNow = useTickingYield();
  const { fiat, format, toUsd, defaultAmount } = useFiat();
  const [vault, setVault] = useState<Vault | null>(null);
  const [mode, setMode] = useState<"deposit" | "withdraw">("deposit");
  const [amount, setAmount] = useState(() => defaultAmount(50));
  const [amountFiat, setAmountFiat] = useState(fiat);
  const [busy, setBusy] = useState(false);

  if (amountFiat !== fiat) {
    setAmountFiat(fiat);
    setAmount(defaultAmount(50));
  }

  const position = positions.find((item) => item.id === vault?.id)?.depositedCusd ?? 0;
  const amountCusd = toUsd(amount);
  const available = mode === "deposit" ? activeCusd : position;
  const canSubmit =
    Boolean(vault) && Number.isFinite(amountCusd) && amountCusd > 0 && amountCusd <= available + 1e-9 && !busy;
  const needsSlide = amountCusd >= 66;

  async function submit() {
    if (!vault || !canSubmit) return;
    setBusy(true);
    try {
      const result = await executeIntent({
        kind: mode === "deposit" ? "save" : "withdraw",
        amountCusd,
        sourceFiat: fiat,
        destFiat: fiat,
        counterparty: vault.id,
      });
      if (mode === "deposit") applySave(vault.id as VaultId, amountCusd, result.receiptId);
      else applyWithdraw(vault.id as VaultId, amountCusd, result.receiptId);
      setVault(null);
      openReceipt({
        title: mode === "deposit" ? `Added to ${vault.name}` : `Back to ZIP Wallet`,
        subtitle: vault.tagline,
        amountCusd: mode === "deposit" ? -amountCusd : amountCusd,
        receiptId: result.receiptId,
        railLabel: result.railName,
        verifiedLabel: result.verifiedLabel,
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader title="Save" subtitle="Real-world yield on idle cash" />
      <div className="px-5 pb-8">
        <Card className="bg-[radial-gradient(120%_80%_at_100%_0%,rgba(217,119,6,0.18),transparent_50%),#1A1612]">
          <p className="text-xs uppercase tracking-[0.14em] text-muted">Background yield</p>
          <p className="mt-2 text-3xl font-semibold text-yield">+{format(yieldNow.sessionUsd)}</p>
          <p className="mt-1 text-xs text-muted">
            {(yieldNow.blendedApy * 100).toFixed(1)}% blended · {format(yieldNow.dailyUsd)} / day
          </p>
        </Card>

        <div className="mt-4 space-y-3">
          {VAULTS.map((item) => {
            const held = positions.find((p) => p.id === item.id)?.depositedCusd ?? 0;
            return (
              <Card key={item.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{item.name}</p>
                    <p className="text-xs text-muted">{item.tagline}</p>
                  </div>
                  <p className="text-lg font-semibold text-yield">{(item.apy * 100).toFixed(1)}%</p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge>{item.risk}</Badge>
                  <Badge tone="neutral">{item.lock}</Badge>
                  {held > 0 ? <Badge tone="success">{format(held)} in</Badge> : null}
                </div>
                <p className="mt-3 text-xs leading-5 text-muted">{item.description}</p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      haptic("light");
                      setVault(item);
                      setMode("deposit");
                      setAmount(defaultAmount(50));
                    }}
                  >
                    Add cash
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={held <= 0}
                    onClick={() => {
                      haptic("light");
                      setVault(item);
                      setMode("withdraw");
                      setAmount(Math.min(defaultAmount(50), defaultAmount(held)));
                    }}
                  >
                    Withdraw
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      <Sheet
        open={Boolean(vault)}
        onClose={() => setVault(null)}
        title={vault ? `${mode === "deposit" ? "Add to" : "Withdraw from"} ${vault.name}` : ""}
        subtitle={vault?.backing}
      >
        <div className="space-y-4">
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            min={fiat === "NGN" ? 1000 : 1}
          />
          <DualValue amountCusd={amountCusd} size="md" />
          <p className="text-xs text-muted">
            {mode === "deposit"
              ? `Available in ZIP Wallet · ${format(activeCusd)}`
              : `Available in vault · ${format(position)}`}
          </p>
          {!canSubmit && amountCusd > available ? (
            <p className="text-sm font-medium text-danger">Not enough available for this amount.</p>
          ) : null}
          {needsSlide ? (
            <SlideToConfirm
              label={mode === "deposit" ? "Slide to deposit" : "Slide to withdraw"}
              disabled={!canSubmit}
              loading={busy}
              onConfirm={submit}
            />
          ) : (
            <Button className="w-full" size="lg" disabled={!canSubmit} onClick={submit}>
              {mode === "deposit" ? "Deposit now" : "Withdraw now"}
            </Button>
          )}
        </div>
      </Sheet>
    </div>
  );
}
