import type { VaultId } from "@/lib/mock/catalog";

export type DefiPoolKind = "staking" | "rwa" | "notes" | "dex";

export type DefiPool = {
  id: VaultId;
  name: string;
  pair: string;
  pairTokens: string[];
  pairTag: string;
  apy: number;
  rateLabel: "APY" | "APR";
  kind: DefiPoolKind;
  protocol: string;
  detail: string;
  allocatedCusd: number;
  poolShare?: number;
  live?: boolean;
};

function allocated(vaults: Array<{ id: string; depositedCusd: number }>, id: string, fallback: number) {
  return vaults.find((item) => item.id === id)?.depositedCusd ?? fallback;
}

export function creditcoinPools(vaults: Array<{ id: string; depositedCusd: number }>, tick = 0): DefiPool[] {
  const drift = ((tick % 17) - 8) * 0.0004;
  const ctcUsdc = allocated(vaults, "ctc-usdc", 180);
  const gcreEth = allocated(vaults, "gcre-eth", 96);

  return [
    {
      id: "ctc-stake",
      name: "Native CTC Nomination",
      pair: "CTC",
      pairTokens: ["CTC"],
      pairTag: "Native stake",
      apy: 0.072,
      rateLabel: "APY",
      kind: "staking",
      protocol: "Creditcoin",
      detail: "Validator delegation",
      allocatedCusd: allocated(vaults, "ctc-stake", 240),
    },
    {
      id: "prime",
      name: "RWA Prime Lending",
      pair: "cUSD · RWA",
      pairTokens: ["cUSD", "RWA"],
      pairTag: "Prime vault",
      apy: 0.112,
      rateLabel: "APY",
      kind: "rwa",
      protocol: "Creditcoin",
      detail: "Emerging-markets credit pool",
      allocatedCusd: allocated(vaults, "prime", 900),
    },
    {
      id: "notes",
      name: "Sovereign Notes",
      pair: "NOTES · cUSD",
      pairTokens: ["NOTES", "cUSD"],
      pairTag: "Fixed income",
      apy: 0.084,
      rateLabel: "APY",
      kind: "notes",
      protocol: "Creditcoin",
      detail: "Fixed-income notes",
      allocatedCusd: allocated(vaults, "notes", 408.33),
    },
    {
      id: "ctc-usdc",
      name: "CTC / USDC",
      pair: "CTC / USDC",
      pairTokens: ["CTC", "USDC"],
      pairTag: "DEX LP",
      apy: Math.max(0.12, 0.186 + drift),
      rateLabel: "APR",
      kind: "dex",
      protocol: "Creditcoin DEX",
      detail: "Active liquidity pair",
      allocatedCusd: ctcUsdc,
      poolShare: Math.min(0.95, 0.42 * (ctcUsdc / 180)),
      live: true,
    },
    {
      id: "gcre-eth",
      name: "g-CRE / ETH",
      pair: "g-CRE / ETH",
      pairTokens: ["g-CRE", "ETH"],
      pairTag: "DEX LP",
      apy: Math.max(0.14, 0.214 - drift),
      rateLabel: "APR",
      kind: "dex",
      protocol: "Creditcoin DEX",
      detail: "Cross-pair liquidity",
      allocatedCusd: gcreEth,
      poolShare: Math.min(0.95, 0.18 * (gcreEth / 96)),
      live: true,
    },
  ];
}

export function defiTotal(pools: DefiPool[]) {
  return pools.reduce((sum, pool) => sum + pool.allocatedCusd, 0);
}

export function defiBlendedApy(pools: DefiPool[]) {
  const total = defiTotal(pools);
  if (total <= 0) return 0;
  return pools.reduce((sum, pool) => sum + pool.apy * pool.allocatedCusd, 0) / total;
}
