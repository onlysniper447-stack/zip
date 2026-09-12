"use client";

import { Check, Copy, Wallet } from "lucide-react";
import { useState } from "react";
import { DualValue } from "@/components/money/dual-value";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { haptic } from "@/lib/haptic";
import { shortAccount } from "@/lib/testnet/wallet";
import { useWalletStore } from "@/stores/wallet-store";

export function EmbeddedWallet() {
  const address = useWalletStore((s) => s.chainAddress);
  const activeCusd = useWalletStore((s) => s.activeCusd);
  const hide = useWalletStore((s) => s.hideBalances);
  const liveError = useWalletStore((s) => s.liveError);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  async function copyAccount() {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    haptic("success");
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  async function topUp() {
    if (!address) return;
    setBusy(true);
    setNote(null);
    try {
      const response = await fetch("/api/testnet/faucet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string };
      window.dispatchEvent(new Event("zip-chain-refresh"));
      setNote(data.error ?? (data.ok ? "Testnet cash is on the way." : "Could not top up."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="bg-[radial-gradient(120%_80%_at_0%_0%,rgba(217,119,6,0.18),transparent_52%),#1A1612]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-primary/15 text-primary">
            <Wallet className="size-5" />
          </span>
          <div>
            <p className="text-sm font-bold text-foreground">ZIP Wallet</p>
            <p className="mt-0.5 text-xs font-medium text-muted">Built in · stays in the app</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void copyAccount()}
          disabled={!address}
          className="flex items-center gap-1.5 rounded-full border border-line bg-canvas px-3 py-1.5 text-xs font-bold text-foreground disabled:opacity-40"
          aria-label="Copy ZIP account"
        >
          {copied ? <Check className="size-3.5 text-yield" /> : <Copy className="size-3.5" />}
          {address ? shortAccount(address) : "Setting up…"}
        </button>
      </div>

      <div className="mt-4">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Spendable</p>
        <div className="mt-1">
          <DualValue amountCusd={activeCusd} size="lg" masked={hide} />
        </div>
      </div>

      {liveError ? <p className="mt-3 text-xs font-medium text-muted">{liveError}</p> : null}
      {note ? <p className="mt-3 text-sm font-medium text-yield">{note}</p> : null}

      <Button className="mt-4 w-full" disabled={busy || !address} onClick={() => void topUp()}>
        {busy ? "Topping up…" : "Get testnet cash"}
      </Button>
    </Card>
  );
}
