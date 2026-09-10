export type DefiPoolKind = "staking" | "rwa" | "notes" | "dex";

export type DefiPool = {
  id: string;
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

export function creditcoinPools(vaults: Array<{ id: string; depositedCusd: number }>, tick = 0): DefiPool[] {
  const prime = vaults.find((item) => item.id === "prime")?.depositedCusd ?? 0;
  const notes = vaults.find((item) => item.id === "notes")?.depositedCusd ?? 0;
  const drift = ((tick % 17) - 8) * 0.0004;

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
      allocatedCusd: 240,
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
      allocatedCusd: prime || 900,
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
      allocatedCusd: notes || 408.33,
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
      allocatedCusd: 180,
      poolShare: 0.42,
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
      allocatedCusd: 96,
      poolShare: 0.18,
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
