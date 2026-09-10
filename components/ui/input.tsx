import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-12 w-full rounded-2xl border border-line bg-white/4 px-4 text-[15px] text-foreground outline-none placeholder:text-muted/80 focus:border-primary/60 focus:ring-2 focus:ring-primary/20",
        className,
      )}
      {...props}
    />
  );
}
