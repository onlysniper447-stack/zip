"use client";

import { useEffect, useRef } from "react";
import { networkUserMessage } from "@/lib/testnet/errors";
import { registerHandle } from "@/lib/testnet/execute";
import type { ChainSnapshot } from "@/lib/testnet/snapshot";
import { getActiveAddress } from "@/lib/testnet/wallet";
import { useSessionStore } from "@/stores/session-store";
import { useWalletStore } from "@/stores/wallet-store";

async function faucet(address: string) {
  try {
    const response = await fetch("/api/testnet/faucet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address }),
    });
    return (await response.json()) as { ok?: boolean; hash?: string; error?: string };
  } catch {
    return { error: "ZIP Network is busy. We’ll keep trying in the background." };
  }
}

async function loadSnapshot(address: string): Promise<ChainSnapshot> {
  const response = await fetch(`/api/testnet/snapshot?address=${address}`, { cache: "no-store" });
  const data = (await response.json()) as ChainSnapshot & { error?: string };
  if (!response.ok) throw new Error(data.error ?? "ZIP Network is busy. We’ll keep trying in the background.");
  return data;
}

export function useChainSync() {
  const hydrate = useWalletStore((s) => s.hydrateFromChain);
  const setLiveError = useWalletStore((s) => s.setLiveError);
  const handle = useSessionStore((s) => s.handle);
  const onboarded = useSessionStore((s) => s.onboarded);
  const started = useRef(false);

  useEffect(() => {
    if (!onboarded) {
      started.current = false;
      return;
    }
    if (started.current) return;
    started.current = true;
    let cancelled = false;

    async function sync(full = false) {
      try {
        const address = await getActiveAddress();
        let snapshot = await loadSnapshot(address);
        if (full && snapshot.nativeCtc < 0.05) {
          void faucet(address).then((drop) => {
            if (drop.hash) window.setTimeout(() => window.dispatchEvent(new Event("zip-chain-refresh")), 3500);
          });
        }
        if (full && snapshot.hub && handle && snapshot.registeredHandle !== handle && snapshot.nativeCtc >= 0.01) {
          void registerHandle(handle).catch(() => {
            /* register can wait until there is gas */
          });
        }
        if (!cancelled) {
          hydrate(snapshot);
          setLiveError(null);
        }
      } catch (error) {
        if (!cancelled) setLiveError(networkUserMessage(error));
      }
    }

    void sync(true);
    const onRefresh = () => void sync(false);
    window.addEventListener("zip-chain-refresh", onRefresh);
    const timer = window.setInterval(() => void sync(false), 45_000);
    return () => {
      cancelled = true;
      window.removeEventListener("zip-chain-refresh", onRefresh);
      window.clearInterval(timer);
    };
  }, [onboarded, handle, hydrate, setLiveError]);
}
