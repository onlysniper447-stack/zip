import { CONTACTS } from "@/lib/mock/catalog";
import { MARKET } from "@/lib/mock/stocks";

export type ParsedIntent =
  | {
      id: string;
      kind: "tip";
      label: string;
      handle: string;
      name: string;
      amountNgn: number;
    }
  | {
      id: string;
      kind: "stock";
      label: string;
      symbol: string;
      side: "buy" | "sell";
      amountNgn: number;
    }
  | {
      id: string;
      kind: "save";
      label: string;
      amountNgn: number;
    }
  | {
      id: string;
      kind: "cashout";
      label: string;
      amountNgn: number;
    };

export type ParseResult = {
  transcript: string;
  intents: ParsedIntent[];
  source: "model" | "local";
};

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

export function parseAmountNgn(chunk: string): number | null {
  const text = chunk
    .toLowerCase()
    .replace(/naira|ngn|₦/g, " ")
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
  return value < 200 ? Math.round(value * 1_000) : Math.round(value);
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

function parseClause(clause: string, index: number): ParsedIntent | null {
  const amountNgn = parseAmountNgn(clause);
  if (!amountNgn) return null;
  const contact = findContact(clause);
  const asset = findAsset(clause);
  const isSend = /\b(send|tip|pay|transfer)\b/.test(clause);
  const isSave = /\b(save|put|park|stash|deposit)\b/.test(clause);
  const isSell = /\b(sell)\b/.test(clause);
  const isBuy = /\b(buy|invest|add)\b/.test(clause);
  const isCashout = /\b(cash out|cashout|withdraw to bank|off[- ]?ramp)\b/.test(clause);

  if (isSend && contact) {
    return {
      id: uid(`tip${index}`),
      kind: "tip",
      label: `Send ₦${amountNgn.toLocaleString()} to $${contact.handle}`,
      handle: contact.handle,
      name: contact.name,
      amountNgn,
    };
  }

  if ((isBuy || isSave || isSell) && asset) {
    const side = isSell ? "sell" : "buy";
    return {
      id: uid(`stk${index}`),
      kind: "stock",
      label: `${side === "buy" ? "Buy" : "Sell"} ₦${amountNgn.toLocaleString()} of ${asset.symbol}`,
      symbol: asset.symbol,
      side,
      amountNgn,
    };
  }

  if (isSave) {
    return {
      id: uid(`sav${index}`),
      kind: "save",
      label: `Move ₦${amountNgn.toLocaleString()} into Save`,
      amountNgn,
    };
  }

  if (isCashout) {
    return {
      id: uid(`out${index}`),
      kind: "cashout",
      label: `Cash out ₦${amountNgn.toLocaleString()} to bank`,
      amountNgn,
    };
  }

  if (contact) {
    return {
      id: uid(`tip${index}`),
      kind: "tip",
      label: `Send ₦${amountNgn.toLocaleString()} to $${contact.handle}`,
      handle: contact.handle,
      name: contact.name,
      amountNgn,
    };
  }

  return null;
}

export function parseUtterance(transcript: string): ParsedIntent[] {
  const normalized = transcript
    .toLowerCase()
    .replace(/please|kindly/g, " ")
    .replace(/@/g, "$")
    .replace(/\b(and then|then|plus|also|,| and )\b/g, "|");
  return normalized
    .split("|")
    .map((clause) => clause.trim())
    .filter(Boolean)
    .map((clause, index) => parseClause(clause, index))
    .filter((item): item is ParsedIntent => item !== null);
}

export function intentsFromModelJson(raw: unknown, transcript: string): ParsedIntent[] {
  if (!Array.isArray(raw)) return parseUtterance(transcript);
  const mapped = raw
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const kind = String(row.kind ?? "");
      const amountNgn = Number(row.amountNgn);
      if (!Number.isFinite(amountNgn) || amountNgn <= 0) return null;
      if (kind === "tip") {
        const handle = String(row.handle ?? "").replace(/^\$/, "");
        const contact = CONTACTS.find((c) => c.handle === handle) ?? findContact(handle);
        if (!contact) return null;
        return {
          id: uid(`tip${index}`),
          kind: "tip" as const,
          label: `Send ₦${amountNgn.toLocaleString()} to $${contact.handle}`,
          handle: contact.handle,
          name: contact.name,
          amountNgn,
        };
      }
      if (kind === "stock") {
        const symbol = String(row.symbol ?? "TBILL").toUpperCase();
        const side = row.side === "sell" ? "sell" : "buy";
        return {
          id: uid(`stk${index}`),
          kind: "stock" as const,
          label: `${side === "buy" ? "Buy" : "Sell"} ₦${amountNgn.toLocaleString()} of ${symbol}`,
          symbol,
          side,
          amountNgn,
        };
      }
      if (kind === "save") {
        return {
          id: uid(`sav${index}`),
          kind: "save" as const,
          label: `Move ₦${amountNgn.toLocaleString()} into Save`,
          amountNgn,
        };
      }
      if (kind === "cashout") {
        return {
          id: uid(`out${index}`),
          kind: "cashout" as const,
          label: `Cash out ₦${amountNgn.toLocaleString()} to bank`,
          amountNgn,
        };
      }
      return null;
    })
    .filter((item): item is ParsedIntent => item !== null);
  return mapped.length ? mapped : parseUtterance(transcript);
}
