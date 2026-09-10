import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function StateBanner({
  icon,
  children,
  tone = "accent",
}: {
  icon?: ReactNode;
  children: ReactNode;
  tone?: "accent" | "success" | "neutral";
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium",
        tone === "accent" && "border-[rgba(217,119,6,0.3)] bg-[rgba(217,119,6,0.15)] text-[#F59E0B]",
        tone === "success" && "border-[rgba(217,119,6,0.3)] bg-[rgba(217,119,6,0.15)] text-[#F59E0B]",
        tone === "neutral" && "border-[#3D3228] bg-[#26201A] text-[#FFFBEB]",
      )}
    >
      {icon}
      <span className="truncate">{children}</span>
    </div>
  );
}
