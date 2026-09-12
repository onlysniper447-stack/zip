"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Fingerprint, Lock, ShieldCheck, Smartphone, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { PinBoxes } from "@/components/auth/pin-boxes";
import { ZipMark } from "@/components/brand/zip-mark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { findAccount, handleFromName, saveAccount } from "@/lib/auth/local-accounts";
import { createPasskey } from "@/lib/aa/smart-account";
import { haptic } from "@/lib/haptic";
import { fadeUp, springSoft } from "@/lib/motion";
import { useSessionStore } from "@/stores/session-store";

type Screen = "welcome" | "login" | "signup" | "passkey";

export function AuthView({ start = "welcome" }: { start?: Screen }) {
  const router = useRouter();
  const complete = useSessionStore((s) => s.completeOnboarding);
  const [screen, setScreen] = useState<Screen>(start);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [loginWith, setLoginWith] = useState<"phone" | "email">("phone");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function enter(account: { handle: string; displayName: string; phone: string; email?: string }) {
    complete({
      handle: account.handle,
      displayName: account.displayName,
      phone: account.phone,
      email: account.email ?? "",
    });
    haptic("success");
    router.replace("/");
  }

  async function login() {
    setError(null);
    const account =
      loginWith === "email" ? findAccount({ email }) : findAccount({ phone });
    if (!account) {
      setError(
        loginWith === "email"
          ? "No ZIP account for that email. Create one instead."
          : "No ZIP account for that phone. Create one instead.",
      );
      return;
    }
    if (account.pin !== pin) {
      setError("That PIN doesn’t match.");
      return;
    }
    setBusy(true);
    enter(account);
    setBusy(false);
  }

  async function signupPasskey() {
    const displayName = name.trim();
    const cleanPhone = phone.trim();
    const cleanEmail = email.trim().toLowerCase();
    if (!displayName || pin.length !== 6 || (!cleanPhone && !cleanEmail)) {
      setError("Name, a 6-digit PIN, and phone or email are required.");
      return;
    }
    setError(null);
    setBusy(true);
    haptic("medium");
    await createPasskey(displayName);
    const handle = handleFromName(displayName);
    saveAccount({ handle, displayName, phone: cleanPhone, email: cleanEmail, pin });
    setBusy(false);
    enter({ handle, displayName, phone: cleanPhone, email: cleanEmail });
  }

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden px-6 pb-10 pt-12">
      <div className="pointer-events-none absolute -left-24 -top-16 size-72 rounded-full bg-primary/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 top-40 size-56 rounded-full bg-yield/10 blur-3xl" />

      <div className="relative flex items-center justify-between">
        {screen === "welcome" ? (
          <ZipMark />
        ) : (
          <button
            type="button"
            onClick={() => {
              setError(null);
              setScreen(screen === "passkey" ? "signup" : "welcome");
            }}
            className="grid size-10 place-items-center rounded-full border border-line bg-surface"
            aria-label="Back"
          >
            <ArrowLeft className="size-4" />
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {screen === "welcome" ? (
          <motion.div key="welcome" {...fadeUp} transition={springSoft} className="relative mt-10 flex flex-1 flex-col">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">ZIP</p>
            <h1 className="mt-3 text-[2.15rem] font-bold leading-[1.05] tracking-tight">
              Money that
              <br />
              just works.
            </h1>
            <p className="mt-4 max-w-[20rem] text-sm leading-6 text-muted">
              Pay, save, and borrow without leaving the app. Your ZIP Wallet is created on this device.
            </p>

            <div className="mt-8 space-y-2">
              {[
                { icon: Wallet, label: "Built-in wallet" },
                { icon: Fingerprint, label: "Face ID / passkey" },
                { icon: ShieldCheck, label: "Verified on Creditcoin" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-3 rounded-2xl border border-line bg-surface/80 px-3 py-2.5"
                >
                  <span className="grid size-9 place-items-center rounded-xl bg-primary/15 text-primary">
                    <item.icon className="size-4" />
                  </span>
                  <p className="text-sm font-semibold">{item.label}</p>
                </div>
              ))}
            </div>

            <div className="mt-auto space-y-3 pt-10">
              <Button className="w-full" size="lg" onClick={() => setScreen("signup")}>
                Create account
              </Button>
              <Button className="w-full" size="lg" variant="secondary" onClick={() => setScreen("login")}>
                Log in
              </Button>
              <p className="text-center text-[11px] text-muted">No seed phrases. No browser wallets.</p>
            </div>
          </motion.div>
        ) : null}

        {screen === "login" ? (
          <motion.div key="login" {...fadeUp} transition={springSoft} className="relative mt-10 flex flex-1 flex-col">
            <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
            <p className="mt-2 text-sm text-muted">Log in with phone or email, plus your PIN.</p>

            <div className="mt-8 space-y-4">
              <div className="grid grid-cols-2 gap-2 rounded-2xl border border-line bg-surface p-1">
                {(["phone", "email"] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => {
                      setLoginWith(method);
                      setError(null);
                    }}
                    className={`h-10 rounded-xl text-sm font-bold ${
                      loginWith === method ? "bg-primary text-on-accent" : "text-muted"
                    }`}
                  >
                    {method === "phone" ? "Phone" : "Email"}
                  </button>
                ))}
              </div>
              {loginWith === "phone" ? (
                <Field label="Phone">
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+234 800 000 0000"
                  />
                </Field>
              ) : (
                <Field label="Email">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    autoComplete="email"
                  />
                </Field>
              )}
              <PinBoxes value={pin} onChange={setPin} ariaLabel="PIN" />
            </div>

            {error ? <p className="mt-4 text-sm font-medium text-danger">{error}</p> : null}

            <div className="mt-auto space-y-3 pt-8">
              <Button
                className="w-full"
                size="lg"
                disabled={busy || pin.length !== 6 || (loginWith === "phone" ? !phone.trim() : !email.trim())}
                onClick={() => void login()}
              >
                <Lock className="size-4" />
                {busy ? "Signing in…" : "Log in"}
              </Button>
              <button type="button" className="w-full text-center text-sm font-bold text-primary" onClick={() => setScreen("signup")}>
                New here? Create account
              </button>
            </div>
          </motion.div>
        ) : null}

        {screen === "signup" ? (
          <motion.div key="signup" {...fadeUp} transition={springSoft} className="relative mt-8 flex flex-1 flex-col">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Step 1 of 2</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Create your ZIP</h1>
            <p className="mt-2 text-sm text-muted">Takes about a minute. Wallet stays in the app.</p>

            <div className="mt-7 space-y-4">
              <Field label="Full name">
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" autoComplete="name" />
              </Field>
              <Field label="Phone">
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+234 800 000 0000"
                />
              </Field>
              <Field label="Email">
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
              </Field>
              <p className="text-xs text-muted">Use phone, email, or both. You’ll log in with either plus your PIN.</p>
              <PinBoxes value={pin} onChange={setPin} ariaLabel="Create a 6-digit PIN" />
            </div>

            {error ? <p className="mt-4 text-sm font-medium text-danger">{error}</p> : null}

            <Button
              className="mt-auto w-full"
              size="lg"
              disabled={!name.trim() || pin.length !== 6 || (!phone.trim() && !email.trim())}
              onClick={() => {
                setError(null);
                setScreen("passkey");
              }}
            >
              Continue
            </Button>
          </motion.div>
        ) : null}

        {screen === "passkey" ? (
          <motion.div key="passkey" {...fadeUp} transition={springSoft} className="relative mt-8 flex flex-1 flex-col">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Step 2 of 2</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Lock it with Face ID</h1>
            <p className="mt-2 text-sm leading-6 text-muted">
              ZIP uses your device lock. No seed phrase, no extension, no leaving the app.
            </p>

            <div className="mt-10 grid place-items-center">
              <div className="relative grid size-28 place-items-center">
                <span className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-yield opacity-40 blur-xl" />
                <span className="relative grid size-28 place-items-center rounded-full border border-primary/40 bg-surface">
                  <Fingerprint className="size-12 text-primary" />
                </span>
              </div>
            </div>

            <div className="mt-8 space-y-2 text-sm text-muted">
              <p className="flex items-center gap-2">
                <Smartphone className="size-4 text-primary" /> Stays on this phone
              </p>
              <p className="flex items-center gap-2">
                <Wallet className="size-4 text-primary" /> ZIP Wallet is created automatically
              </p>
            </div>

            {error ? <p className="mt-4 text-sm font-medium text-danger">{error}</p> : null}

            <Button className="mt-auto w-full" size="lg" disabled={busy} onClick={() => void signupPasskey()}>
              <Fingerprint className="size-5" />
              {busy ? "Creating your ZIP…" : "Create account"}
            </Button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-muted">{label}</span>
      {children}
    </label>
  );
}
