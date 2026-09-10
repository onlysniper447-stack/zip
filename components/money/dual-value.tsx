"use client";

import { cn } from "@/lib/utils";
import { formatUsdAsFiat, type FiatCode } from "@/lib/money";
import { useSessionStore } from "@/stores/session-store";

type DualValueProps = {
  amountCusd: number;
  primary?: "fiat" | "crypto";
  size?: "sm" | "md" | "lg" | "hero";
  align?: "left" | "center" | "right";
  signed?: boolean;
  masked?: boolean;
  fiat?: FiatCode;
};

export function DualValue({
  amountCusd,
  size = "md",
  align = "left",
  signed = false,
  masked = false,
  fiat: fiatOverride,
}: DualValueProps) {
  const preferred = useSessionStore((s) => s.preferredFiat ?? "NGN");
  const fiat = fiatOverride ?? preferred;
  const sign = signed && amountCusd > 0 ? "+" : "";
  const primaryText = masked ? "••••••" : `${sign}${formatUsdAsFiat(amountCusd, fiat)}`;

  return (
    <div
      className={cn(
        "tabular-nums",
        align === "center" && "text-center",
        align === "right" && "text-right",
      )}
    >
      <p
        className={cn(
          "amount font-bold tracking-tight text-foreground",
          size === "sm" && "text-sm",
          size === "md" && "text-xl",
          size === "lg" && "text-3xl",
          size === "hero" && "text-[2.15rem] leading-none sm:text-5xl",
          signed && amountCusd > 0 && "text-yield",
          signed && amountCusd < 0 && "text-foreground",
        )}
      >
        {primaryText}
      </p>
    </div>
  );
}
