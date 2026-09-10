import { FX_CTC_PER_USD } from "@/lib/money";

export type SwapTokenId = "cash" | "CTC" | "USDC" | "g-CRE" | "ETH";
export type SwapCoinId = Exclude<SwapTokenId, "cash">;

export type SwapAsset = {
  id: SwapTokenId;
  ticker: string;
  name: string;
  usd: number;
  tag: string;
};

export const SWAP_ASSETS: SwapAsset[] = [
  { id: "cash", ticker: "Cash", name: "ZIP Wallet", usd: 1, tag: "Spendable" },
  { id: "CTC", ticker: "CTC", name: "Creditcoin", usd: FX_CTC_PER_USD, tag: "Native" },
  { id: "USDC", ticker: "USDC", name: "USDC", usd: 1, tag: "Stable" },
  { id: "g-CRE", ticker: "g-CRE", name: "g-CRE", usd: 1.18, tag: "Creditcoin" },
  { id: "ETH", ticker: "ETH", name: "Ether", usd: 3480, tag: "Pair" },
];

export const SWAP_PAIRS: Array<{ from: SwapTokenId; to: SwapTokenId; label: string }> = [
  { from: "CTC", to: "USDC", label: "CTC / USDC" },
  { from: "g-CRE", to: "ETH", label: "g-CRE / ETH" },
  { from: "cash", to: "CTC", label: "Cash → CTC" },
  { from: "USDC", to: "cash", label: "USDC → Cash" },
];

export const SWAP_COINS = SWAP_ASSETS.filter((asset): asset is SwapAsset & { id: SwapCoinId } => asset.id !== "cash");

export const DEFAULT_TOKEN_BALANCES: Record<SwapCoinId, number> = {
  CTC: 180,
  USDC: 90,
  "g-CRE": 40,
  ETH: 0.012,
};

export function swapAsset(id: SwapTokenId) {
  return SWAP_ASSETS.find((item) => item.id === id) ?? SWAP_ASSETS[0];
}

export function formatSwapUnits(amount: number, id: SwapTokenId) {
  const digits = id === "ETH" ? 6 : id === "cash" ? 2 : 4;
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}

export function toSwapUsd(amount: number, id: SwapTokenId) {
  return amount * swapAsset(id).usd;
}

export function fromSwapUsd(usd: number, id: SwapTokenId) {
  const price = swapAsset(id).usd;
  if (price <= 0) return 0;
  return usd / price;
}

export function tokenBalancesUsd(tokens: Record<SwapCoinId, number> | undefined) {
  if (!tokens) return 0;
  return SWAP_COINS.reduce((sum, asset) => sum + (tokens[asset.id] ?? 0) * asset.usd, 0);
}
