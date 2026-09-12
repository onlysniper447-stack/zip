"use client";

import { Check, Copy, Share2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/flow/page-header";
import { DualValue } from "@/components/money/dual-value";
import { QrScanner } from "@/components/scan/qr-scanner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useFiat } from "@/hooks/use-fiat";
import { haptic } from "@/lib/haptic";
import { createPaymentLink } from "@/lib/ids";
import { FIAT_CODES, FIAT_META, formatFiat, toCusd, type FiatCode } from "@/lib/money";
import { shortAccount } from "@/lib/testnet/wallet";
import { cn } from "@/lib/utils";
import { useSessionStore } from "@/stores/session-store";
import { useWalletStore } from "@/stores/wallet-store";

export function ReceiveFlow() {
  const router = useRouter();
  const handle = useSessionStore((s) => s.handle);
  const chainAddress = useWalletStore((s) => s.chainAddress);
  const { fiat: preferred } = useFiat();
  const [tab, setTab] = useState<"code" | "scan">("code");
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
    <div>
      <PageHeader title="Receive" subtitle="Username, wallet, or scan" />
      <div className="px-5 pb-8">
        <div className="mb-4 grid grid-cols-2 gap-1 rounded-[16px] bg-canvas p-1">
          <button
            onClick={() => setTab("code")}
            className={cn("rounded-[12px] py-2.5 text-sm font-bold", tab === "code" ? "bg-primary text-on-accent" : "text-muted")}
          >
            My code
          </button>
          <button
            onClick={() => setTab("scan")}
            className={cn("rounded-[12px] py-2.5 text-sm font-bold", tab === "scan" ? "bg-primary text-on-accent" : "text-muted")}
          >
            Scan to pay
          </button>
        </div>

        {tab === "scan" ? (
          <QrScanner
            onPayee={(payee, nextAmount) => {
              const search = new URLSearchParams();
              if (payee.kind === "address") search.set("addr", payee.counterparty);
              else search.set("to", payee.counterparty);
              if (nextAmount) search.set("amount", nextAmount);
              router.push(`/tip?${search.toString()}`);
            }}
          />
        ) : (
          <>
            <Card className="flex flex-col items-center p-6">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">Username</p>
              <p className="mt-1 text-base font-bold">{handle || "—"}</p>
              {chainAddress ? (
                <>
                  <p className="mt-3 text-xs font-bold uppercase tracking-[0.14em] text-muted">Wallet</p>
                  <p className="mt-1 font-mono text-xs font-medium text-foreground">{shortAccount(chainAddress)}</p>
                </>
              ) : null}
              <div className="mt-4 rounded-3xl bg-white p-4">
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
              <Button variant="secondary" onClick={() => void share()}>
                {copied === "link" ? <Check className="size-4" /> : <Share2 className="size-4" />}
                Share link
              </Button>
              <Button variant="secondary" disabled={!handle} onClick={() => void copy("user", handle)}>
                {copied === "user" ? <Check className="size-4" /> : <Copy className="size-4" />}
                Copy username
              </Button>
            </div>
            <Button
              className="mt-3 w-full"
              variant="secondary"
              disabled={!chainAddress}
              onClick={() => chainAddress && void copy("wallet", chainAddress)}
            >
              {copied === "wallet" ? <Check className="size-4" /> : <Copy className="size-4" />}
              Copy wallet address
            </Button>
            {amount ? (
              <p className="mt-4 text-center text-xs text-muted">
                Requesting {formatFiat(Number(amount), asset)} · lands in your {FIAT_META[preferred].label} account
              </p>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
