"use client";

import { Bell, User } from "lucide-react";
import Link from "next/link";
import { ZipMark } from "@/components/brand/zip-mark";
import { haptic } from "@/lib/haptic";

export function AppHeader() {
  return (
    <header className="mb-5 flex items-center justify-between">
      <ZipMark />
      <div className="flex items-center gap-2">
        <Link
          href="/profile"
          onClick={() => haptic("light")}
          className="flex items-center gap-1.5 rounded-full border border-line bg-surface py-1 pl-1 pr-3"
          aria-label="Profile"
        >
          <span className="grid size-8 place-items-center rounded-full bg-primary/20 text-foreground">
            <User className="size-4" />
          </span>
          <span className="text-xs font-bold text-foreground">Profile</span>
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
