import { creditcoinTestnet } from "@/lib/creditcoin";
import { CREDITCOIN_EXPLORER, CREDITCOIN_TESTNET_RPC } from "@/lib/attestcoin/types";
import type { Address } from "viem";

export const TESTNET_CHAIN = creditcoinTestnet;
export const TESTNET_CHAIN_ID = creditcoinTestnet.id;
export const TESTNET_RPC =
  process.env.NEXT_PUBLIC_CREDITCOIN_RPC ?? process.env.CREDITCOIN_RPC_URL ?? CREDITCOIN_TESTNET_RPC;
export const TESTNET_EXPLORER = CREDITCOIN_EXPLORER;
export const TESTNET_FAUCET_DOCS = "https://docs.creditcoin.org/wallets/using-testnet-faucet";

/** 1 tCTC is shown as $1 / ₦1,500 so demo amounts fit faucet-sized balances. */
export const TESTNET_CTC_USD = 1;

export const GAS_RESERVE_CTC = 0.003;

export function hubAddress(): Address | null {
  const value = process.env.NEXT_PUBLIC_ZIP_HUB?.trim();
  if (value && /^0x[a-fA-F0-9]{40}$/.test(value)) return value as Address;
  return null;
}

export function explorerTx(hash: string) {
  return `${TESTNET_EXPLORER}/tx/${hash}`;
}

export function explorerAddress(address: string) {
  return `${TESTNET_EXPLORER}/address/${address}`;
}

export { TESTNET_CHAIN as chain };
