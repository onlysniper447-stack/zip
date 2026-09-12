"use client";

import { Check, Copy, Share2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/flow/page-header";
import { DualValue } from "@/components/money/dual-value";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useFiat } from "@/hooks/use-fiat";
import { haptic } from "@/lib/haptic";
import { createPaymentLink } from "@/lib/ids";
import { FIAT_CODES, FIAT_META, formatFiat, toCusd, type FiatCode } from "@/lib/money";
import { cn } from "@/lib/utils";
import { useSessionStore } from "@/stores/session-store";
import { useWalletStore } from "@/stores/wallet-store";

export function ReceiveFlow() {
  const handle = useSessionStore((s) => s.handle);
  const chainAddress = useWalletStore((s) => s.chainAddress);
  const { fiat: preferred } = useFiat();
  const [asset, setAsset] = useState<FiatCode>(preferred);
  const [seenPreferred, setSeenPreferred] = useState(preferred);
  const [amount, setAmount] = useState("");
  const [copied, setCopied] = useState(false);

  if (seenPreferred !== preferred) {
    setSeenPreferred(preferred);
    setAsset(preferred);
  }

  const amountCusd = amount ? toCusd(Number(amount), asset) : 0;
  const link = useMemo(() => {
    const params: Record<string, string> = { asset: asset.toLowerCase() };
    if (amount) params.amount = amount;
    return createPaymentLink(handle, params);
  }, [amount, asset, handle]);

  async function share() {
    haptic("light");
    if (navigator.share) {
      await navigator.share({ title: "Pay me on ZIP", text: `Send money to $${handle}`, url: link });
      return;
    }
    await navigator.clipboard.writeText(link);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div>
      <PageHeader title="Receive" subtitle="Share a code, link, or $handle" />
      <div className="px-5 pb-8">
        <Card className="flex flex-col items-center p-6">
          <p className="mb-4 text-sm font-semibold">${handle}</p>
          <p className="mb-3 text-xs font-medium text-yield">Creditcoin Testnet</p>
          <div className="rounded-3xl bg-white p-4">
            <QRCodeSVG value={link} size={196} bgColor="#ffffff" fgColor="#0E0C0A" />
          </div>
          <div className="mt-5 grid w-full grid-cols-4 gap-1 rounded-2xl bg-black/25 p-1">
            {FIAT_CODES.map((item) => (
              <button
                key={item}
                onClick={() => {
                  haptic("light");
                  setAsset(item);
                  setAmount("");
                }}
                className={cn(
                  "rounded-xl py-2 text-[11px] font-bold",
                  asset === item ? "bg-primary text-on-accent" : "text-muted",
                )}
              >
                {FIAT_META[item].label}
              </button>
            ))}
          </div>
          <Input
            className="mt-4 text-center"
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
            <p className="mt-3 text-xs text-muted">Open amount · payer chooses</p>
          )}
        </Card>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={share}>
            {copied ? <Check className="size-4" /> : <Share2 className="size-4" />}
            Share link
          </Button>
          <Button
            variant="secondary"
            onClick={async () => {
              await navigator.clipboard.writeText(`$${handle}`);
              haptic("success");
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1200);
            }}
          >
            <Copy className="size-4" />
            Copy $handle
          </Button>
        </div>
        {chainAddress ? (
          <p className="mt-3 text-center text-xs text-muted">Payments settle to your ZIP Network account on Creditcoin Testnet.</p>
        ) : null}

        {amount ? (
          <p className="mt-4 text-center text-xs text-muted">
            Requesting {formatFiat(Number(amount), asset)} · lands in your {FIAT_META[preferred].label} account
          </p>
        ) : null}
      </div>
    </div>
  );
}
