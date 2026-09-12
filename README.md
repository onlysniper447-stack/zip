# ZIP

Hybrid financial super-app for **BUIDL CTC 2026 Fall**. Payments feel like Cash App. Yield, credit, and RWA sit on Creditcoin. Cross-chain hops are attested with the **Attestcoin Protocol** — users never see gas, hex, or slippage.

**Live:** [https://usezipnow.vercel.app](https://usezipnow.vercel.app)  
**Attestcoin docs (in-app):** [https://usezipnow.vercel.app/docs](https://usezipnow.vercel.app/docs)  
**Source:** [https://github.com/onlysniper447-stack/zip](https://github.com/onlysniper447-stack/zip)  
**Technical write-up:** [docs/ATTESTCOIN.md](docs/ATTESTCOIN.md)

## Tracks

- **DeFi** — tips, cash out, borrow, yield
- **RWA** — Save vaults and tokenized stocks / T-Bills
- **AI** — VoiceAI multi-intent payments

## Attestcoin Protocol (required)

ZIP uses Attestcoin **readability** on **Creditcoin CC3 Testnet**. Before a payment or loan is marked verified, the app queries the live ChainInfo precompile for attested Ethereum (Sepolia) state.

See [docs/ATTESTCOIN.md](docs/ATTESTCOIN.md) for RPC, precompiles, SDK, and the settlement flow.

## What this slice includes

- **Dashboard** with fiat-primary balances, Active vs Save toggle, and a live yield ticker
- **Tip / Receive** by `$handle`, contact, QR, and payment link (settles as real tCTC on Creditcoin Testnet)
- **Borrow** with a Creditcoin credit gauge priced after Attestcoin verification
- **Save** RWA vaults: Prime Lending, Sovereign Notes, Invoice Vault, Cash Float
- **Cash out** to bank or mobile money with slide-to-confirm
- **Stocks** drawer for tokenized US equities and T-Bills
- Passkey onboarding, receipt drawer (Receipt ID, not a hash)

## Stack

Next.js App Router · TypeScript strict · Tailwind v4 · Framer Motion · TanStack Query · Zustand · Wagmi v2 / Viem · `@gluwa/usc-sdk` (Attestcoin) · Lucide

## Run

```bash
cd zip
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Desktop shows a phone frame; mobile is full-bleed.

Demo session starts signed in as `$ada`. Sign out from **You** to replay passkey onboarding. Switch display currency under **You**. **How ZIP is verified** on that screen opens the Attestcoin docs.

## Creditcoin Testnet (live)

ZIP accounts are real EVM wallets on **Creditcoin Testnet (chain 102031)**. Tip, Save, Swap, Borrow, and Cash out submit transactions to `ZipHub`.

1. Fund the operator (in-app faucet + hub deploy) with tCTC from the [Creditcoin Discord faucet](https://docs.creditcoin.org/wallets/using-testnet-faucet):
   `0x2408451D0A36b23132dAc1489a9c5dC821aa7C40`
2. Deploy the hub:
   ```bash
   npm run deploy:hub
   ```
3. Set on Vercel / `.env.local`:
   ```
   ZIP_OPERATOR_PRIVATE_KEY=0x…
   NEXT_PUBLIC_ZIP_HUB=0x9Bf92014097B30E26E16273b2DeCdD3C60195a42
   CREDITCOIN_RPC_URL=https://rpc.cc3-testnet.creditcoin.network
   ```

**ZipHub (Creditcoin Testnet):** [0x9Bf92014097B30E26E16273b2DeCdD3C60195a42](https://creditcoin-testnet.blockscout.com/address/0x9Bf92014097B30E26E16273b2DeCdD3C60195a42)

Each device gets its own ZIP account. Profile → **Get testnet cash** drips from the operator.

## Deploy

App is on Vercel: [https://usezipnow.vercel.app](https://usezipnow.vercel.app).

```
CREDITCOIN_RPC_URL=https://rpc.cc3-testnet.creditcoin.network
ATTEST_PROVER_URL=https://prover.cc3-testnet.creditcoin.network
ZIP_OPERATOR_PRIVATE_KEY=
NEXT_PUBLIC_ZIP_HUB=
XAI_API_KEY=
```

## Design rules (non-negotiable)

- No gas / gwei / contract hash / slippage / hex in primary UI (docs page is for judges)
- Fiat first — balances, tips, and payouts follow the **You** currency preference
- High-value actions (borrow, cash out, large deposits) use slide-to-confirm
- Micro-tips are one tap
