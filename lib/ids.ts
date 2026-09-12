const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function block(length: number) {
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return out;
}

export function createReceiptId() {
  return `ZIP-${block(4)}-${block(4)}`;
}

export function createPaymentLink(handle: string, params?: Record<string, string>) {
  const search = new URLSearchParams();
  const username = handle.replace(/^[@$]/, "").toLowerCase();
  if (username) search.set("to", username);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value) search.set(key, value);
    }
  }
  const path = `/tip?${search.toString()}`;
  if (typeof window !== "undefined") {
    return `${window.location.origin}${path}`;
  }
  return path;
}
