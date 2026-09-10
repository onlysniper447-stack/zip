export type VaultId = "prime" | "notes" | "invoice" | "float";
export type TrancheId = "standard" | "collateral";
export type ActivityKind = "tip" | "receive" | "yield" | "loan" | "cashout" | "save" | "stock";
export type ActivityStatus = "complete" | "pending" | "failed";

export type Vault = {
  id: VaultId;
  name: string;
  tagline: string;
  apy: number;
  risk: "Conservative" | "Balanced" | "Growth";
  lock: string;
  minCusd: number;
  description: string;
  backing: string;
};

export type Contact = {
  handle: string;
  name: string;
  phone: string;
  city: string;
  lastPaid?: string;
};

export type ActivityItem = {
  id: string;
  kind: ActivityKind;
  title: string;
  subtitle: string;
  amountCusd: number;
  at: string;
  receiptId: string;
  status: ActivityStatus;
};

export const VAULTS: Vault[] = [
  {
    id: "prime",
    name: "Prime Lending",
    tagline: "Idle cash, working overnight",
    apy: 0.112,
    risk: "Balanced",
    lock: "Anytime",
    minCusd: 10,
    description:
      "Your spare balance is routed into Creditcoin real-world lending pools that fund verified small-business credit.",
    backing: "On-chain loan books with repayment history",
  },
  {
    id: "notes",
    name: "Sovereign Notes",
    tagline: "Short-duration government paper",
    apy: 0.084,
    risk: "Conservative",
    lock: "7 days",
    minCusd: 25,
    description: "Tokenized short-term notes. Lower yield, lower drama — built for money you might need next week.",
    backing: "Short-duration sovereign and agency notes",
  },
  {
    id: "invoice",
    name: "Invoice Vault",
    tagline: "Advance cash against paid invoices",
    apy: 0.141,
    risk: "Growth",
    lock: "30 days",
    minCusd: 50,
    description: "Funds invoice advances for verified merchants. Higher yield, 30-day hold, monthly payouts.",
    backing: "Verified SME invoices with buyer credit checks",
  },
  {
    id: "float",
    name: "Cash Float",
    tagline: "Settlement buffer for local rails",
    apy: 0.062,
    risk: "Conservative",
    lock: "Instant",
    minCusd: 5,
    description: "Underwrites mobile-money and bank payout float. Instant exit, modest yield.",
    backing: "Licensed payout partners and settlement reserves",
  },
];

export const CONTACTS: Contact[] = [
  { handle: "tunde", name: "Tunde Bakare", phone: "+234 802 114 8830", city: "Lagos", lastPaid: "Yesterday" },
  { handle: "amaka", name: "Amaka Obi", phone: "+234 809 220 4411", city: "Enugu", lastPaid: "Tue" },
  { handle: "kofi", name: "Kofi Mensah", phone: "+233 24 555 0192", city: "Accra", lastPaid: "Mar 2" },
  { handle: "zainab", name: "Zainab Bello", phone: "+234 701 883 2290", city: "Abuja" },
  { handle: "chidi", name: "Chidi Eze", phone: "+234 813 440 1188", city: "Port Harcourt", lastPaid: "Last week" },
  { handle: "nana", name: "Nana Adjei", phone: "+233 20 774 3310", city: "Kumasi" },
];

const SEED_AT = Date.parse("2026-09-10T12:00:00.000Z");

export const SEED_ACTIVITY: ActivityItem[] = [
  {
    id: "a1",
    kind: "yield",
    title: "Overnight yield",
    subtitle: "Prime Lending",
    amountCusd: 1.84,
    at: new Date(SEED_AT - 1000 * 60 * 50).toISOString(),
    receiptId: "ZIP-4K8M-2NQP",
    status: "complete",
  },
  {
    id: "a2",
    kind: "tip",
    title: "Sent to $amaka",
    subtitle: "For the generator fuel",
    amountCusd: -20,
    at: new Date(SEED_AT - 1000 * 60 * 60 * 5).toISOString(),
    receiptId: "ZIP-9R2C-7HWA",
    status: "complete",
  },
  {
    id: "a3",
    kind: "receive",
    title: "From $kofi",
    subtitle: "Lagos trip split",
    amountCusd: 48,
    at: new Date(SEED_AT - 1000 * 60 * 60 * 26).toISOString(),
    receiptId: "ZIP-1Q3D-8LMN",
    status: "complete",
  },
  {
    id: "a4",
    kind: "save",
    title: "Moved to Prime Lending",
    subtitle: "Auto-yield",
    amountCusd: -200,
    at: new Date(SEED_AT - 1000 * 60 * 60 * 48).toISOString(),
    receiptId: "ZIP-6T5B-3CDE",
    status: "complete",
  },
  {
    id: "a5",
    kind: "cashout",
    title: "To GTBank ··4419",
    subtitle: "Arrived in 4 min",
    amountCusd: -80,
    at: new Date(SEED_AT - 1000 * 60 * 60 * 80).toISOString(),
    receiptId: "ZIP-2F9K-5RST",
    status: "complete",
  },
];

export const BANKS = [
  { id: "gtb", name: "GTBank", last4: "4419" },
  { id: "access", name: "Access Bank", last4: "2281" },
];

export const MOBILE_MONEY = [
  { id: "opay", name: "OPay" },
  { id: "palmpay", name: "PalmPay" },
  { id: "momo", name: "MTN MoMo" },
];

export const STICKERS = ["🙏", "🔥", "💸", "🎉", "❤️", "☕", "🚗", "🏠"] as const;
