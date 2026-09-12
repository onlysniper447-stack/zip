"use client";

import { Check, Copy, Share2 } from "lucide-react";
import { useState } from "react";
import { DualValue } from "@/components/money/dual-value";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { haptic } from "@/lib/haptic";
import { useUiStore } from "@/stores/ui-store";

export function ReceiptDrawer() {
  const receipt = useUiStore((s) => s.receipt);
  const close = useUiStore((s) => s.closeReceipt);
  const [copied, setCopied] = useState(false);

  return (
    <Sheet
      open={Boolean(receipt)}
      onClose={close}
      title="Receipt"
      subtitle="This payment is complete."
    >
      {receipt ? (
        <div className="space-y-4">
          <div className="rounded-3xl border border-[rgba(217,119,6,0.3)] bg-[rgba(217,119,6,0.15)] p-5 text-center">
            <div className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-primary text-on-accent">
              <Check className="size-6" />
            </div>
            <p className="text-sm text-yield">{receipt.title}</p>
            <div className="mt-3">
              <DualValue amountCusd={receipt.amountCusd} size="lg" align="center" signed />
            </div>
            {receipt.subtitle ? <p className="mt-2 text-sm text-muted">{receipt.subtitle}</p> : null}
          </div>

          <dl className="space-y-3 rounded-3xl bg-white/4 p-4 text-sm">
            {receipt.counterparty ? (
              <Row label="To" value={receipt.counterparty} />
            ) : null}
            {receipt.memo ? <Row label="Memo" value={receipt.memo} /> : null}
            {receipt.railLabel ? <Row label="Arrives via" value={receipt.railLabel} /> : null}
            {receipt.verifiedLabel ? <Row label="Verified" value={receipt.verifiedLabel} /> : null}
            <Row label="Network fee" value={receipt.networkFeeLabel ?? "Included on ZIP Network"} />
            {receipt.explorerUrl ? (
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">ZIP Network</dt>
                <dd>
                  <a
                    href={receipt.explorerUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-primary"
                  >
                    View receipt
                  </a>
                </dd>
              </div>
            ) : null}
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted">Receipt ID</dt>
              <dd className="flex items-center gap-2 font-medium">
                <span className="font-mono text-[13px]">{receipt.receiptId}</span>
                <button
                  className="grid size-8 place-items-center rounded-full bg-white/6"
                  onClick={async () => {
                    await navigator.clipboard.writeText(receipt.receiptId);
                    setCopied(true);
                    haptic("light");
                    window.setTimeout(() => setCopied(false), 1200);
                  }}
                  aria-label="Copy receipt ID"
                >
                  {copied ? <Check className="size-3.5 text-yield" /> : <Copy className="size-3.5" />}
                </button>
              </dd>
            </div>
          </dl>

          <Button variant="secondary" className="w-full" onClick={close}>
            Done
          </Button>
          <button
            className="flex w-full items-center justify-center gap-2 text-xs text-muted"
            onClick={async () => {
              const lines = [
                receipt.title,
                receipt.subtitle,
                receipt.counterparty ? `To ${receipt.counterparty}` : "",
                `Receipt ${receipt.receiptId}`,
              ].filter(Boolean);
              await navigator.clipboard.writeText(lines.join("\n"));
              setCopied(true);
              haptic("success");
              window.setTimeout(() => setCopied(false), 1200);
            }}
          >
            <Share2 className="size-3.5" />
            {copied ? "Copied receipt" : "Copy receipt"}
          </button>
        </div>
      ) : null}
    </Sheet>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
