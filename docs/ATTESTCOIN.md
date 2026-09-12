# ZIP × Attestcoin Protocol

Technical documentation for **BUIDL CTC 2026 Fall**.

ZIP is a hybrid neobank. Users see fiat, $handles, and receipts. Under the hood, every settlement and credit check is gated on **Attestcoin Protocol readability** running against **Creditcoin CC3 Testnet**.

## Tracks

ZIP sits primarily in **DeFi** (payments, borrow, yield) and **RWA** (Save vaults, tokenized stocks / T-Bills), with an **AI** voice layer for multi-intent payments.

## Why Attestcoin is core

Fiat capture and stablecoin hops happen off Creditcoin (Ethereum in this slice). ZIP must not credit a wallet or price a loan from an unverified foreign-chain event.

Attestcoin replaces a centralized oracle:

1. Independent attestors record Ethereum (Sepolia) block consensus on Creditcoin.
2. ZIP queries the **ChainInfo precompile** (`0x…0fd3`) for supported chains and the latest attested height/hash.
3. Settlement in `lib/payments/engine.ts` calls `attestForSettlement()`. Receipts only show **Cross-chain verified** when that attestation exists on CC3 Testnet.

This is Attestcoin **readability**: Creditcoin apps consume attested data from another chain without a single oracle operator.

## Environment (CC3 Testnet)

| Item | Value |
| --- | --- |
| RPC | `https://rpc.cc3-testnet.creditcoin.network` |
| Chain ID | `102031` |
| Proof builder | `https://prover.cc3-testnet.creditcoin.network` |
| ChainInfo precompile | `0x0000000000000000000000000000000000000fd3` |
| BlockProver precompile | `0x0000000000000000000000000000000000000FD2` |
| Explorer | https://creditcoin-testnet.blockscout.com |
| Supported source chain | Ethereum Sepolia (`chainKey` 1) |

SDK: [`@gluwa/usc-sdk`](https://www.npmjs.com/package/@gluwa/usc-sdk) (`chainInfo.PrecompileChainInfoProvider`).

## Code

| Path | Role |
| --- | --- |
| `lib/attestcoin/client.ts` | Live CC3 Testnet client |
| `app/api/attest/status/route.ts` | Snapshot API used by the app |
| `lib/payments/engine.ts` | Settlement waits on attestation |
| `app/docs/page.tsx` | In-app judge/docs view |

## Live testnet money movement

ZIP now submits real Creditcoin Testnet transactions from a per-device ZIP account (or a connected wallet):

| Action | On-chain |
| --- | --- |
| Tip / VoicePay | `ZipHub.pay` native tCTC to the $handle |
| Save / Withdraw | `ZipHub.deposit` / `withdraw` |
| Swap | `ZipHub.swap` |
| Borrow | `ZipHub.borrow` |
| Cash out | `ZipHub.cashOut` (locks tCTC, local rail still simulated) |

Receipts link to Blockscout. Attestcoin readability still stamps **Cross-chain verified** from the ChainInfo precompile.

## What is not claimed

ZIP does not yet submit `verifyAndEmit` from a user wallet. Fiat NIBSS/ACH payout is still simulated after the on-chain lock. ERC-4337 paymaster sponsorship is not live; the user account pays a tiny network fee in tCTC.

## Live

App: https://usezipnow.vercel.app  
Docs in app: https://usezipnow.vercel.app/docs  
Repo: https://github.com/onlysniper447-stack/zip
