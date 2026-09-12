"use client";

import { zeroAddress, type Address, type Hash, type Hex } from "viem";
import type { ExecutionResult, PaymentIntent } from "@/lib/aa/smart-account";
import { createReceiptId } from "@/lib/ids";
import { zipHubAbi } from "@/lib/testnet/abi";
import { explorerTx, hubAddress } from "@/lib/testnet/config";
import { fallbackHandleAddress, normalizeHandle } from "@/lib/testnet/handles";
import { poolId, stockId, tokenId } from "@/lib/testnet/ids";
import { testnetPublicClient } from "@/lib/testnet/public";
import { cusdToWei, GAS_RESERVE_WEI } from "@/lib/testnet/units";
import { getWalletClient } from "@/lib/testnet/wallet";
import type { SwapTokenId } from "@/lib/mock/swap-assets";

function friendlyError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (/user rejected|denied|rejected the request/i.test(message)) return "Cancelled.";
  if (/insufficient funds|exceeds balance/i.test(message)) {
    return "Not enough testnet cash (leave a little for the network fee).";
  }
  if (/liq|cap|amt/i.test(message)) return "ZIP Network does not have enough liquidity for this yet.";
  if (/who|handle/i.test(message)) return "Couldn’t find who to pay.";
  if (/taken/i.test(message)) return "That $handle is already claimed on ZIP Network.";
  return message.replace(/0x[a-fA-F0-9]{40,}/g, "ZIP Network").slice(0, 160);
}

async function wait(hash: Hash): Promise<Hash> {
  const receipt = await testnetPublicClient.waitForTransactionReceipt({ hash, timeout: 120_000 });
  if (receipt.status === "reverted") throw new Error("ZIP Network could not complete this.");
  return hash;
}

async function attestedResult(hash: Hash, fiat = "NGN"): Promise<ExecutionResult> {
  let verifiedLabel = "Verification pending";
  let attested = false;
  let attestedHeight: number | null = null;
  let sourceChain: string | undefined;
  try {
    const response = await fetch("/api/attest/status");
    const data = (await response.json()) as {
      live?: boolean;
      attestedHeight?: number | null;
      sourceChain?: string;
    };
    if (data.live && data.attestedHeight != null) {
      attested = true;
      verifiedLabel = "Cross-chain verified";
      attestedHeight = data.attestedHeight;
      sourceChain = data.sourceChain;
    }
  } catch {
    /* keep pending */
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("zip-chain-refresh"));
  }
  return {
    receiptId: createReceiptId(),
    amount: 0,
    fiat: (fiat as ExecutionResult["fiat"]) ?? "NGN",
    rail: "NIBSS",
    railName: "ZIP Network",
    eta: "On Creditcoin Testnet",
    status: "complete",
    settledAt: new Date().toISOString(),
    attested,
    verifiedLabel,
    sourceChain,
    attestedHeight,
    sponsored: true,
    networkFeeUsd: 0,
    txHash: hash,
    explorerUrl: explorerTx(hash),
  };
}

async function resolvePayee(handle: string): Promise<Address> {
  const clean = normalizeHandle(handle);
  const hub = hubAddress();
  if (hub) {
    try {
      const registered = (await testnetPublicClient.readContract({
        address: hub,
        abi: zipHubAbi,
        functionName: "lookup",
        args: [clean],
      })) as Address;
      if (registered && registered !== zeroAddress) return registered;
    } catch {
      /* fallback */
    }
  }
  return fallbackHandleAddress(clean);
}

export async function registerHandle(handle: string) {
  const hub = hubAddress();
  if (!hub) return null;
  const clean = normalizeHandle(handle);
  if (clean.length < 2) return null;
  const { address, client } = await getWalletClient();
  const current = (await testnetPublicClient.readContract({
    address: hub,
    abi: zipHubAbi,
    functionName: "lookup",
    args: [clean],
  })) as Address;
  if (current && current !== zeroAddress && current.toLowerCase() === address.toLowerCase()) return null;
  const hash = await client.writeContract({
    address: hub,
    abi: zipHubAbi,
    functionName: "register",
    args: [clean],
    chain: client.chain,
    account: client.account ?? address,
  });
  return wait(hash);
}

