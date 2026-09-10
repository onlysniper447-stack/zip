import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  tone = "neutral",
  ...props
}: ComponentProps<"span"> & { tone?: "neutral" | "success" | "accent" | "warn" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium tracking-wide",
        tone === "neutral" && "border border-credit-line bg-credit text-foreground",
        tone === "success" && "border border-[rgba(217,119,6,0.3)] bg-[rgba(217,119,6,0.15)] text-[#F59E0B]",
        tone === "accent" && "border border-[rgba(217,119,6,0.3)] bg-[rgba(217,119,6,0.15)] text-primary",
        tone === "warn" && "border border-warn/30 bg-warn/15 text-warn",
        className,
      )}
      {...props}
    />
  );
}
