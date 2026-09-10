"use client";

import { motion } from "framer-motion";
import { Home, Mic, PieChart, Wallet, WalletCards } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { haptic } from "@/lib/haptic";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/stores/ui-store";

const ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/activity", label: "Activity", icon: WalletCards },
  { href: "__voice__", label: "Voice", icon: Mic },
  { href: "/off-ramp", label: "Cash out", icon: Wallet },
  { href: "/assets", label: "Assets", icon: PieChart },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const setVoiceOpen = useUiStore((s) => s.setVoiceOpen);

  if (pathname === "/onboarding" || pathname === "/docs") return null;

  return (
    <nav className="absolute inset-x-0 bottom-0 z-30 border-t border-line bg-canvas/94 px-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl">
      <ul className="grid grid-cols-5">
        {ITEMS.map((item) => {
          const active =
            item.href !== "__voice__" &&
            (pathname === item.href || (item.href === "/assets" && pathname === "/save"));
          const Icon = item.icon;
          if (item.href === "__voice__") {
            return (
              <li key={item.label} className="flex justify-center">
                <button
                  onClick={() => {
                    haptic("medium");
                    setVoiceOpen(true);
                  }}
                  className="relative -mt-7 size-14"
                  aria-label="ZIP VoiceAI"
                >
                  <span className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-yield opacity-80 blur-[7px]" />
                  <span className="relative grid size-14 place-items-center rounded-full border-2 border-transparent bg-canvas [background:linear-gradient(#0E0C0A,#0E0C0A)_padding-box,linear-gradient(135deg,#D97706,#FBBF24)_border-box] text-foreground">
                    <Mic className="size-6" />
                  </span>
                </button>
              </li>
            );
          }
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={() => haptic("light")}
                className={cn(
                  "flex flex-col items-center gap-1 py-1 text-xs font-medium",
                  active ? "text-foreground" : "text-muted",
                )}
              >
                <span className="relative grid size-8 place-items-center">
                  {active ? (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-xl bg-primary/20"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  ) : null}
                  <Icon className="relative size-5" />
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
