export type ZipAccount = {
  handle: string;
  displayName: string;
  phone: string;
  email: string;
  pin: string;
};

const KEY = "zip-accounts";

function readAll(): ZipAccount[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as ZipAccount[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(list: ZipAccount[]) {
  window.localStorage.setItem(KEY, JSON.stringify(list.slice(0, 20)));
}

export function normalizePhone(value: string) {
  return value.replace(/[^\d+]/g, "");
}

export function handleFromName(name: string) {
  const first = name.trim().split(/\s+/)[0] ?? "";
  return first.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 16) || "zip";
}

export function saveAccount(account: ZipAccount) {
  const phone = normalizePhone(account.phone);
  const list = readAll().filter(
    (item) => normalizePhone(item.phone) !== phone && item.email.toLowerCase() !== account.email.toLowerCase(),
  );
  list.unshift({ ...account, phone });
  writeAll(list);
}

export function findAccount(input: { phone?: string; email?: string }) {
  const phone = input.phone ? normalizePhone(input.phone) : "";
  const email = input.email?.trim().toLowerCase() ?? "";
  return (
    readAll().find(
      (item) => (phone && normalizePhone(item.phone) === phone) || (email && item.email.toLowerCase() === email),
    ) ?? null
  );
}
