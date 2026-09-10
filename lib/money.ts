export const FX_NGN_PER_USD = 1500;
export const FX_CTC_PER_USD = 0.42;

export type FiatCode = "USD" | "EUR" | "GBP" | "NGN";
export type Stablecoin = "USDC" | "USDT";
export type AssetCode = FiatCode | "cUSD" | "CTC";
export type SettlementRail = "ACH" | "SEPA" | "FPS" | "NIBSS";

export const FIAT_CODES: FiatCode[] = ["USD", "EUR", "GBP", "NGN"];

/** Units of each fiat per 1 USD. */
export const FIAT_PER_USD: Record<FiatCode, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.78,
  NGN: FX_NGN_PER_USD,
};

export const FIAT_META: Record<
  FiatCode,
  {
    code: FiatCode;
    symbol: string;
    label: string;
    name: string;
    locale: string;
    currency: FiatCode;
    rail: SettlementRail;
    railName: string;
    eta: string;
  }
> = {
  USD: {
    code: "USD",
    symbol: "$",
    label: "$USD",
    name: "US Dollar",
    locale: "en-US",
    currency: "USD",
    rail: "ACH",
    railName: "ACH",
    eta: "1–2 business days",
  },
  EUR: {
    code: "EUR",
    symbol: "€",
    label: "€EUR",
    name: "Euro",
    locale: "de-DE",
    currency: "EUR",
    rail: "SEPA",
    railName: "SEPA",
    eta: "Same day",
  },
  GBP: {
    code: "GBP",
    symbol: "£",
    label: "£GBP",
    name: "British Pound",
    locale: "en-GB",
    currency: "GBP",
    rail: "FPS",
    railName: "Faster Payments",
    eta: "Usually minutes",
  },
  NGN: {
    code: "NGN",
    symbol: "₦",
    label: "₦NGN",
    name: "Nigerian Naira",
    locale: "en-NG",
    currency: "NGN",
    rail: "NIBSS",
    railName: "NIBSS",
    eta: "2–10 minutes",
  },
};

export const QUICK_AMOUNTS: Record<FiatCode, number[]> = {
  USD: [5, 10, 25],
  EUR: [5, 10, 25],
  GBP: [5, 10, 20],
  NGN: [5_000, 15_000, 50_000],
};

export function isFiatCode(value: string): value is FiatCode {
  return FIAT_CODES.includes(value as FiatCode);
}

export function usdToFiat(amountUsd: number, fiat: FiatCode) {
  return amountUsd * FIAT_PER_USD[fiat];
}

export function fiatToUsd(amount: number, fiat: FiatCode) {
  return amount / FIAT_PER_USD[fiat];
}

export function roundFiat(amount: number, fiat: FiatCode) {
  if (fiat === "NGN") return Math.round(amount);
  return Math.round(amount * 100) / 100;
}

export function formatFiat(amount: number, fiat: FiatCode, options?: { compact?: boolean }) {
  const meta = FIAT_META[fiat];
  if (options?.compact && Math.abs(amount) >= 1_000_000) {
    return `${meta.symbol}${(amount / 1_000_000).toFixed(2)}M`;
  }
  if (options?.compact && Math.abs(amount) >= 10_000 && fiat === "NGN") {
    return `${meta.symbol}${(amount / 1_000).toFixed(1)}k`;
  }
  return new Intl.NumberFormat(meta.locale, {
    style: "currency",
    currency: meta.currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatUsdAsFiat(amountUsd: number, fiat: FiatCode, options?: { compact?: boolean; signed?: boolean }) {
  const formatted = formatFiat(usdToFiat(amountUsd, fiat), fiat, options);
  if (options?.signed && amountUsd > 0) return `+${formatted}`;
  return formatted;
}

export function cusdToNgn(amount: number) {
  return usdToFiat(amount, "NGN");
}

export function ngnToCusd(amount: number) {
  return fiatToUsd(amount, "NGN");
}

export function cusdToCtc(amount: number) {
  return amount / FX_CTC_PER_USD;
}

export function ctcToCusd(amount: number) {
  return amount * FX_CTC_PER_USD;
}

export function formatNgn(amount: number, options?: { compact?: boolean }) {
  return formatFiat(amount, "NGN", options);
}

export function formatUsd(amount: number) {
  return formatFiat(amount, "USD");
}

export function formatCusd(amount: number) {
  return formatFiat(amount, "USD");
}

export function formatCtc(amount: number) {
  return formatUsd(amount);
}

export function formatAsset(amount: number, asset: AssetCode) {
  if (isFiatCode(asset)) return formatFiat(amount, asset);
  return formatUsd(amount);
}

export function toCusd(amount: number, asset: AssetCode) {
  if (isFiatCode(asset)) return fiatToUsd(amount, asset);
  if (asset === "CTC") return ctcToCusd(amount);
  return amount;
}

export function fromCusd(amountCusd: number, asset: AssetCode) {
  if (isFiatCode(asset)) return usdToFiat(amountCusd, asset);
  if (asset === "CTC") return cusdToCtc(amountCusd);
  return amountCusd;
}

export function apyToPerSecond(principal: number, apy: number) {
  return (principal * apy) / (365 * 24 * 60 * 60);
}

export function yearlyFromApy(principal: number, apy: number) {
  return principal * apy;
}
