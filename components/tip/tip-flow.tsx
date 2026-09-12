"use client";

import { Search, Wallet } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { SlideToConfirm } from "@/components/confirm/slide-to-confirm";
import { PageHeader } from "@/components/flow/page-header";
import { DualValue } from "@/components/money/dual-value";
import { QrScanner } from "@/components/scan/qr-scanner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";
import { useFiat } from "@/hooks/use-fiat";
import { executeIntent } from "@/lib/aa/smart-account";
import { haptic } from "@/lib/haptic";
import { CONTACTS, STICKERS } from "@/lib/mock/catalog";
import { formatFiat } from "@/lib/money";
import { parsePayee, type Payee } from "@/lib/payee";
import { initials } from "@/lib/utils";
import { useUiStore } from "@/stores/ui-store";
import { useWalletStore } from "@/stores/wallet-store";

type Method = "username" | "address" | "scan";

export function TipFlow() {
  const params = useSearchParams();
  const router = useRouter();
  const presetTo = params.get("to")?.replace(/^[@$]/, "").toLowerCase() ?? null;
  const presetAddr = params.get("addr");
  const amountParam = params.get("amount");
  const { fiat, symbol, toUsd, defaultAmount, chips, railCopy } = useFiat();
  const [method, setMethod] = useState<Method>(presetAddr ? "address" : "username");
  const [query, setQuery] = useState(presetTo ? presetTo : "");
  const [address, setAddress] = useState(presetAddr ?? "");
  const [selected, setSelected] = useState<Payee | null>(() => parsePayee(presetAddr || presetTo || ""));
  const [amount, setAmount] = useState(() => {
    const parsed = amountParam ? Number(amountParam) : NaN;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : defaultAmount(10);
  });
  const [memo, setMemo] = useState("");
  const [sticker, setSticker] = useState<string | undefined>();
  const [open, setOpen] = useState(Boolean(presetTo || presetAddr));
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const activeCusd = useWalletStore((s) => s.activeCusd);
  const applyTip = useWalletStore((s) => s.applyTip);
  const openReceipt = useUiStore((s) => s.openReceipt);

  const matches = useMemo(() => {
    const q = query.replace(/^[@$]/, "").toLowerCase();
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
  const canSend = Boolean(selected) && amountCusd > 0 && amountCusd <= activeCusd && !sending;

  function choose(payee: Payee, nextAmount?: string) {
    setSelected(payee);
    setOpen(true);
    if (nextAmount) {
      const parsed = Number(nextAmount);
      if (Number.isFinite(parsed) && parsed > 0) setAmount(parsed);
    }
    haptic("light");
  }

  async function send() {
    if (!selected || !canSend) return;
    setSending(true);
    setSendError(null);
    haptic("medium");
    try {
      const result = await executeIntent({
        kind: "tip",
        amountCusd,
        sourceFiat: fiat,
        destFiat: fiat,
        counterparty: selected.counterparty,
        memo,
        sticker,
      });
      applyTip({
        to: selected.label,
        amountCusd,
        memo: [sticker, memo].filter(Boolean).join(" "),
        receiptId: result.receiptId,
      });
      setOpen(false);
      openReceipt({
        title: `Sent to ${selected.label}`,
        subtitle: memo || (selected.kind === "address" ? "ZIP Wallet" : "Instant payment"),
        amountCusd: -amountCusd,
        counterparty: selected.label,
        memo: memo || undefined,
        receiptId: result.receiptId,
        railLabel: result.railName,
        verifiedLabel: result.verifiedLabel,
        explorerUrl: result.explorerUrl,
      });
      router.push("/");
    } catch (error) {
      setSendError(error instanceof Error ? error.message : "Couldn’t send. Try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      <PageHeader title="Tip" subtitle="Username, wallet address, or scan" />
      <div className="px-5 pb-8">
        <div className="mb-4 grid grid-cols-3 gap-1 rounded-[16px] bg-canvas p-1">
          {(
            [
              { id: "username", label: "Username" },
              { id: "address", label: "Wallet" },
              { id: "scan", label: "Scan" },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              onClick={() => setMethod(item.id)}
              className={`rounded-[12px] py-2.5 text-sm font-bold ${
                method === item.id ? "bg-primary text-on-accent" : "text-muted"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {method === "username" ? (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-3.5 size-4 text-muted" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Username or name"
                className="pl-10"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const payee = parsePayee(query);
                    if (payee) choose(payee);
                  }
                }}
              />
            </div>
            <p className="mt-2 text-xs text-muted">They receive {symbol}. No extra fees.</p>
            {parsePayee(query) && !matches.some((c) => c.handle === parsePayee(query)?.counterparty) ? (
              <Button className="mt-3 w-full" variant="secondary" onClick={() => choose(parsePayee(query)!)}>
                Continue with {parsePayee(query)!.label}
              </Button>
            ) : null}
            <div className="mt-4 space-y-2">
              {matches.map((contact) => (
                <button
                  key={contact.handle}
                  onClick={() => choose(parsePayee(contact.handle)!)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-line bg-surface p-3 text-left hover:border-primary"
                >
                  <span className="grid size-11 place-items-center rounded-2xl bg-[rgba(217,119,6,0.15)] text-sm font-semibold text-foreground">
                    {initials(contact.name)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{contact.name}</span>
                    <span className="block truncate text-xs text-muted">{contact.handle}</span>
                  </span>
                </button>
              ))}
            </div>
          </>
        ) : null}

        {method === "address" ? (
          <div className="space-y-3">
            <div className="relative">
              <Wallet className="absolute left-3 top-3.5 size-4 text-muted" />
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="0x…"
                className="pl-10 font-mono text-sm"
              />
            </div>
            <p className="text-xs text-muted">Paste a Creditcoin / ZIP Wallet address.</p>
            <Button
              className="w-full"
              disabled={!parsePayee(address)}
              onClick={() => {
                const payee = parsePayee(address);
                if (payee) choose(payee);
              }}
            >
              Continue
            </Button>
          </div>
        ) : null}

        {method === "scan" ? (
          <QrScanner
            onPayee={(payee, nextAmount) => choose(payee, nextAmount)}
            hint="Scan a ZIP code, or paste a username / wallet."
          />
        ) : null}
      </div>

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title={selected ? `Tip ${selected.name}` : "Tip"}
        subtitle={selected?.label}
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
          {sendError ? <p className="text-sm font-medium text-danger">{sendError}</p> : null}
          {needsSlide ? (
            <SlideToConfirm
              label={`Slide to send ${formatFiat(amount, fiat)}`}
              disabled={!canSend}
              loading={sending}
              onConfirm={send}
            />
          ) : (
            <Button className="w-full" size="lg" disabled={!canSend} onClick={() => void send()}>
              Send {formatFiat(amount, fiat)}
            </Button>
          )}
        </div>
      </Sheet>
    </div>
  );
}
