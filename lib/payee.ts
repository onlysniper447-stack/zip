import { getAddress, isAddress } from "viem";
import { CONTACTS } from "@/lib/mock/catalog";

function shortAccount(address: string) {
  if (!address || address.length < 10) return "ZIP Wallet";
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export type Payee = {
  kind: "username" | "address";
  name: string;
  label: string;
  counterparty: string;
};

export function parsePayee(raw: string): Payee | null {
  const value = raw.trim();
  if (!value) return null;

  if (isAddress(value)) {
    const address = getAddress(value);
    return {
      kind: "address",
      name: "ZIP Wallet",
      label: shortAccount(address),
      counterparty: address,
    };
  }

  const fromLink = parsePaymentPayload(value);
  if (fromLink) return fromLink;

  const handle = value.replace(/^[@$]/, "").trim().toLowerCase();
  if (!/^[a-z0-9_]{2,24}$/.test(handle)) return null;
  const contact = CONTACTS.find((item) => item.handle === handle);
  return {
    kind: "username",
    name: contact?.name ?? handle,
    label: handle,
    counterparty: handle,
  };
}

export function parsePaymentPayload(raw: string): Payee | null {
  try {
    const url = new URL(raw, "https://usezipnow.vercel.app");
    if (!url.pathname.includes("tip") && !url.searchParams.get("to") && !url.searchParams.get("addr")) {
      return null;
    }
    const addr = url.searchParams.get("addr");
    if (addr && isAddress(addr)) return parsePayee(addr);
    const to = url.searchParams.get("to");
    if (to) return parsePayee(to);
  } catch {
    /* not a URL */
  }
  return null;
}

export function payeeAmount(raw: string): string | null {
  try {
    const url = new URL(raw, "https://usezipnow.vercel.app");
    return url.searchParams.get("amount");
  } catch {
    return null;
  }
}
