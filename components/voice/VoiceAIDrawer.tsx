"use client";

import { Mic, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { SlideToConfirm } from "@/components/confirm/slide-to-confirm";
import { DualValue } from "@/components/money/dual-value";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";
import { VoiceWaveform } from "@/components/voice/waveform";
import { executeIntent } from "@/lib/aa/smart-account";
import { haptic } from "@/lib/haptic";
import { MARKET } from "@/lib/mock/stocks";
import { formatNgn, ngnToCusd } from "@/lib/money";
import { parseUtterance, type ParsedIntent } from "@/lib/voice/parse-intents";
import { useUiStore } from "@/stores/ui-store";
import { useWalletStore } from "@/stores/wallet-store";

type Phase = "idle" | "listening" | "parsing" | "confirm" | "executing" | "done";

const EXAMPLES = [
  "Send ₦10k to @amaka and put ₦2k in T-Bills",
  "Tip $tunde ₦5,000",
  "Buy ₦20k of VOO",
];

type BrowserSpeech = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function getRecognizer(): BrowserSpeech | null {
  const Speech = (
    window as Window & {
      SpeechRecognition?: new () => BrowserSpeech;
      webkitSpeechRecognition?: new () => BrowserSpeech;
    }
  ).SpeechRecognition ?? (
    window as Window & { webkitSpeechRecognition?: new () => BrowserSpeech }
  ).webkitSpeechRecognition;
  if (!Speech) return null;
  const rec = new Speech();
  rec.lang = "en-NG";
  rec.interimResults = true;
  rec.continuous = false;
  return rec;
}

export function VoiceAIDrawer() {
  const open = useUiStore((s) => s.voiceOpen);
  const setOpen = useUiStore((s) => s.setVoiceOpen);
  const openReceipt = useUiStore((s) => s.openReceipt);
  const applyTip = useWalletStore((s) => s.applyTip);
  const applySave = useWalletStore((s) => s.applySave);
  const applyOfframp = useWalletStore((s) => s.applyOfframp);
  const applyStockTrade = useWalletStore((s) => s.applyStockTrade);
  const activeCusd = useWalletStore((s) => s.activeCusd);

  const [phase, setPhase] = useState<Phase>("idle");
  const [transcript, setTranscript] = useState("");
  const [intents, setIntents] = useState<ParsedIntent[]>([]);
  const recognition = useRef<BrowserSpeech | null>(null);
  const spokenRef = useRef("");

  useEffect(() => {
    if (!open) recognition.current?.stop();
  }, [open]);

  if (!open && phase !== "idle") {
    setPhase("idle");
    setTranscript("");
    setIntents([]);
  }

  async function parseText(text: string) {
    const cleaned = text.trim();
    if (!cleaned) return;
    setPhase("parsing");
    try {
      const response = await fetch("/api/voice/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: cleaned }),
      });
      const data = (await response.json()) as { intents?: ParsedIntent[] };
      const next = data.intents?.length ? data.intents : parseUtterance(cleaned);
      setIntents(next);
      setPhase(next.length ? "confirm" : "idle");
      if (next.length) haptic("medium");
    } catch {
      const next = parseUtterance(cleaned);
      setIntents(next);
      setPhase(next.length ? "confirm" : "idle");
    }
  }

  function listen() {
    haptic("medium");
    const rec = getRecognizer();
    if (!rec) {
      setPhase("idle");
      return;
    }
    recognition.current = rec;
    setPhase("listening");
    rec.onresult = (event) => {
      const last = event.results[event.results.length - 1];
      const spoken = last?.[0]?.transcript ?? "";
      spokenRef.current = spoken;
      setTranscript(spoken);
    };
    rec.onend = () => {
      void parseText(spokenRef.current);
    };
    rec.onerror = () => setPhase("idle");
    rec.start();
  }

  async function executeAll() {
    const totalNgn = intents.reduce((sum, item) => sum + item.amountNgn, 0);
    if (ngnToCusd(totalNgn) > activeCusd) return;
    setPhase("executing");
    let lastReceipt = "";
    try {
      for (const intent of intents) {
        const amountCusd = ngnToCusd(intent.amountNgn);
        if (intent.kind === "tip") {
          const result = await executeIntent({ kind: "tip", amountCusd, counterparty: intent.handle });
          applyTip({ to: intent.handle, amountCusd, memo: "VoiceAI", receiptId: result.receiptId });
          lastReceipt = result.receiptId;
        } else if (intent.kind === "save") {
          const result = await executeIntent({ kind: "save", amountCusd, counterparty: "prime" });
          applySave("prime", amountCusd, result.receiptId);
          lastReceipt = result.receiptId;
        } else if (intent.kind === "cashout") {
          const result = await executeIntent({ kind: "offramp", amountCusd, counterparty: "GTBank ··4419" });
          applyOfframp({ amountCusd, destination: "GTBank ··4419", receiptId: result.receiptId });
          lastReceipt = result.receiptId;
        } else {
          const asset = MARKET.find((item) => item.symbol === intent.symbol);
          const priceUsd = asset?.priceUsd ?? 99.48;
          const shares = amountCusd / priceUsd;
          const result = await executeIntent({ kind: "stock", amountCusd, counterparty: intent.symbol });
          applyStockTrade({
            symbol: intent.symbol,
            side: intent.side,
            shares,
            priceUsd,
            receiptId: result.receiptId,
          });
          lastReceipt = result.receiptId;
        }
      }
      setPhase("done");
      haptic("success");
      setOpen(false);
      openReceipt({
        title: intents.length > 1 ? "Voice batch complete" : intents[0]?.label ?? "Done",
        subtitle: `${intents.length} action${intents.length === 1 ? "" : "s"} · sponsored`,
        amountCusd: -ngnToCusd(totalNgn),
        memo: transcript,
        receiptId: lastReceipt,
        networkFeeLabel: "Sponsored · no extra fee",
      });
    } catch {
      setPhase("confirm");
    }
  }

  const totalNgn = intents.reduce((sum, item) => sum + item.amountNgn, 0);
  const overBalance = ngnToCusd(totalNgn) > activeCusd;

  return (
    <Sheet
      open={open}
      onClose={() => setOpen(false)}
      title="ZIP VoiceAI"
      subtitle="Speak to pay — no codes, no network jargon."
      className="bg-surface/92 backdrop-blur-xl"
    >
      <div className="space-y-4">
        <Card className="border-line bg-canvas p-4">
          <VoiceWaveform active={phase === "listening" || phase === "executing"} />
          <p className="mt-3 text-center text-sm font-medium text-muted">
            {phase === "listening"
              ? "Listening…"
              : phase === "parsing"
                ? "Reading that back…"
                : phase === "executing"
                  ? "Sending with sponsored network fee"
                  : "Tap the orb and speak naturally"}
          </p>
          {transcript ? (
            <p className="mt-2 text-center text-sm font-bold text-foreground">“{transcript}”</p>
          ) : null}
        </Card>

        <button
          onClick={listen}
          className="relative mx-auto grid size-16 place-items-center rounded-full"
          aria-label="Start listening"
        >
          <span className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-yield opacity-70 blur-md" />
          <span className="relative grid size-16 place-items-center rounded-full bg-canvas [background:linear-gradient(#0E0C0A,#0E0C0A)_padding-box,linear-gradient(135deg,#D97706,#FBBF24)_border-box] border-2 border-transparent">
            <Mic className="size-6 text-foreground" />
          </span>
        </button>

        <Input
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Or type: Send ₦10k to @amaka and put ₦2k in T-Bills"
          onKeyDown={(e) => {
            if (e.key === "Enter") void parseText(transcript);
          }}
        />
        <Button variant="secondary" className="w-full" onClick={() => void parseText(transcript)}>
          Read command
        </Button>

        {phase === "confirm" || phase === "executing" ? (
          <Card className="space-y-3 p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-foreground">
              <Sparkles className="size-4 text-yield" />
              Confirm {intents.length} action{intents.length === 1 ? "" : "s"}
            </div>
            {intents.map((intent) => (
              <div key={intent.id} className="flex items-center justify-between rounded-[16px] bg-canvas px-3 py-2">
                <p className="text-sm font-medium text-foreground">{intent.label}</p>
                <DualValue amountCusd={-ngnToCusd(intent.amountNgn)} size="sm" align="right" />
              </div>
            ))}
            <div className="rounded-[16px] border border-[rgba(217,119,6,0.3)] bg-[rgba(217,119,6,0.15)] px-3 py-2 text-sm font-medium text-[#F59E0B]">
              Network fee · sponsored
            </div>
            {overBalance ? (
              <p className="text-sm font-medium text-danger">Not enough spendable balance for this batch.</p>
            ) : totalNgn >= 50_000 ? (
              <SlideToConfirm
                label={`Slide to run ${formatNgn(totalNgn)}`}
                loading={phase === "executing"}
                onConfirm={executeAll}
              />
            ) : (
              <Button className="w-full" size="lg" disabled={phase === "executing"} onClick={() => void executeAll()}>
                Confirm & send
              </Button>
            )}
          </Card>
        ) : (
          <div className="space-y-2">
            {EXAMPLES.map((example) => (
              <button
                key={example}
                onClick={() => {
                  setTranscript(example);
                  void parseText(example);
                }}
                className="w-full rounded-[16px] border border-line bg-canvas px-3 py-2 text-left text-sm font-medium text-muted hover:border-primary"
              >
                “{example}”
              </button>
            ))}
          </div>
        )}
      </div>
    </Sheet>
  );
}
