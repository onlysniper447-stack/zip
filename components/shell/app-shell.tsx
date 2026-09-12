"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { ReceiptDrawer } from "@/components/receipt/receipt-drawer";
import { BottomNav } from "@/components/shell/bottom-nav";
import { VoiceAIDrawer } from "@/components/voice/VoiceAIDrawer";
import { useChainSync } from "@/hooks/use-chain-sync";
import { useSessionStore } from "@/stores/session-store";
import { useWalletStore } from "@/stores/wallet-store";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const onboarded = useSessionStore((s) => s.onboarded);
  const boot = useWalletStore((s) => s.boot);
  useChainSync();

  useEffect(() => {
    boot();
  }, [boot]);

  useEffect(() => {
    if (!onboarded && pathname !== "/onboarding" && pathname !== "/docs") {
      router.replace("/onboarding");
    }
  }, [onboarded, pathname, router]);

  return (
    <div className="min-h-dvh bg-canvas lg:flex lg:items-center lg:justify-center lg:p-8">
      <div className="zip-frame relative mx-auto flex min-h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-background text-foreground lg:min-h-[860px] lg:rounded-[2.4rem] lg:border lg:border-line lg:shadow-[0_40px_120px_rgba(14,12,10,0.55)]">
        <div className="pointer-events-none absolute inset-x-12 top-0 z-20 mx-auto hidden h-6 rounded-b-2xl bg-black/40 lg:block" />
        <div className="relative flex min-h-dvh flex-1 flex-col lg:min-h-[860px]">
          <main className="flex-1 overflow-y-auto pb-28">{children}</main>
          <BottomNav />
          <ReceiptDrawer />
          <VoiceAIDrawer />
        </div>
      </div>
    </div>
  );
}
