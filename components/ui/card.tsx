import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("rounded-[16px] border border-line bg-surface p-4", className)}
      {...props}
    />
  );
}