export async function executeOnchain(intent: PaymentIntent): Promise<ExecutionResult> {
  const hub = hubAddress();
  const value = cusdToWei(intent.amountCusd);
  if (value <= BigInt(0)) throw new Error("Amount is required");
  const { address, client } = await getWalletClient();
  const balance = await testnetPublicClient.getBalance({ address });
  const account = client.account ?? address;

  try {
    if (!hub) {
      if (intent.kind !== "tip" && intent.kind !== "receive") {
        throw new Error("ZIP Network hub is not live yet.");
      }
      const to = await resolvePayee(intent.counterparty ?? "");
      if (balance < value + GAS_RESERVE_WEI) throw new Error("Not enough testnet cash (leave a little for the network fee).");
      const hash = await client.sendTransaction({
        account,
        chain: client.chain,
        to,
        value,
      });
      return attestedResult(await wait(hash), intent.destFiat ?? intent.sourceFiat);
    }

    if (intent.kind === "tip" || intent.kind === "receive") {
      if (balance < value + GAS_RESERVE_WEI) throw new Error("Not enough testnet cash (leave a little for the network fee).");
      const to = await resolvePayee(intent.counterparty ?? "");
      const hash = await client.writeContract({
        address: hub,
        abi: zipHubAbi,
        functionName: "pay",
        args: [to, normalizeHandle(intent.counterparty ?? "")],
        value,
        chain: client.chain,
        account,
      });
      return attestedResult(await wait(hash), intent.destFiat ?? intent.sourceFiat);
    }

    if (intent.kind === "save") {
      if (balance < value + GAS_RESERVE_WEI) throw new Error("Not enough testnet cash (leave a little for the network fee).");
      const hash = await client.writeContract({
        address: hub,
        abi: zipHubAbi,
        functionName: "deposit",
        args: [poolId(intent.counterparty ?? "prime")],
        value,
        chain: client.chain,
        account,
      });
      return attestedResult(await wait(hash), intent.destFiat ?? intent.sourceFiat);
    }

    if (intent.kind === "withdraw") {
      const hash = await client.writeContract({
        address: hub,
        abi: zipHubAbi,
        functionName: "withdraw",
        args: [poolId(intent.counterparty ?? "prime"), value],
        chain: client.chain,
        account,
      });
      return attestedResult(await wait(hash), intent.destFiat ?? intent.sourceFiat);
    }

    if (intent.kind === "swap") {
      const from = (intent.fromToken ?? "cash") as SwapTokenId;
      const to = (intent.toToken ?? "CTC") as SwapTokenId;
      const amountIn = cusdToWei(intent.units ?? intent.amountCusd);
      const fromCash = from === "cash";
      if (fromCash && balance < amountIn + GAS_RESERVE_WEI) {
        throw new Error("Not enough testnet cash (leave a little for the network fee).");
      }
      const hash = await client.writeContract({
        address: hub,
        abi: zipHubAbi,
        functionName: "swap",
        args: [tokenId(from), tokenId(to), amountIn],
        value: fromCash ? amountIn : BigInt(0),
        chain: client.chain,
        account,
      });
      return attestedResult(await wait(hash), intent.destFiat ?? intent.sourceFiat);
    }

    if (intent.kind === "borrow") {
      const hash = await client.writeContract({
        address: hub,
        abi: zipHubAbi,
        functionName: "borrow",
        args: [value],
        chain: client.chain,
        account,
      });
      return attestedResult(await wait(hash), intent.destFiat ?? intent.sourceFiat);
    }

    if (intent.kind === "offramp") {
      if (balance < value + GAS_RESERVE_WEI) throw new Error("Not enough testnet cash (leave a little for the network fee).");
      const hash = await client.writeContract({
        address: hub,
        abi: zipHubAbi,
        functionName: "cashOut",
        args: [intent.counterparty ?? "bank"],
        value,
        chain: client.chain,
        account,
      });
      return attestedResult(await wait(hash), intent.destFiat ?? intent.sourceFiat);
    }

    if (intent.kind === "stock") {
      const buying = intent.side !== "sell";
      const symbol = stockId(intent.counterparty ?? "TBILL");
      const hash = await client.writeContract({
        address: hub,
        abi: zipHubAbi,
        functionName: "stockTrade",
        args: [symbol as Hex, value, buying],
        value: buying ? value : BigInt(0),
        chain: client.chain,
        account,
      });
      return attestedResult(await wait(hash), intent.destFiat ?? intent.sourceFiat);
    }

    throw new Error("Unsupported on ZIP Network.");
  } catch (error) {
    const message = friendlyError(error);
    const { useWalletStore } = await import("@/stores/wallet-store");
    useWalletStore.getState().setLiveError(message);
    throw new Error(message);
  }
}
