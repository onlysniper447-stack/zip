import { keccak256, toBytes, type Hex } from "viem";
import type { VaultId } from "@/lib/mock/catalog";
import type { SwapTokenId } from "@/lib/mock/swap-assets";

export function poolId(pool: string): Hex {
  return keccak256(toBytes(pool));
}

export function tokenId(id: SwapTokenId): Hex {
  return keccak256(toBytes(id));
}

export function stockId(symbol: string): Hex {
  return keccak256(toBytes(symbol.toUpperCase()));
}

export const POOL_KEYS: VaultId[] = [
  "prime",
  "notes",
  "invoice",
  "float",
  "ctc-stake",
  "ctc-usdc",
  "gcre-eth",
];

export const TOKEN_KEYS: Array<Exclude<SwapTokenId, "cash">> = ["CTC", "USDC", "g-CRE", "ETH"];
