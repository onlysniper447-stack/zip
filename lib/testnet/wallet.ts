"use client";

import { createWalletClient, fallback, http, type Account, type Address, type WalletClient } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { TESTNET_CHAIN, TESTNET_RPCS } from "@/lib/testnet/config";
import { testnetPublicClient } from "@/lib/testnet/public";

export { testnetPublicClient };

const KEY_STORAGE = "zip-cc3-key";

export function getEmbeddedKey(): `0x${string}` {
  if (typeof window === "undefined") throw new Error("ZIP wallet is device-only");
  let key = window.localStorage.getItem(KEY_STORAGE);
  if (!key || !/^0x[a-fA-F0-9]{64}$/.test(key)) {
    key = generatePrivateKey();
    window.localStorage.setItem(KEY_STORAGE, key);
  }
  return key as `0x${string}`;
}

export function getEmbeddedAccount(): Account {
  return privateKeyToAccount(getEmbeddedKey());
}

export async function getActiveAddress(): Promise<Address> {
  return getEmbeddedAccount().address;
}

export async function getWalletClient(): Promise<{ address: Address; client: WalletClient }> {
  const account = getEmbeddedAccount();
  const client = createWalletClient({
    account,
    chain: TESTNET_CHAIN,
    transport: fallback(
      TESTNET_RPCS.map((url) => http(url, { timeout: 30_000, retryCount: 2 })),
      { retryCount: 1 },
    ),
  });
  return { address: account.address, client };
}

export function shortAccount(address: string) {
  if (!address || address.length < 10) return "ZIP account";
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}
