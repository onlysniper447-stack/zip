import type { FiatCode } from "@/lib/money";

export type LocalAccount = {
  id: string;
  name: string;
  last4?: string;
  kind: "bank" | "wallet";
};

export const LOCAL_ACCOUNTS: Record<FiatCode, LocalAccount[]> = {
  NGN: [
    { id: "gtb", name: "GTBank", last4: "4419", kind: "bank" },
    { id: "access", name: "Access Bank", last4: "2281", kind: "bank" },
    { id: "opay", name: "OPay", kind: "wallet" },
    { id: "palmpay", name: "PalmPay", kind: "wallet" },
  ],
  USD: [
    { id: "chase", name: "Chase", last4: "8821", kind: "bank" },
    { id: "bofa", name: "Bank of America", last4: "1044", kind: "bank" },
  ],
  EUR: [
    { id: "db", name: "Deutsche Bank", last4: "3390", kind: "bank" },
    { id: "bnp", name: "BNP Paribas", last4: "5512", kind: "bank" },
  ],
  GBP: [
    { id: "barclays", name: "Barclays", last4: "7740", kind: "bank" },
    { id: "hsbc", name: "HSBC", last4: "2198", kind: "bank" },
  ],
};

export function accountLabel(account: LocalAccount) {
  return account.last4 ? `${account.name} ··${account.last4}` : account.name;
}
