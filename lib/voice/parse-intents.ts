import { CONTACTS } from "@/lib/mock/catalog";
import { MARKET } from "@/lib/mock/stocks";
import { FIAT_META, fiatToUsd, formatFiat, type FiatCode } from "@/lib/money";

export type ParsedIntent =
  | {
      id: string;
      kind: "tip";
      label: string;
      handle: string;
      name: string;
      amount: number;
      fiat: FiatCode;
    }
  | {
      id: string;
      kind: "stock";
      label: string;
      symbol: string;
      side: "buy" | "sell";
      amount: number;
      fiat: FiatCode;
    }
  | {
      id: string;
      kind: "save";
      label: string;
      amount: number;
      fiat: FiatCode;
    }
  | {
      id: string;
      kind: "cashout";
      label: string;
      amount: number;
      fiat: FiatCode;
    };

export type ParseResult = {
  transcript: string;
  intents: ParsedIntent[];
  source: "model" | "local";
};

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

function moneyLabel(amount: number, fiat: FiatCode) {
  return formatFiat(amount, fiat);
}

export function intentUsd(intent: { amount: number; fiat: FiatCode }) {
  return fiatToUsd(intent.amount, intent.fiat);
}

export function parseAmount(chunk: string, fiat: FiatCode): number | null {
  const text = chunk
    .toLowerCase()
    .replace(/naira|ngn|usd|eur|gbp|dollars?|euros?|pounds?|[$€£₦]/g, " ")
    .replace(/,/g, "")
    .trim();
  const k = text.match(/(\d+(?:\.\d+)?)\s*k\b/);
  if (k) return Math.round(Number(k[1]) * 1_000);
  const m = text.match(/(\d+(?:\.\d+)?)\s*m\b/);
  if (m) return Math.round(Number(m[1]) * 1_000_000);
  const thousand = text.match(/(\d+(?:\.\d+)?)\s*thousand\b/);
  if (thousand) return Math.round(Number(thousand[1]) * 1_000);
  const raw = text.match(/(\d+(?:\.\d+)?)/);
  if (!raw) return null;
  const value = Number(raw[1]);
  if (!Number.isFinite(value) || value <= 0) return null;
  if (fiat === "NGN" && value < 200) return Math.round(value * 1_000);
  if (fiat === "NGN") return Math.round(value);
  return Math.round(value * 100) / 100;
}

function findContact(chunk: string) {
  const cleaned = chunk.toLowerCase().replace(/[@$]/g, "");
  return CONTACTS.find(
    (contact) =>
      cleaned.includes(contact.handle) ||
      cleaned.includes(contact.name.toLowerCase().split(" ")[0] ?? ""),
  );
}

function findAsset(chunk: string) {
  const cleaned = chunk.toLowerCase();
  if (/t[\s-]?bill|treasury|notes/.test(cleaned)) {
    return MARKET.find((item) => item.symbol === "TBILL");
  }
  return MARKET.find(
    (item) =>
      cleaned.includes(item.symbol.toLowerCase()) || cleaned.includes(item.name.toLowerCase()),
  );
}

