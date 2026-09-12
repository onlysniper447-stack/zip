"use client";

import { Check, Copy, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { PinBoxes } from "@/components/auth/pin-boxes";
import { PageHeader } from "@/components/flow/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { haptic } from "@/lib/haptic";
import { updatePin, verifyPin } from "@/lib/auth/local-accounts";
import { getEmbeddedKey, shortAccount } from "@/lib/testnet/wallet";
import { useSessionStore } from "@/stores/session-store";
import { useWalletStore } from "@/stores/wallet-store";

export function SecurityView() {
  const phone = useSessionStore((s) => s.phone);
  const email = useSessionStore((s) => s.email);
  const identity = { phone, email };
  const hide = useWalletStore((s) => s.hideBalances);
  const toggleHide = useWalletStore((s) => s.toggleHide);
  const address = useWalletStore((s) => s.chainAddress);
  const [currentPin, setCurrentPin] = useState("");
  const [nextPin, setNextPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinNote, setPinNote] = useState<string | null>(null);
  const [pinError, setPinError] = useState<string | null>(null);
  const [revealPin, setRevealPin] = useState("");
  const [secret, setSecret] = useState<string | null>(null);
  const [revealError, setRevealError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function changePassword() {
    setPinError(null);
    setPinNote(null);
    if (nextPin !== confirmPin) {
      setPinError("New PIN and confirmation don’t match.");
      return;
    }
    const result = updatePin(identity, currentPin, nextPin);
    if (!result.ok) {
      setPinError(result.error ?? "Could not update PIN.");
      return;
    }
    haptic("success");
    setPinNote("PIN updated.");
    setCurrentPin("");
    setNextPin("");
    setConfirmPin("");
  }

  function revealKey() {
    setRevealError(null);
    if (!verifyPin(identity, revealPin)) {
      setRevealError("PIN doesn’t match.");
      setSecret(null);
      return;
    }
    haptic("medium");
    setSecret(getEmbeddedKey());
  }

  async function copyKey() {
    if (!secret) return;
    await navigator.clipboard.writeText(secret);
    haptic("success");
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <div>
      <PageHeader title="Security & privacy" subtitle="PIN, wallet key, and visibility" />
      <div className="px-5 pb-8">
        <Card>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold">Hide balances</p>
              <p className="mt-1 text-xs text-muted">Mask amounts on Home and holdings.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                haptic("light");
                toggleHide();
              }}
              className="grid size-11 place-items-center rounded-full border border-line bg-canvas"
              aria-label={hide ? "Show balances" : "Hide balances"}
            >
              {hide ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </Card>

        <Card className="mt-4 space-y-4">
          <div>
            <p className="text-sm font-bold">Change password</p>
            <p className="mt-1 text-xs text-muted">Your ZIP password is the 6-digit PIN you created at sign up.</p>
          </div>
          <PinBoxes value={currentPin} onChange={setCurrentPin} ariaLabel="Current PIN" />
          <PinBoxes value={nextPin} onChange={setNextPin} ariaLabel="New PIN" />
          <PinBoxes value={confirmPin} onChange={setConfirmPin} ariaLabel="Confirm new PIN" />
          {pinError ? <p className="text-sm font-medium text-danger">{pinError}</p> : null}
          {pinNote ? <p className="text-sm font-medium text-yield">{pinNote}</p> : null}
          <Button
            className="w-full"
            disabled={currentPin.length !== 6 || nextPin.length !== 6 || confirmPin.length !== 6}
            onClick={changePassword}
          >
            Update PIN
          </Button>
        </Card>

        <Card className="mt-4 space-y-4">
          <div>
            <p className="text-sm font-bold">Wallet private key</p>
            <p className="mt-1 text-xs text-muted">
              Enter your PIN to view the key for this device’s ZIP Wallet. Anyone with this key can move your testnet
              cash. Never share it.
            </p>
            {address ? <p className="mt-2 text-xs font-bold text-foreground">Account {shortAccount(address)}</p> : null}
          </div>
          <PinBoxes value={revealPin} onChange={setRevealPin} ariaLabel="PIN to reveal key" />
          {revealError ? <p className="text-sm font-medium text-danger">{revealError}</p> : null}
          <Button className="w-full" variant="secondary" disabled={revealPin.length !== 6} onClick={revealKey}>
            Reveal key
          </Button>
          {secret ? (
            <div className="rounded-2xl border border-danger/40 bg-danger/10 p-3">
              <p className="break-all font-mono text-[11px] leading-5 text-foreground">{secret}</p>
              <button
                type="button"
                onClick={() => void copyKey()}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-primary"
              >
                {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                {copied ? "Copied" : "Copy key"}
              </button>
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
