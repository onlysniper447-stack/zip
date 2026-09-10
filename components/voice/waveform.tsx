"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function VoiceWaveform({ active }: { active: boolean }) {
  return (
    <div className="flex h-16 items-end justify-center gap-1.5" aria-hidden>
      {Array.from({ length: 18 }).map((_, index) => (
        <motion.span
          key={index}
          className={cn("w-1.5 rounded-full", active ? "bg-yield" : "bg-white/20")}
          animate={
            active
              ? { height: [8, 12 + ((index * 17) % 40), 10, 28, 8] }
              : { height: 8 }
          }
          transition={
            active
              ? { duration: 0.9 + (index % 5) * 0.08, repeat: Infinity, ease: "easeInOut" }
              : { duration: 0.2 }
          }
        />
      ))}
    </div>
  );
}
