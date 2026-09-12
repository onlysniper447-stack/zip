"use client";

import { PageHeader } from "@/components/flow/page-header";
import { Card } from "@/components/ui/card";

const SECTIONS = [
  {
    title: "What ZIP is",
    body: "ZIP is a money app for sending, saving, swapping, and borrowing. It runs on Creditcoin Testnet. Balances you see are testnet cash, not bank deposits and not mainnet CTC.",
  },
  {
    title: "Your account",
    body: "You create a ZIP account with your name, phone, a 6-digit PIN, and this device’s lock (Face ID / passkey). Your ZIP Wallet is generated on this device and stays in the app. ZIP does not ask you to install an external wallet.",
  },
  {
    title: "Wallet keys",
    body: "The private key for your ZIP Wallet lives on this device. You can view it in Settings → Security & privacy after entering your PIN. Anyone who has that key can move the testnet cash in that wallet. ZIP cannot reverse those moves.",
  },
  {
    title: "Testnet only",
    body: "Tips, Save, Swap, Borrow, and cash-out locks settle on Creditcoin Testnet. Bank and mobile-money payouts are simulated. Do not treat ZIP as a live bank, broker, or licensed lender.",
  },
  {
    title: "Privacy",
    body: "ZIP stores your session, PIN, and wallet key on this device. We do not sell your data. Network activity may be visible on the Creditcoin Testnet explorer because that network is public.",
  },
  {
    title: "Your responsibility",
    body: "Keep your PIN private. Do not screenshot or share your wallet key. If you clear this browser or lose the device, you may lose access to that ZIP Wallet unless you saved the key.",
  },
];

export function TermsView() {
  return (
    <div>
      <PageHeader title="Terms of use" subtitle="ZIP on Creditcoin Testnet" />
      <div className="space-y-3 px-5 pb-8">
        {SECTIONS.map((section) => (
          <Card key={section.title}>
            <p className="text-sm font-bold">{section.title}</p>
            <p className="mt-2 text-sm leading-6 text-muted">{section.body}</p>
          </Card>
        ))}
        <p className="px-1 text-center text-[11px] text-muted">Last updated 12 September 2026</p>
      </div>
    </div>
  );
}
