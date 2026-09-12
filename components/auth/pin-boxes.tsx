"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";

export function PinBoxes({
  value,
  onChange,
  ariaLabel,
}: {
  value: string;
  onChange: (next: string) => void;
  ariaLabel: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div>
      <label className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-muted">{ariaLabel}</label>
      <input
        ref={inputRef}
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
        className="sr-only"
        aria-label={ariaLabel}
      />
      <div className="grid grid-cols-6 gap-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => inputRef.current?.focus()}
            className={cn(
              "grid h-12 place-items-center rounded-2xl border bg-white/4 text-lg font-bold",
              value.length === index ? "border-primary" : "border-line",
            )}
          >
            {value[index] ? "•" : ""}
          </button>
        ))}
      </div>
    </div>
  );
}
