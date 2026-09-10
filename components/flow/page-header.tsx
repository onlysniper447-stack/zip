"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { haptic } from "@/lib/haptic";

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-10 flex items-center gap-3 bg-background/90 px-4 py-4 backdrop-blur-xl">
      <button
        onClick={() => {
          haptic("light");
          if (typeof window !== "undefined" && window.history.length > 1) router.back();
          else router.push("/");
        }}
        className="grid size-10 place-items-center rounded-full bg-white/6"
        aria-label="Back"
      >
        <ChevronLeft className="size-5" />
      </button>
      <div>
        <h1 className="text-lg font-semibold leading-none">{title}</h1>
        {subtitle ? <p className="mt-1 text-xs text-muted">{subtitle}</p> : null}
      </div>
    </header>
  );
}
