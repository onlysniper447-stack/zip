"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { haptic } from "@/lib/haptic";
import { parsePayee, payeeAmount, type Payee } from "@/lib/payee";

type Detected = { rawValue: string };

type Detector = { detect: (source: ImageBitmapSource) => Promise<Detected[]> };

function getDetector(): Detector | null {
  const Ctor = (window as Window & { BarcodeDetector?: new (opts: { formats: string[] }) => Detector }).BarcodeDetector;
  if (!Ctor) return null;
  try {
    return new Ctor({ formats: ["qr_code"] });
  } catch {
    return null;
  }
}

export function QrScanner({
  onPayee,
  hint,
}: {
  onPayee: (payee: Payee, amount?: string) => void;
  hint?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const onPayeeRef = useRef(onPayee);
  onPayeeRef.current = onPayee;
  const [error, setError] = useState<string | null>(null);
  const [paste, setPaste] = useState("");

  useEffect(() => {
    let alive = true;
    let timer = 0;
    const node = videoRef.current;
    if (!node) return;
    const videoEl: HTMLVideoElement = node;

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (!alive) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        videoEl.srcObject = stream;
        await videoEl.play();
        const detector = getDetector();
        if (!detector) {
          setError("This browser can’t read a live code. Paste a username, wallet, or ZIP link below.");
          return;
        }
        const tick = async () => {
          if (!alive || videoEl.readyState < 2) {
            timer = window.setTimeout(() => void tick(), 240);
            return;
          }
          try {
            const codes = await detector.detect(videoEl);
            const raw = codes[0]?.rawValue;
            if (raw) {
              const payee = parsePayee(raw);
              if (payee) {
                haptic("success");
                onPayeeRef.current(payee, payeeAmount(raw) ?? undefined);
                return;
              }
            }
          } catch {
            /* keep scanning */
          }
          timer = window.setTimeout(() => void tick(), 240);
        };
        void tick();
      } catch {
        if (alive) setError("Camera blocked. Paste a username, wallet address, or ZIP link.");
      }
    }

    void start();
    return () => {
      alive = false;
      window.clearTimeout(timer);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, []);

  function submitPaste() {
    const payee = parsePayee(paste);
    if (!payee) {
      setError("Use a username, 0x wallet, or ZIP payment link.");
      return;
    }
    haptic("success");
    onPayee(payee, payeeAmount(paste) ?? undefined);
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative overflow-hidden rounded-[24px] border-2 border-primary/80 bg-black">
        <video ref={videoRef} className="size-56 object-cover" playsInline muted autoPlay />
      </div>
      <p className="mt-4 text-center text-sm font-medium text-muted">
        {hint ?? "Align their ZIP code in the frame, or paste a username / wallet."}
      </p>
      {error ? <p className="mt-2 text-center text-xs font-medium text-danger">{error}</p> : null}
      <Input
        className="mt-4"
        value={paste}
        onChange={(e) => setPaste(e.target.value)}
        placeholder="Username, 0x wallet, or ZIP link"
        onKeyDown={(e) => {
          if (e.key === "Enter") submitPaste();
        }}
      />
      <Button className="mt-3 w-full" variant="secondary" onClick={submitPaste}>
        Use this
      </Button>
    </div>
  );
}
