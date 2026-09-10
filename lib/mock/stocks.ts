export type MarketKind = "equity" | "treasury";

export type MarketAsset = {
  id: string;
  symbol: string;
  name: string;
  kind: MarketKind;
  priceUsd: number;
  changePct: number;
  series: number[];
  apy?: number;
};

function series(start: number, drift: number, points = 24) {
  const out: number[] = [];
  let value = start;
  for (let i = 0; i < points; i += 1) {
    value *= 1 + drift + (Math.sin(i / 3) * 0.0018 - 0.0004);
    out.push(Number(value.toFixed(4)));
  }
  return out;
}

export const MARKET: MarketAsset[] = [
  {
    id: "aapl",
    symbol: "AAPL",
    name: "Apple",
    kind: "equity",
    priceUsd: 227.14,
    changePct: 1.24,
    series: series(221.4, 0.0011),
  },
  {
    id: "tsla",
    symbol: "TSLA",
    name: "Tesla",
    kind: "equity",
    priceUsd: 248.9,
    changePct: -0.84,
    series: series(256.1, -0.0012),
  },
  {
    id: "voo",
    symbol: "VOO",
    name: "Vanguard S&P 500",
    kind: "equity",
    priceUsd: 518.42,
    changePct: 0.37,
    series: series(512.8, 0.00045),
  },
  {
    id: "tbill",
    symbol: "TBILL",
    name: "US 4-Week Notes",
    kind: "treasury",
    priceUsd: 99.48,
    changePct: 0.06,
    apy: 0.052,
    series: series(99.36, 0.00006),
  },
];
