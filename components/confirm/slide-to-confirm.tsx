"use client";

import { motion, useMotionValue, useTransform } from "framer-motion";
import { Check, ChevronRight } from "lucide-react";
import { useState } from "react";
import { haptic } from "@/lib/haptic";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  disabled?: boolean;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
};

export function SlideToConfirm({ label, disabled, loading, onConfirm }: Props) {
  const x = useMotionValue(0);
  const [done, setDone] = useState(false);
  const [track, setTrack] = useState(280);
  const max = Math.max(track - 60, 120);
  const glow = useTransform(x, [0, max], [0.15, 1]);

  return (
    <div
      ref={(node) => {
        if (node) setTrack(node.offsetWidth);
      }}
      className={cn(
        "relative h-14 overflow-hidden rounded-full border border-line bg-canvas",
        (disabled || loading) && "opacity-50",
      )}
    >
      <motion.div
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-primary/20 to-yield/20"
        style={{ opacity: glow }}
      />
      <p className="pointer-events-none absolute inset-0 grid place-items-center text-sm font-medium text-foreground/80">
        {done || loading ? "Confirming…" : label}
      </p>
      <motion.button
        drag={disabled || loading || done ? false : "x"}
        style={{ x }}
        dragConstraints={{ left: 0, right: max }}
        dragElastic={0.04}
        aria-label={label}
        className="absolute left-1 top-1 grid size-12 place-items-center rounded-full bg-primary text-on-accent shadow-[0_8px_20px_rgba(217,119,6,0.45)]"
        onDragEnd={async (_, info) => {
          if (info.offset.x > max * 0.78) {
            setDone(true);
            haptic("success");
            await onConfirm();
          } else {
            x.set(0);
          }
        }}
      >
        {done ? <Check className="size-5" /> : <ChevronRight className="size-5" />}
      </motion.button>
    </div>
  );
}
