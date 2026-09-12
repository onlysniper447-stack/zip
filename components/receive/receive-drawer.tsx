"use client";

import { Check, Copy, Share2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useMemo, useState } from "react";
import { DualValue } from "@/components/money/dual-value";
import { QrScanner } from "@/components/scan/qr-scanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";
import { useFiat } from "@/hooks/use-fiat";
import { haptic } from "@/lib/haptic";
import { createPaymentLink } from "@/lib/ids";
import { FIAT_CODES, FIAT_META, toCusd, type FiatCode } from "@/lib/money";
import { type Payee } from "@/lib/payee";
import { shortAccount } from "@/lib/testnet/wallet";
import { cn } from "@/lib/utils";
import { useSessionStore } from "@/stores/session-store";
import { useWalletStore } from "@/stores/wallet-store";

type Props = {
  open: boolean;
  onClose: () => void;
  onScanned?: (payee: Payee, amount?: string) => void;
};

export function ReceiveDrawer({ open, onClose, onScanned }: Props) {
  const handle = useSessionStore((s) => s.handle);
  const chainAddress = useWalletStore((s) => s.chainAddress);
  const { fiat: preferred } = useFiat();
  const [tab, setTab] = useState<"generate" | "scan">("generate");
  const [asset, setAsset] = useState<FiatCode>(preferred);
  const [amount, setAmount] = useState("");
  const [copied, setCopied] = useState<"user" | "wallet" | "link" | null>(null);
  const amountCusd = amount ? toCusd(Number(amount), asset) : 0;

  const link = useMemo(() => {
    return createPaymentLink(handle, {
      asset: asset.toLowerCase(),
      amount,
      addr: chainAddress ?? "",
    });
  }, [amount, asset, handle, chainAddress]);

  async function copy(kind: "user" | "wallet" | "link", value: string) {
    await navigator.clipboard.writeText(value);
    haptic("success");
    setCopied(kind);
    window.setTimeout(() => setCopied(null), 1200);
  }

  async function share() {
    haptic("light");
    if (navigator.share) {
      await navigator.share({
        title: "Pay me on ZIP",
        text: handle ? `Send money to ${handle}` : "Pay me on ZIP",
        url: link,
      });
      return;
    }
    await copy("link", link);
  }

  return (
    <Sheet open={open} onClose={onClose} title="Receive" subtitle="Username, wallet, or scan">
      <div className="mb-4 grid grid-cols-2 gap-1 rounded-[16px] bg-canvas p-1">
        {(["generate", "scan"] as const).map((item) => (
          <button
            key={item}
            onClick={() => setTab(item)}
            className={cn(
              "rounded-[12px] py-2.5 text-sm font-bold capitalize",
              tab === item ? "bg-primary text-on-accent" : "text-muted",
            )}
          >
            {item === "generate" ? "My code" : "Scan"}
          </button>
        ))}
      </div>

      {tab === "generate" ? (
        <div className="flex flex-col items-center">
          <p className="text-sm font-bold text-foreground">{handle || "ZIP"}</p>
          {chainAddress ? (
            <p className="mt-1 font-mono text-xs text-muted">{shortAccount(chainAddress)}</p>
          ) : null}
          <div className="mt-3 rounded-[16px] bg-white p-4">
            <QRCodeSVG value={link} size={188} bgColor="#ffffff" fgColor="#0E0C0A" />
          </div>
          <div className="mt-4 grid w-full grid-cols-4 gap-1 rounded-[16px] bg-canvas p-1">
            {FIAT_CODES.map((item) => (
              <button
                key={item}
                onClick={() => {
                  haptic("light");
                  setAsset(item);
                  setAmount("");
                }}
                className={cn(
                  "rounded-[12px] py-2 text-[11px] font-bold",
                  asset === item ? "bg-primary text-on-accent" : "text-muted",
                )}
              >
                {FIAT_META[item].label}
              </button>
            ))}
          </div>
          <Input
            className="mt-3 text-center"
            inputMode="decimal"
            placeholder={`Amount in ${FIAT_META[asset].name} (optional)`}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          {amountCusd > 0 ? (
            <div className="mt-3">
              <DualValue amountCusd={amountCusd} size="sm" align="center" fiat={asset} />
            </div>
          ) : (
            <p className="mt-3 text-sm font-medium text-muted">Open amount · payer chooses</p>
          )}
          <div className="mt-4 grid w-full grid-cols-2 gap-3">
            <Button variant="secondary" onClick={() => void share()}>
              {copied === "link" ? <Check className="size-4" /> : <Share2 className="size-4" />}
              Share
            </Button>
            <Button variant="secondary" disabled={!handle} onClick={() => void copy("user", handle)}>
              {copied === "user" ? <Check className="size-4" /> : <Copy className="size-4" />}
              Username
            </Button>
          </div>
          <Button
            className="mt-3 w-full"
            variant="secondary"
            disabled={!chainAddress}
            onClick={() => chainAddress && void copy("wallet", chainAddress)}
          >
            {copied === "wallet" ? <Check className="size-4" /> : <Copy className="size-4" />}
            Copy wallet
          </Button>
        </div>
      ) : (
        <QrScanner
          onPayee={(payee, nextAmount) => {
            onClose();
            onScanned?.(payee, nextAmount);
          }}
        />
      )}
    </Sheet>
  );
}
