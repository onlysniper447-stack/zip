"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { SlideToConfirm } from "@/components/confirm/slide-to-confirm";
import { PageHeader } from "@/components/flow/page-header";
import { DualValue } from "@/components/money/dual-value";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";
import { useFiat } from "@/hooks/use-fiat";
import { executeIntent } from "@/lib/aa/smart-account";
import { haptic } from "@/lib/haptic";
import { CONTACTS, STICKERS } from "@/lib/mock/catalog";
import { formatFiat } from "@/lib/money";
import { initials } from "@/lib/utils";
import { useUiStore } from "@/stores/ui-store";
import { useWalletStore } from "@/stores/wallet-store";

export function TipFlow() {
  const params = useSearchParams();
  const router = useRouter();
  const preset = params.get("to")?.replace(/^\$/, "").toLowerCase() ?? null;
  const amountParam = params.get("amount");
  const { fiat, symbol, toUsd, defaultAmount, chips, railCopy } = useFiat();
  const [query, setQuery] = useState(preset ? `$${preset}` : "");
  const [selected, setSelected] = useState(() => CONTACTS.find((c) => c.handle === preset) ?? null);
  const [amount, setAmount] = useState(() => {
    const parsed = amountParam ? Number(amountParam) : NaN;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : defaultAmount(10);
  });
  const [amountFiat, setAmountFiat] = useState(fiat);
  const [memo, setMemo] = useState("");
  const [sticker, setSticker] = useState<string | undefined>();
  const [open, setOpen] = useState(Boolean(preset));
  const [sending, setSending] = useState(false);
  const activeCusd = useWalletStore((s) => s.activeCusd);
  const applyTip = useWalletStore((s) => s.applyTip);
  const openReceipt = useUiStore((s) => s.openReceipt);

  if (amountFiat !== fiat) {
    setAmountFiat(fiat);
    const parsed = amountParam ? Number(amountParam) : NaN;
    setAmount(Number.isFinite(parsed) && parsed > 0 ? parsed : defaultAmount(10));
  }

  const matches = useMemo(() => {
    const q = query.replace(/^\$/, "").toLowerCase();
    if (!q) return CONTACTS;
    return CONTACTS.filter(
      (c) =>
        c.handle.includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.phone.replace(/\s/g, "").includes(q.replace(/\s/g, "")),
    );
  }, [query]);

  const amountCusd = toUsd(amount);
  const needsSlide = amountCusd >= 33;
  const canSend = selected && amountCusd > 0 && amountCusd <= activeCusd && !sending;

  async function send() {
    if (!selected || !canSend) return;
    setSending(true);
    haptic("medium");
    try {
      const result = await executeIntent({
        kind: "tip",
        amountCusd,
        sourceFiat: fiat,
        destFiat: fiat,
        counterparty: selected.handle,
        memo,
        sticker,
      });
      applyTip({ to: selected.handle, amountCusd, memo: [sticker, memo].filter(Boolean).join(" "), receiptId: result.receiptId });
      setOpen(false);
      openReceipt({
        title: `Sent to $${selected.handle}`,
        subtitle: memo || "Instant payment",
        amountCusd: -amountCusd,
        counterparty: `$${selected.handle}`,
        memo: memo || undefined,
        receiptId: result.receiptId,
        railLabel: result.railName,
      });
      router.push("/");
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      <PageHeader title="Tip" subtitle="Search a $handle, contact, or scan" />
      <div className="px-5 pb-8">
        <div className="relative">
          <Search className="absolute left-3 top-3.5 size-4 text-muted" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="$handle, name, or phone"
            className="pl-10"
          />
        </div>
        <p className="mt-2 text-xs text-muted">They receive {symbol} in their local account. No extra fees.</p>

        <div className="mt-4 space-y-2">
          {matches.map((contact) => (
            <button
              key={contact.handle}
              onClick={() => {
                haptic("light");
                setSelected(contact);
                setOpen(true);
              }}
              className="flex w-full items-center gap-3 rounded-2xl border border-line bg-surface p-3 text-left hover:border-primary"
            >
              <span className="grid size-11 place-items-center rounded-2xl bg-[rgba(217,119,6,0.15)] text-sm font-semibold text-foreground">
                {initials(contact.name)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{contact.name}</span>
                <span className="block truncate text-xs text-muted">
                  ${contact.handle} · {contact.phone}
                </span>
              </span>
              {contact.lastPaid ? <span className="text-[11px] text-muted">{contact.lastPaid}</span> : null}
            </button>
          ))}
        </div>
      </div>

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title={selected ? `Tip ${selected.name}` : "Tip"}
        subtitle={selected ? `$${selected.handle}` : undefined}
      >
        <div className="space-y-4">
          <Card className="text-center">
            <p className="text-xs uppercase tracking-[0.14em] text-muted">Amount</p>
            <input
              type="number"
              min={fiat === "NGN" ? 100 : 1}
              step={fiat === "NGN" ? 100 : 0.01}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="mt-2 w-full bg-transparent text-center text-4xl font-semibold outline-none"
            />
            <p className="mt-1 text-sm text-muted">{symbol}</p>
            <div className="mt-3">
              <DualValue amountCusd={amountCusd} size="sm" align="center" />
            </div>
            <div className="mt-3 flex justify-center gap-2">
              {chips.map((chip) => (
                <button
                  key={chip}
                  onClick={() => setAmount(chip)}
                  className="rounded-full bg-white/6 px-3 py-1 text-xs font-medium"
                >
                  {formatFiat(chip, fiat)}
                </button>
              ))}
            </div>
          </Card>

          <div>
            <p className="mb-2 text-xs font-medium text-muted">Sticker</p>
            <div className="flex gap-2">
              {STICKERS.map((item) => (
                <button
                  key={item}
                  onClick={() => setSticker(item)}
                  className={`grid size-10 place-items-center rounded-2xl text-lg ${sticker === item ? "bg-primary/20" : "bg-white/5"}`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <Input value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="Add a memo (optional)" />

          <div className="rounded-2xl border border-[rgba(217,119,6,0.3)] bg-[rgba(217,119,6,0.15)] px-3 py-2 text-xs text-[#F59E0B]">
            Clears via {railCopy}
          </div>

          {needsSlide ? (
            <SlideToConfirm
              label={`Slide to send ${formatFiat(amount, fiat)}`}
              disabled={!canSend}
              loading={sending}
              onConfirm={send}
            />
          ) : (
            <Button className="w-full" size="lg" disabled={!canSend} onClick={send}>
              Send {formatFiat(amount, fiat)}
            </Button>
          )}
        </div>
      </Sheet>
    </div>
  );
}
