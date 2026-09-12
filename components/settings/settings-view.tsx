"use client";

import { ChevronRight, FileText, PieChart, Settings, Shield } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EmbeddedWallet } from "@/components/assets/embedded-wallet";
import { Button } from "@/components/ui/button";
import { haptic } from "@/lib/haptic";
import { useSessionStore } from "@/stores/session-store";

const ROWS = [
  {
    href: "/settings/holdings",
    title: "Asset holdings",
    subtitle: "Cash, Save, swap balances, and stocks",
    icon: PieChart,
  },
  {
    href: "/settings/security",
    title: "Security & privacy",
    subtitle: "PIN, wallet key, and hidden balances",
    icon: Shield,
  },
  {
    href: "/settings/terms",
    title: "Terms of use",
    subtitle: "How ZIP works on Creditcoin Testnet",
    icon: FileText,
  },
] as const;

export function SettingsView() {
  const session = useSessionStore();
  const router = useRouter();

  return (
    <div>
      <header className="sticky top-0 z-10 bg-background/90 px-5 py-4 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <span className="grid size-10 place-items-center rounded-full bg-primary/15 text-primary">
            <Settings className="size-5" />
          </span>
          <div>
            <h1 className="text-lg font-semibold leading-none">Settings</h1>
            <p className="mt-1 text-xs text-muted">
              {session.displayName ? session.displayName : "ZIP account"}
            </p>
          </div>
        </div>
      </header>

      <div className="px-5 pb-8">
        <EmbeddedWallet />

        <div className="mt-5 overflow-hidden rounded-[16px] border border-line">
          {ROWS.map((row, index) => {
            const Icon = row.icon;
            return (
              <Link
                key={row.href}
                href={row.href}
                onClick={() => haptic("light")}
                className={`flex items-center gap-3 bg-surface px-4 py-4 ${index > 0 ? "border-t border-line" : ""}`}
              >
                <span className="grid size-10 place-items-center rounded-2xl bg-primary/12 text-primary">
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold">{row.title}</span>
                  <span className="mt-0.5 block text-xs text-muted">{row.subtitle}</span>
                </span>
                <ChevronRight className="size-4 text-muted" />
              </Link>
            );
          })}
        </div>

        <Button
          variant="secondary"
          className="mt-6 w-full"
          onClick={() => {
            session.signOut();
            router.replace("/login");
          }}
        >
          Sign out
        </Button>
      </div>
    </div>
  );
}