function parseClause(clause: string, index: number, fiat: FiatCode): ParsedIntent | null {
  const amount = parseAmount(clause, fiat);
  if (!amount) return null;
  const contact = findContact(clause);
  const asset = findAsset(clause);
  const isSend = /\b(send|tip|pay|transfer)\b/.test(clause);
  const isSave = /\b(save|put|park|stash|deposit)\b/.test(clause);
  const isSell = /\b(sell)\b/.test(clause);
  const isBuy = /\b(buy|invest|add)\b/.test(clause);
  const isCashout = /\b(cash out|cashout|withdraw to bank|off[- ]?ramp)\b/.test(clause);
  const money = moneyLabel(amount, fiat);

  if (isSend && contact) {
    return {
      id: uid(`tip${index}`),
      kind: "tip",
      label: `Send ${money} to $${contact.handle}`,
      handle: contact.handle,
      name: contact.name,
      amount,
      fiat,
    };
  }

  if ((isBuy || isSave || isSell) && asset) {
    const side = isSell ? "sell" : "buy";
    return {
      id: uid(`stk${index}`),
      kind: "stock",
      label: `${side === "buy" ? "Buy" : "Sell"} ${money} of ${asset.symbol}`,
      symbol: asset.symbol,
      side,
      amount,
      fiat,
    };
  }

  if (isSave) {
    return {
      id: uid(`sav${index}`),
      kind: "save",
      label: `Move ${money} into Save`,
      amount,
      fiat,
    };
  }

  if (isCashout) {
    return {
      id: uid(`out${index}`),
      kind: "cashout",
      label: `Cash out ${money} to bank`,
      amount,
      fiat,
    };
  }

  if (contact) {
    return {
      id: uid(`tip${index}`),
      kind: "tip",
      label: `Send ${money} to $${contact.handle}`,
      handle: contact.handle,
      name: contact.name,
      amount,
      fiat,
    };
  }

  return null;
}

export function parseUtterance(transcript: string, fiat: FiatCode = "NGN"): ParsedIntent[] {
  const normalized = transcript
    .toLowerCase()
    .replace(/please|kindly/g, " ")
    .replace(/@/g, "$")
    .replace(/\b(and then|then|plus|also|,| and )\b/g, "|");
  return normalized
    .split("|")
    .map((clause) => clause.trim())
    .filter(Boolean)
    .map((clause, index) => parseClause(clause, index, fiat))
    .filter((item): item is ParsedIntent => item !== null);
}

export function intentsFromModelJson(raw: unknown, transcript: string, fiat: FiatCode = "NGN"): ParsedIntent[] {
  if (!Array.isArray(raw)) return parseUtterance(transcript, fiat);
  const mapped = raw
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const kind = String(row.kind ?? "");
      const amount = Number(row.amount ?? row.amountNgn);
      if (!Number.isFinite(amount) || amount <= 0) return null;
      const money = moneyLabel(amount, fiat);
      if (kind === "tip") {
        const handle = String(row.handle ?? "").replace(/^\$/, "");
        const contact = CONTACTS.find((c) => c.handle === handle) ?? findContact(handle);
        if (!contact) return null;
        return {
          id: uid(`tip${index}`),
          kind: "tip" as const,
          label: `Send ${money} to $${contact.handle}`,
          handle: contact.handle,
          name: contact.name,
          amount,
          fiat,
        };
      }
      if (kind === "stock") {
        const symbol = String(row.symbol ?? "TBILL").toUpperCase();
        const side = row.side === "sell" ? "sell" : "buy";
        return {
          id: uid(`stk${index}`),
          kind: "stock" as const,
          label: `${side === "buy" ? "Buy" : "Sell"} ${money} of ${symbol}`,
          symbol,
          side,
          amount,
          fiat,
        };
      }
      if (kind === "save") {
        return {
          id: uid(`sav${index}`),
          kind: "save" as const,
          label: `Move ${money} into Save`,
          amount,
          fiat,
        };
      }
      if (kind === "cashout") {
        return {
          id: uid(`out${index}`),
          kind: "cashout" as const,
          label: `Cash out ${money} to bank`,
          amount,
          fiat,
        };
      }
      return null;
    })
    .filter((item): item is ParsedIntent => item !== null);
  return mapped.length ? mapped : parseUtterance(transcript, fiat);
}

export function voiceExamples(fiat: FiatCode): string[] {
  const meta = FIAT_META[fiat];
  if (fiat === "NGN") {
    return ["Send ₦10k to @amaka and put ₦2k in T-Bills", "Tip $tunde ₦5,000", "Buy ₦20k of VOO"];
  }
  return [
    `Send ${meta.symbol}10 to @amaka and put ${meta.symbol}5 in T-Bills`,
    `Tip $tunde ${meta.symbol}25`,
    `Buy ${meta.symbol}40 of VOO`,
  ];
}
