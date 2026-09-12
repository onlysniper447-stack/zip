"use client";

import { createWalletClient, custom, http, type Account, type Address, type WalletClient } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { TESTNET_CHAIN, TESTNET_RPC } from "@/lib/testnet/config";
import { testnetPublicClient } from "@/lib/testnet/public";

export { testnetPublicClient };

const KEY_STORAGE = "zip-cc3-key";
const SOURCE_STORAGE = "zip-cc3-source";

export type WalletSource = "embedded" | "injected";

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

export function walletSource(): WalletSource {
  if (typeof window === "undefined") return "embedded";
  return window.localStorage.getItem(SOURCE_STORAGE) === "injected" ? "injected" : "embedded";
}

export function setWalletSource(source: WalletSource) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SOURCE_STORAGE, source);
}

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

function injectedProvider(): EthereumProvider | null {
  if (typeof window === "undefined") return null;
  return (window as Window & { ethereum?: EthereumProvider }).ethereum ?? null;
}

export async function connectInjected(): Promise<Address> {
  const ethereum = injectedProvider();
  if (!ethereum) throw new Error("No browser wallet found. ZIP can still use this device.");
  await ethereum.request({
    method: "wallet_addEthereumChain",
    params: [
      {
        chainId: `0x${TESTNET_CHAIN.id.toString(16)}`,
        chainName: TESTNET_CHAIN.name,
        nativeCurrency: TESTNET_CHAIN.nativeCurrency,
        rpcUrls: [TESTNET_RPC],
        blockExplorerUrls: [TESTNET_CHAIN.blockExplorers?.default.url].filter(Boolean),
      },
    ],
  });
  const accounts = (await ethereum.request({ method: "eth_requestAccounts" })) as string[];
  const address = accounts[0] as Address | undefined;
  if (!address) throw new Error("Wallet did not return an account");
  setWalletSource("injected");
  return address;
}

export function useDeviceWallet() {
  setWalletSource("embedded");
}

export async function getActiveAddress(): Promise<Address> {
  if (walletSource() === "injected") {
    const ethereum = injectedProvider();
    if (ethereum) {
      const accounts = (await ethereum.request({ method: "eth_accounts" })) as string[];
      if (accounts[0]) return accounts[0] as Address;
    }
    setWalletSource("embedded");
  }
  return getEmbeddedAccount().address;
}

export async function getWalletClient(): Promise<{ address: Address; client: WalletClient }> {
  if (walletSource() === "injected") {
    const ethereum = injectedProvider();
    if (ethereum) {
      const accounts = (await ethereum.request({ method: "eth_accounts" })) as string[];
      const address = accounts[0] as Address | undefined;
      if (address) {
        const client = createWalletClient({
          account: address,
          chain: TESTNET_CHAIN,
          transport: custom(ethereum),
        });
        return { address, client };
      }
    }
    setWalletSource("embedded");
  }
  const account = getEmbeddedAccount();
  const client = createWalletClient({
    account,
    chain: TESTNET_CHAIN,
    transport: http(TESTNET_RPC),
  });
  return { address: account.address, client };
}
