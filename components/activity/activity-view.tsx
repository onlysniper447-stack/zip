"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/flow/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useFiat } from "@/hooks/use-fiat";
import { haptic } from "@/lib/haptic";
import type { ActivityKind } from "@/lib/mock/catalog";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/stores/ui-store";
import { useWalletStore } from "@/stores/wallet-store";

const FILTERS: Array<{ id: "all" | ActivityKind; label: string }> = [
  { id: "all", label: "All" },
  { id: "tip", label: "Tips" },
  { id: "receive", label: "Received" },
  { id: "save", label: "Save" },
  { id: "yield", label: "Yield" },
  { id: "loan", label: "Loans" },
  { id: "cashout", label: "Cash out" },
  { id: "stock", label: "Stocks" },
];

export function ActivityView() {
  const activity = useWalletStore((s) => s.activity);
  const hide = useWalletStore((s) => s.hideBalances);
  const openReceipt = useUiStore((s) => s.openReceipt);
  const { format } = useFiat();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");

  const items = useMemo(
    () => activity.filter((item) => filter === "all" || item.kind === filter),
    [activity, filter],
  );

  return (
    <div>
      <PageHeader title="Activity" subtitle="Every movement, with a clean receipt" />
      <div className="px-5 pb-8">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                haptic("light");
                setFilter(item.id);
              }}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap",
                filter === item.id ? "bg-primary text-on-accent" : "border border-line bg-surface text-muted hover:border-primary",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="mt-3 space-y-2">
          {items.map((item) => (
            <button
              key={item.id}
              className="block w-full text-left"
              onClick={() =>
                openReceipt({
                  title: item.title,
                  subtitle: item.subtitle,
                  amountCusd: item.amountCusd,
                  receiptId: item.receiptId,
                  networkFeeLabel: "Sponsored · no extra fee",
                  verifiedLabel: "Cross-chain verified",
                })
              }
            >
              <Card className="flex items-center justify-between p-3">
                <div>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted">
                    {new Date(item.at).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className={cn("text-sm font-semibold", item.amountCusd > 0 && "text-yield")}>
                    {hide ? "••" : format(item.amountCusd, { signed: item.amountCusd > 0 })}
                  </p>
                  <Badge>{item.kind}</Badge>
                </div>
              </Card>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
