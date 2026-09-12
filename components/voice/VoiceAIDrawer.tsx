"use client";

import { Mic, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { DualValue } from "@/components/money/dual-value";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";
import { VoiceWaveform } from "@/components/voice/waveform";
import { useFiat } from "@/hooks/use-fiat";
import { executeIntent } from "@/lib/aa/smart-account";
import { haptic } from "@/lib/haptic";
import { MARKET } from "@/lib/mock/stocks";
import { accountLabel } from "@/lib/payments/rails";
import { intentUsd, parseUtterance, voiceExamples, type ParsedIntent } from "@/lib/voice/parse-intents";
import { useUiStore } from "@/stores/ui-store";
import { useWalletStore } from "@/stores/wallet-store";

type Phase = "idle" | "listening" | "parsing" | "confirm" | "executing" | "done";

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

function getRecognizer(lang: string): BrowserSpeech | null {
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
  rec.lang = lang;
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
  const { fiat, format, accounts } = useFiat();
  const examples = voiceExamples(fiat);
  const payout = accounts.find((item) => item.kind === "bank") ?? accounts[0];
  const payoutLabel = payout ? accountLabel(payout) : "linked account";

  const [phase, setPhase] = useState<Phase>("idle");
  const [transcript, setTranscript] = useState("");
  const [intents, setIntents] = useState<ParsedIntent[]>([]);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const recognition = useRef<BrowserSpeech | null>(null);
  const spokenRef = useRef("");

  useEffect(() => {
    if (!open) {
      recognition.current?.stop();
      setPhase("idle");
      setTranscript("");
      setIntents([]);
      setVoiceError(null);
    }
  }, [open]);

  async function parseText(text: string) {
    const cleaned = text.trim();
    if (!cleaned) return;
    setVoiceError(null);
    const local = parseUtterance(cleaned, fiat);
    setIntents(local);
    setPhase(local.length ? "confirm" : "idle");
    if (local.length) haptic("medium");
    else setVoiceError("Couldn’t read that. Try “Send ₦50k to $ahmad” or tap an example.");
    try {
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), 2500);
      const response = await fetch("/api/voice/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: cleaned, fiat }),
        signal: controller.signal,
      });
      window.clearTimeout(timer);
      const data = (await response.json()) as { intents?: ParsedIntent[] };
      if (data.intents?.length) {
        setIntents(data.intents);
        setPhase("confirm");
        setVoiceError(null);
      }
    } catch {
      /* local parse already shown */
    }
  }

  function listen() {
    haptic("medium");
    setVoiceError(null);
    const langs =
      fiat === "NGN" ? ["en-US", "en-NG", "en-GB"] : fiat === "GBP" ? ["en-GB", "en-US"] : ["en-US"];
    let rec: BrowserSpeech | null = null;
    for (const lang of langs) {
      rec = getRecognizer(lang);
      if (rec) break;
    }
    if (!rec) {
      setVoiceError("This browser can’t listen. Type the command or tap an example.");
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
      if (spokenRef.current.trim()) void parseText(spokenRef.current);
      else setPhase("idle");
    };
    rec.onerror = () => {
      if (spokenRef.current.trim()) void parseText(spokenRef.current);
      else {
        setPhase("idle");
        setVoiceError("Couldn’t hear that. Allow the mic, or type the command.");
      }
    };
    try {
      rec.start();
    } catch {
      setPhase("idle");
      setVoiceError("Couldn’t start the mic. Type the command instead.");
    }
  }

  async function executeAll() {
    const totalUsd = intents.reduce((sum, item) => sum + intentUsd(item), 0);
    if (!intents.length || totalUsd > activeCusd) return;
    setVoiceError(null);
    setPhase("executing");
    haptic("medium");
    let lastReceipt = "";
    let lastExplorer: string | undefined;
    try {
      for (const intent of intents) {
        const amountCusd = intentUsd(intent);
        if (intent.kind === "tip") {
          const result = await executeIntent({
            kind: "tip",
            amountCusd,
            sourceFiat: fiat,
            destFiat: fiat,
            counterparty: intent.handle,
          });
          applyTip({ to: intent.handle, amountCusd, memo: "VoiceAI", receiptId: result.receiptId });
          lastReceipt = result.receiptId;
          lastExplorer = result.explorerUrl;
        } else if (intent.kind === "save") {
          const result = await executeIntent({
            kind: "save",
            amountCusd,
            sourceFiat: fiat,
            destFiat: fiat,
            counterparty: "prime",
          });
          applySave("prime", amountCusd, result.receiptId);
          lastReceipt = result.receiptId;
          lastExplorer = result.explorerUrl;
        } else if (intent.kind === "cashout") {
          const result = await executeIntent({
            kind: "offramp",
            amountCusd,
            sourceFiat: fiat,
            destFiat: fiat,
            counterparty: payoutLabel,
          });
          applyOfframp({ amountCusd, destination: payoutLabel, receiptId: result.receiptId });
          lastReceipt = result.receiptId;
          lastExplorer = result.explorerUrl;
        } else {
          const asset = MARKET.find((item) => item.symbol === intent.symbol);
          const priceUsd = asset?.priceUsd ?? 99.48;
          const shares = amountCusd / priceUsd;
          const result = await executeIntent({
            kind: "stock",
            amountCusd,
            sourceFiat: fiat,
            destFiat: fiat,
            counterparty: intent.symbol,
          });
          applyStockTrade({
            symbol: intent.symbol,
            side: intent.side,
            shares,
            priceUsd,
            receiptId: result.receiptId,
          });
          lastReceipt = result.receiptId;
          lastExplorer = result.explorerUrl;
        }
      }
      setPhase("done");
      haptic("success");
      setOpen(false);
      openReceipt({
        title: intents.length > 1 ? "Voice batch complete" : intents[0]?.label ?? "Done",
        subtitle: `${intents.length} action${intents.length === 1 ? "" : "s"} · sponsored`,
        amountCusd: -totalUsd,
        memo: transcript,
        receiptId: lastReceipt,
        networkFeeLabel: "Included on ZIP Network",
        verifiedLabel: lastReceipt ? "Cross-chain verified" : undefined,
        explorerUrl: lastExplorer,
      });
    } catch (error) {
      setPhase("confirm");
      setVoiceError(error instanceof Error ? error.message : "Couldn’t send. Try Confirm & Send again.");
    }
  }

  const totalUsd = intents.reduce((sum, item) => sum + intentUsd(item), 0);
  const overBalance = intents.length > 0 && totalUsd > activeCusd;
  const confirming = phase === "confirm" || phase === "executing";
  const showOrb = phase === "idle" || phase === "listening";
  const canSend = intents.length > 0 && !overBalance && phase !== "executing" && phase !== "parsing";
  const parseFailed = Boolean(transcript.trim()) && !intents.length && phase === "idle";

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
          {showOrb ? <VoiceWaveform active={phase === "listening"} /> : null}

          {confirming && intents.length ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                <Sparkles className="size-4 text-yield" />
                Verify before sending
              </div>
              {intents.map((intent) => (
                <div key={intent.id} className="flex items-center justify-between rounded-[16px] bg-surface px-3 py-2">
                  <p className="text-sm font-medium text-foreground">{intent.label}</p>
                  <DualValue amountCusd={-intentUsd(intent)} size="sm" align="right" />
                </div>
              ))}
              <div className="rounded-[16px] border border-[rgba(217,119,6,0.3)] bg-[rgba(217,119,6,0.15)] px-3 py-2 text-sm font-medium text-[#F59E0B]">
                Network fee · sponsored
              </div>
            </div>
          ) : null}

          <p className={`${showOrb || confirming ? "mt-3" : ""} text-center text-sm font-medium text-muted`}>
            {phase === "listening"
              ? "Listening…"
              : phase === "parsing"
                ? "Reading that back…"
                : phase === "executing"
                  ? "Sending with sponsored network fee"
                  : confirming
                    ? "Check each action, then Confirm & Send"
                    : "Tap the orb and speak naturally"}
          </p>
          {transcript ? (
            <p className="mt-2 text-center text-sm font-bold text-foreground">“{transcript}”</p>
          ) : null}
        </Card>

        {showOrb ? (
          <button
            type="button"
            onClick={listen}
            className="relative mx-auto grid size-16 place-items-center rounded-full"
            aria-label="Start listening"
          >
            <span className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-yield opacity-70 blur-md" />
            <span className="relative grid size-16 place-items-center rounded-full bg-canvas [background:linear-gradient(#0E0C0A,#0E0C0A)_padding-box,linear-gradient(135deg,#D97706,#FBBF24)_border-box] border-2 border-transparent">
              <Mic className="size-6 text-foreground" />
            </span>
          </button>
        ) : confirming ? (
          <button type="button" onClick={listen} className="mx-auto block text-sm font-bold text-primary">
            Speak again
          </button>
        ) : null}

        <Input
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder={`Or type: ${examples[0]}`}
          aria-label="Voice command"
          onKeyDown={(e) => {
            if (e.key === "Enter") void parseText(transcript);
          }}
        />
        <Button variant="secondary" className="w-full" onClick={() => void parseText(transcript)}>
          Read command
        </Button>

        {voiceError ? (
          <p className="text-center text-sm font-medium text-danger">{voiceError}</p>
        ) : parseFailed ? (
          <p className="text-center text-sm font-medium text-danger">
            Couldn’t find who to pay. Try “Send ₦50k to $ahmad”.
          </p>
        ) : null}
        {overBalance ? (
          <p className="text-center text-sm font-medium text-danger">
            Not enough spendable balance. You have {format(activeCusd)}; this needs {format(totalUsd)}.
          </p>
        ) : null}

        <Button className="w-full" size="lg" disabled={!canSend} onClick={() => void executeAll()}>
          {phase === "executing" ? "Sending…" : "Confirm & Send"}
        </Button>

        {!confirming ? (
          <div className="space-y-2">
            {examples.map((example) => (
              <button
                key={example}
                type="button"
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
        ) : null}
      </div>
    </Sheet>
  );
}
