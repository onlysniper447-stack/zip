"use client";

import { Fingerprint, Phone, ShieldCheck } from "lucide-react";
import { CreditGauge } from "@/components/borrow/credit-gauge";
import { PageHeader } from "@/components/flow/page-header";
import { CurrencySelector } from "@/components/profile/currency-selector";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { useAttest } from "@/hooks/use-attest";
import { CREDIT_BUREAU_LABEL } from "@/lib/creditcoin";
import { FIAT_META } from "@/lib/money";
import { LOCAL_ACCOUNTS, accountLabel } from "@/lib/payments/rails";
import { useSessionStore } from "@/stores/session-store";

export function ProfileView() {
  const session = useSessionStore();
  const fiat = session.preferredFiat ?? "NGN";
  const meta = FIAT_META[fiat];
  const linked = LOCAL_ACCOUNTS[fiat].find((item) => item.kind === "bank") ?? LOCAL_ACCOUNTS[fiat][0];
  const attest = useAttest();

  return (
    <div>
      <PageHeader title="You" subtitle={`$${session.handle}`} />
      <div className="px-5 pb-8">
        <Card className="text-center">
          <div className="mx-auto mb-3 grid size-16 place-items-center rounded-3xl bg-primary/20 text-xl font-semibold">
            {session.displayName
              .split(" ")
              .map((p) => p[0])
              .join("")
              .slice(0, 2)}
          </div>
          <h2 className="text-lg font-semibold">{session.displayName}</h2>
          <p className="text-sm text-muted">${session.handle}</p>
          <div className="mt-3 flex justify-center gap-2">
            <Badge tone="accent">
              <Fingerprint className="size-3" /> Passkey on
            </Badge>
            <Badge>
              <Phone className="size-3" /> {session.phone}
            </Badge>
          </div>
        </Card>

        <Card className="mt-4">
          <p className="text-sm font-semibold">Currency preference</p>
          <p className="mt-1 text-xs text-muted">
            Balances, tips, and payouts show in this currency. Routing stays in the background.
          </p>
          <div className="mt-3">
            <CurrencySelector value={fiat} onChange={session.setPreferredFiat} />
          </div>
        </Card>

        <Card className="mt-4 flex flex-col items-center">
          <CreditGauge score={session.creditScore} />
          <p className="mt-2 flex items-center gap-1 text-xs text-muted">
            <ShieldCheck className="size-3.5 text-yield" />
            {attest?.live ? CREDIT_BUREAU_LABEL : "Connecting to Creditcoin…"}
          </p>
          {attest?.live ? (
            <p className="mt-1 text-center text-[11px] text-muted">
              {attest.sourceChain} attested through block {attest.attestedHeight}
            </p>
          ) : null}
        </Card>

        <Card className="mt-4 space-y-3 text-sm">
          <Row label="Login" value="Face / passkey" />
          <Row label="Linked account" value={linked ? accountLabel(linked) : "—"} />
          <Row label="Payout rail" value={`${meta.railName} · ${meta.eta}`} />
          <Row label="Display currency" value={meta.label} />
        </Card>

        <Link href="/docs" className="mt-4 block text-center text-sm font-bold text-primary">
          How ZIP is verified
        </Link>

        <Button variant="secondary" className="mt-5 w-full" onClick={session.signOut}>
          Sign out
        </Button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
