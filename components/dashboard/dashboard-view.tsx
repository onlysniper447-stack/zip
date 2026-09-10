"use client";

import { motion } from "framer-motion";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Eye,
  EyeOff,
  Landmark,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { StateBanner } from "@/components/banners/state-banner";
import { DualValue } from "@/components/money/dual-value";
import { SavePools } from "@/components/dashboard/save-pools";
import { ReceiveDrawer } from "@/components/receive/receive-drawer";
import { AppHeader } from "@/components/shell/app-header";
import { StocksDrawer } from "@/components/stocks/stocks-drawer";
import { Card } from "@/components/ui/card";
import { useAttest } from "@/hooks/use-attest";
import { useFiat } from "@/hooks/use-fiat";
import { useTickingYield } from "@/hooks/use-ticking-yield";
import { haptic } from "@/lib/haptic";
import { cn } from "@/lib/utils";
import { useSessionStore } from "@/stores/session-store";
import { useWalletStore, vaultTotal } from "@/stores/wallet-store";

const ACTIONS = [
  { href: "/tip", label: "Tip", icon: ArrowUpRight },
  { href: "__receive__", label: "Receive", icon: ArrowDownLeft },
  { href: "/borrow", label: "Borrow", icon: Landmark },
  { href: "__stocks__", label: "Stocks", icon: TrendingUp },
] as const;

export function DashboardView() {
  const [pane, setPane] = useState<"active" | "save">("active");
  const [stocksOpen, setStocksOpen] = useState(false);
  const [receiveOpen, setReceiveOpen] = useState(false);
  const router = useRouter();
  const score = useSessionStore((s) => s.creditScore);
  const hide = useWalletStore((s) => s.hideBalances);
  const toggleHide = useWalletStore((s) => s.toggleHide);
  const activeCusd = useWalletStore((s) => s.activeCusd);
  const vaults = useWalletStore((s) => s.vaults);
  const yieldNow = useTickingYield();
  const { format } = useFiat();
  const attest = useAttest();
  const vaultCusd = vaultTotal(vaults);
  const totalCusd = activeCusd + vaultCusd;
  const shown = pane === "active" ? activeCusd : vaultCusd;

  return (
    <div className="px-5 pb-6 pt-5">
      <AppHeader />

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        <StateBanner tone="success" icon={<Sparkles className="size-3.5" />}>
          Earning {(yieldNow.blendedApy * 100).toFixed(1)}% APY in background
        </StateBanner>
        <StateBanner tone="neutral">
          Credit Score: {score} · {attest?.live ? "Verified on Creditcoin" : "Checking Creditcoin…"}
        </StateBanner>
      </div>

      <div className="mb-5 grid grid-cols-4 gap-2">
        {ACTIONS.map((action) => {
          const Icon = action.icon;
          const body = (
            <>
              <span className="grid size-14 place-items-center rounded-[16px] border border-line bg-surface text-foreground transition-colors group-hover:border-primary group-hover:text-primary">
                <Icon className="size-5" />
              </span>
              <span className="text-xs font-medium text-muted transition-colors group-hover:text-primary">{action.label}</span>
            </>
          );
          if (action.href === "__stocks__" || action.href === "__receive__") {
            return (
              <button
                key={action.label}
                onClick={() => {
                  haptic("light");
                  if (action.href === "__stocks__") setStocksOpen(true);
                  else setReceiveOpen(true);
                }}
                className="group flex flex-col items-center gap-2"
              >
                {body}
              </button>
            );
          }
          return (
            <Link key={action.href} href={action.href} onClick={() => haptic("light")} className="group flex flex-col items-center gap-2">
              {body}
            </Link>
          );
        })}
      </div>

      <Card className="relative overflow-hidden bg-[radial-gradient(120%_120%_at_0%_0%,rgba(217,119,6,0.18),transparent_52%),#1A1612] p-5">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">Total liquidity</p>
          <button
            onClick={() => {
              haptic("light");
              toggleHide();
            }}
            className="grid size-9 place-items-center rounded-full bg-white/6"
            aria-label={hide ? "Show balances" : "Hide balances"}
          >
            {hide ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        <DualValue amountCusd={totalCusd} size="hero" masked={hide} />
        <p className="mt-3 text-sm font-medium text-yield" suppressHydrationWarning>
          +{hide ? "••" : format(yieldNow.sessionUsd)} this session · {format(yieldNow.dailyUsd)} / day
        </p>

        <div className="mt-5 grid grid-cols-2 rounded-[16px] bg-canvas p-1">
          {(["active", "save"] as const).map((key) => (
            <button
              key={key}
              onClick={() => {
                haptic("light");
                setPane(key);
              }}
              className={cn(
                "relative rounded-[12px] py-2.5 text-sm font-bold",
                pane === key ? "text-on-accent" : "text-muted",
              )}
            >
              {pane === key ? (
                <motion.span
                  layoutId="pane"
                  className="absolute inset-0 rounded-[12px] bg-primary"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              ) : null}
              <span className="relative">{key === "active" ? "Active balance" : "Save"}</span>
            </button>
          ))}
        </div>

        <div className="mt-4 rounded-[16px] border border-line bg-canvas p-4">
          {pane === "save" ? (
            <SavePools vaults={vaults} hide={hide} tick={Math.floor(yieldNow.sessionUsd * 1000)} />
          ) : (
            <>
              <DualValue amountCusd={shown} size="md" masked={hide} />
              <p className="mt-3 text-sm font-medium text-muted">
                Spendable now. Move idle cash into Save to keep earning on Creditcoin pools.
              </p>
            </>
          )}
        </div>
      </Card>

      <StocksDrawer open={stocksOpen} onClose={() => setStocksOpen(false)} />
      <ReceiveDrawer
        open={receiveOpen}
        onClose={() => setReceiveOpen(false)}
        onScanned={(handle) => router.push(`/tip?to=${handle}`)}
      />
    </div>
  );
}
