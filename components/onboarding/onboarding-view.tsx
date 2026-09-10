"use client";

import { Fingerprint } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ZipMark } from "@/components/brand/zip-mark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createPasskey } from "@/lib/aa/smart-account";
import { haptic } from "@/lib/haptic";
import { useSessionStore } from "@/stores/session-store";

export function OnboardingView() {
  const router = useRouter();
  const complete = useSessionStore((s) => s.completeOnboarding);
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [name, setName] = useState("Adaeze Okonkwo");
  const [handle, setHandle] = useState("ada");
  const [phone, setPhone] = useState("+234 803 441 2291");
  const [busy, setBusy] = useState(false);

  async function bindPasskey() {
    setBusy(true);
    haptic("medium");
    await createPasskey(name);
    setBusy(false);
    setStep(1);
  }

  function finish() {
    const cleanHandle = handle.replace(/^\$/, "").trim().toLowerCase();
    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    if (!cleanHandle || !cleanName || !cleanPhone) return;
    complete({ handle: cleanHandle, displayName: cleanName, phone: cleanPhone });
    haptic("success");
    router.replace("/");
  }

  return (
    <div className="flex min-h-dvh flex-col px-6 pb-10 pt-16">
      <ZipMark />
      {step === 0 ? (
        <div className="mt-12">
          <h1 className="text-3xl font-semibold tracking-tight">Money that just works.</h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            Send with a $handle. Earn on idle cash. Borrow against your real credit. No seed phrases. No network jargon.
          </p>
          <Button className="mt-10 w-full" size="lg" disabled={busy} onClick={bindPasskey}>
            <Fingerprint className="size-5" />
            {busy ? "Creating your ZIP…" : "Continue with passkey"}
          </Button>
          <p className="mt-3 text-center text-xs text-muted">Face ID, Touch ID, or your device lock.</p>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="mt-12 space-y-4">
          <h1 className="text-2xl font-semibold">Claim your $handle</h1>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          <div className="relative">
            <span className="absolute left-4 top-3.5 text-muted">$</span>
            <Input className="pl-8" value={handle} onChange={(e) => setHandle(e.target.value)} />
          </div>
          <Button
            className="w-full"
            size="lg"
            disabled={!name.trim() || !handle.replace(/^\$/, "").trim()}
            onClick={() => setStep(2)}
          >
            Looks good
          </Button>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="mt-12 space-y-4">
          <h1 className="text-2xl font-semibold">Add a phone for cash-out</h1>
          <p className="text-sm text-muted">Used for bank and mobile-money payouts. Never shown as a long account string.</p>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Button className="w-full" size="lg" disabled={!phone.trim()} onClick={finish}>
            Enter ZIP
          </Button>
        </div>
      ) : null}
    </div>
  );
}
