"use client";

import { Check, Copy, ScanLine, Share2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useMemo, useState } from "react";
import { DualValue } from "@/components/money/dual-value";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";
import { useFiat } from "@/hooks/use-fiat";
import { haptic } from "@/lib/haptic";
import { createPaymentLink } from "@/lib/ids";
import { FIAT_CODES, FIAT_META, toCusd, type FiatCode } from "@/lib/money";
import { cn } from "@/lib/utils";
import { useSessionStore } from "@/stores/session-store";

type Props = {
  open: boolean;
  onClose: () => void;
  onScanned?: (handle: string) => void;
};

export function ReceiveDrawer({ open, onClose, onScanned }: Props) {
  const handle = useSessionStore((s) => s.handle);
  const { fiat: preferred } = useFiat();
  const [tab, setTab] = useState<"generate" | "scan">("generate");
  const [asset, setAsset] = useState<FiatCode>(preferred);
  const [seenPreferred, setSeenPreferred] = useState(preferred);
  const [amount, setAmount] = useState("");
  const [copied, setCopied] = useState(false);
  const amountCusd = amount ? toCusd(Number(amount), asset) : 0;

  if (seenPreferred !== preferred) {
    setSeenPreferred(preferred);
    setAsset(preferred);
  }

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
    <Sheet
      open={open}
      onClose={onClose}
      title="Receive"
      subtitle="Show a code, or scan someone else's."
    >
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
          <p className="mb-3 text-sm font-bold text-foreground">${handle}</p>
          <div className="rounded-[16px] bg-white p-4">
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
        </div>
      ) : (
        <div className="flex flex-col items-center pb-2">
          <div className="relative mt-2 grid size-56 place-items-center rounded-[24px] border-2 border-primary/80">
            <ScanLine className="size-10 text-primary" />
          </div>
          <p className="mt-5 text-center text-sm font-medium text-muted">
            Align their ZIP code in the frame. We only show a $handle — never a long account string.
          </p>
          <Button
            className="mt-6 w-full"
            onClick={() => {
              haptic("success");
              onClose();
              onScanned?.("tunde");
            }}
          >
            Use demo code · $tunde
          </Button>
        </div>
      )}
    </Sheet>
  );
}
