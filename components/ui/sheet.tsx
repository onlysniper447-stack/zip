"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { springSoft } from "@/lib/motion";
import { cn } from "@/lib/utils";

type SheetProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
};

export function Sheet({ open, onClose, title, subtitle, children, className }: SheetProps) {
  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            aria-label="Close"
            className="absolute inset-0 z-40 bg-black/55 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={springSoft}
            className={cn(
              "absolute inset-x-0 bottom-0 z-50 max-h-[88%] overflow-y-auto rounded-t-[16px] border border-line bg-surface px-5 pb-8 pt-3 shadow-[0_-20px_80px_rgba(0,0,0,0.45)]",
              className,
            )}
          >
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-white/15" />
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                {title ? <h2 className="text-lg font-bold tracking-tight text-foreground">{title}</h2> : null}
                {subtitle ? <p className="mt-1 text-sm font-medium text-muted">{subtitle}</p> : null}
              </div>
              <button
                onClick={onClose}
                className="grid size-9 place-items-center rounded-full bg-white/6 text-muted"
                aria-label="Close drawer"
              >
                <X className="size-4" />
              </button>
            </div>
            {children}
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
