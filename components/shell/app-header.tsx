"use client";

import { Bell, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { ZipMark } from "@/components/brand/zip-mark";
import { haptic } from "@/lib/haptic";
import { initials } from "@/lib/utils";
import { useSessionStore } from "@/stores/session-store";

export function AppHeader() {
  const handle = useSessionStore((s) => s.handle);
  const displayName = useSessionStore((s) => s.displayName);
  const score = useSessionStore((s) => s.creditScore);

  return (
    <header className="mb-5 flex items-center justify-between">
      <ZipMark />
      <div className="flex items-center gap-2">
        <Link
          href="/profile"
          onClick={() => haptic("light")}
          className="flex items-center gap-2 rounded-full border border-line bg-surface py-1 pl-1 pr-3"
          aria-label={`You, $${handle}`}
        >
          <span className="grid size-8 place-items-center rounded-full bg-primary/20 text-[11px] font-bold text-foreground">
            {initials(displayName || handle || "You")}
          </span>
          <span className="text-xs font-bold text-foreground">${handle}</span>
        </Link>
        <Link
          href="/profile"
          onClick={() => haptic("light")}
          className="grid size-10 place-items-center rounded-full border border-line bg-surface text-yield"
          aria-label={`Your credit, score ${score}`}
        >
          <ShieldCheck className="size-4" />
        </Link>
        <Link
          href="/activity"
          className="grid size-10 place-items-center rounded-full border border-line bg-surface"
          aria-label="Activity and alerts"
          onClick={() => haptic("light")}
        >
          <Bell className="size-4" />
        </Link>
      </div>
    </header>
  );
}
