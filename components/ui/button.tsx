"use client";

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 disabled:pointer-events-none disabled:opacity-40 active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary: "bg-primary font-bold text-on-accent shadow-[0_8px_24px_rgba(217,119,6,0.28)] hover:bg-primary/90",
        secondary: "border border-line bg-surface text-foreground hover:border-primary hover:text-primary",
        ghost: "bg-transparent text-muted hover:bg-primary/10 hover:text-primary",
        success: "bg-yield font-bold text-on-accent hover:bg-yield/90",
        danger: "bg-danger text-foreground hover:bg-danger/90",
        outline: "border border-line bg-transparent text-foreground hover:border-primary hover:text-primary",
      },
      size: {
        sm: "h-9 px-3 text-xs",
        md: "h-11 px-4",
        lg: "h-13 px-5 text-base h-14",
        icon: "size-11 rounded-2xl",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}
