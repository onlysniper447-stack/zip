# ZIP

Hybrid financial super-app. Payments feel like Cash App. Yield and credit sit on Creditcoin. Users never see gas, hex, or slippage.

**Live:** [https://zip-live.vercel.app](https://zip-live.vercel.app)  
**Source:** [https://github.com/onlysniper447-stack/zip](https://github.com/onlysniper447-stack/zip)

## What this slice includes

- **Dashboard** with fiat-primary balances, Active vs Save toggle, and a live yield ticker
- **Tip / Receive** by `$handle`, contact, QR, and payment link (network fee always sponsored)
- **Borrow** with a Creditcoin credit gauge, amount/duration sliders, standard vs collateralized tranche, ZIP Wallet or bank payout
- **Save** RWA vaults: Prime Lending, Sovereign Notes, Invoice Vault, Cash Float
- **Cash out** to bank or mobile money with slide-to-confirm
- **Stocks** drawer for tokenized US equities and T-Bills
- Passkey onboarding, receipt drawer (Receipt ID, not a hash), amounts in the currency you pick on **You**

The account-abstraction boundary lives in `lib/aa/smart-account.ts`. It is a sponsored simulation today and is the single place to swap in a Creditcoin paymaster.

## Stack

Next.js App Router · TypeScript strict · Tailwind v4 · Framer Motion · TanStack Query · Zustand · Wagmi v2 / Viem · Lucide

## Run

```bash
cd zip
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Desktop shows a phone frame; mobile is full-bleed.

Demo session starts signed in as `$ada`. Sign out from **You** to replay passkey onboarding. Switch display currency under **You**.

## Deploy

```bash
npx vercel deploy --yes --prod
```

Optional env var on Vercel: `XAI_API_KEY` — VoiceAI uses Grok when set, otherwise local parsing.

## Design rules (non-negotiable)

- No gas / gwei / contract hash / slippage / hex in primary UI
- Fiat first — balances, tips, and payouts follow the **You** currency preference
- High-value actions (borrow, cash out, large deposits) use slide-to-confirm
- Micro-tips are one tap
