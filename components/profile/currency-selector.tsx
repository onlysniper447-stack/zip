"use client";

import { FIAT_CODES, FIAT_META, type FiatCode } from "@/lib/money";
import { haptic } from "@/lib/haptic";
import { cn } from "@/lib/utils";

export function CurrencySelector({
  value,
  onChange,
}: {
  value: FiatCode;
  onChange: (fiat: FiatCode) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {FIAT_CODES.map((code) => {
        const meta = FIAT_META[code];
        const active = value === code;
        return (
          <button
            key={code}
            type="button"
            onClick={() => {
              haptic("light");
              onChange(code);
            }}
            className={cn(
              "rounded-2xl border px-3 py-3 text-left transition-colors",
              active
                ? "border-primary bg-primary text-on-accent"
                : "border-line bg-surface text-foreground hover:border-primary",
            )}
          >
            <span className="block text-sm font-bold">{meta.label}</span>
            <span className={cn("mt-0.5 block text-[11px] font-medium", active ? "text-on-accent/80" : "text-muted")}>
              {meta.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
