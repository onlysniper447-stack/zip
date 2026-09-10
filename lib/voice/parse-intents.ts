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

const HANDLE_STOP = new Set([
  "me",
  "my",
  "the",
  "a",
  "an",
  "bank",
  "save",
  "wallet",
  "cash",
  "naira",
  "dollars",
  "euros",
  "pounds",
  "bills",
  "t",
]);

const WORD_NUM: Record<string, number> = {
  ten: 10,
  eleven: 11,
  twelve: 12,
  fifteen: 15,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
  hundred: 100,
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

  const wordK = text.match(
    /\b(ten|eleven|twelve|fifteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred)\s*(k|thousand)\b/,
  );
  if (wordK) return WORD_NUM[wordK[1]] * 1_000;

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

function contactTokens(contact: (typeof CONTACTS)[number]) {
  return [contact.handle, contact.name, contact.name.split(" ")[0] ?? "", ...(contact.aliases ?? [])]
    .map((item) => item.toLowerCase())
    .filter(Boolean);
}

export function findContact(chunk: string) {
  const cleaned = chunk.toLowerCase().replace(/[@$]/g, "");
  return (
    CONTACTS.find((contact) => contactTokens(contact).some((token) => cleaned === token || cleaned.includes(token))) ??
    null
  );
}

export function extractRecipient(chunk: string): { handle: string; name: string } | null {
  const known = findContact(chunk);
  if (known) return { handle: known.handle, name: known.name };

  const tagged = chunk.match(/[@$]([a-z0-9_]{2,24})/i);
  if (tagged) {
    const handle = tagged[1].toLowerCase();
    const contact = CONTACTS.find((item) => item.handle === handle);
    return { handle, name: contact?.name ?? handle };
  }

  const named = chunk.match(/\b(?:to|for)\s+[@$]?([a-z][a-z0-9']{1,24})/i);
  if (named) {
    const token = named[1].toLowerCase();
    if (!HANDLE_STOP.has(token)) {
      const contact = findContact(token);
      return contact ? { handle: contact.handle, name: contact.name } : { handle: token, name: token };
    }
  }

  return null;
}

function findAsset(chunk: string) {
  const cleaned = chunk.toLowerCase();
  if (/t[\s-]?bill|treasury|notes/.test(cleaned)) {
    return MARKET.find((item) => item.symbol === "TBILL");
  }
  return MARKET.find(
    (item) => cleaned.includes(item.symbol.toLowerCase()) || cleaned.includes(item.name.toLowerCase()),
  );
}

function parseClause(clause: string, index: number, fiat: FiatCode): ParsedIntent | null {
  const amount = parseAmount(clause, fiat);
  if (!amount) return null;
  const recipient = extractRecipient(clause);
  const asset = findAsset(clause);
  const isSend = /\b(send|tip|pay|transfer)\b/.test(clause);
  const isSave = /\b(save|put|park|stash|deposit)\b/.test(clause);
  const isSell = /\b(sell)\b/.test(clause);
  const isBuy = /\b(buy|invest|add)\b/.test(clause);
  const isCashout = /\b(cash out|cashout|withdraw to bank|off[- ]?ramp)\b/.test(clause);
  const money = moneyLabel(amount, fiat);

  if (recipient && (isSend || (!isSave && !isCashout && !isBuy && !isSell))) {
    return {
      id: uid(`tip${index}`),
      kind: "tip",
      label: `Send ${money} to $${recipient.handle}`,
      handle: recipient.handle,
      name: recipient.name,
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

  if (recipient) {
    return {
      id: uid(`tip${index}`),
      kind: "tip",
      label: `Send ${money} to $${recipient.handle}`,
      handle: recipient.handle,
      name: recipient.name,
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
        const handle = String(row.handle ?? row.name ?? "")
          .replace(/^[@$]/, "")
          .toLowerCase()
          .trim();
        if (!handle) return null;
        const contact = CONTACTS.find((c) => c.handle === handle) ?? findContact(handle);
        return {
          id: uid(`tip${index}`),
          kind: "tip" as const,
          label: `Send ${money} to $${contact?.handle ?? handle}`,
          handle: contact?.handle ?? handle,
          name: contact?.name ?? handle,
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
    return ["Send ₦50k to $ahmad", "Send ₦10k to @amaka and put ₦2k in T-Bills", "Tip $tunde ₦5,000"];
  }
  return [
    `Send ${meta.symbol}50 to $ahmad`,
    `Send ${meta.symbol}10 to @amaka and put ${meta.symbol}5 in T-Bills`,
    `Tip $tunde ${meta.symbol}25`,
  ];
}
