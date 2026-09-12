"use client";

import { useEffect, useRef } from "react";
import { registerHandle } from "@/lib/testnet/execute";
import { readChainSnapshot } from "@/lib/testnet/snapshot";
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
    return { error: "Faucet unreachable" };
  }
}

export function useChainSync() {
  const hydrate = useWalletStore((s) => s.hydrateFromChain);
  const setLiveError = useWalletStore((s) => s.setLiveError);
  const handle = useSessionStore((s) => s.handle);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    let cancelled = false;

    async function sync(full = false) {
      try {
        const address = await getActiveAddress();
        let snapshot = await readChainSnapshot(address);
        if (full && snapshot.nativeCtc < 0.05) {
          const drop = await faucet(address);
          if (drop.hash) {
            await new Promise((resolve) => window.setTimeout(resolve, 4000));
            snapshot = await readChainSnapshot(address);
          } else if (drop.error) {
            setLiveError(drop.error);
          }
        }
        if (full && snapshot.hub && handle && snapshot.registeredHandle !== handle && snapshot.nativeCtc >= 0.01) {
          try {
            await registerHandle(handle);
            snapshot = await readChainSnapshot(address);
          } catch {
            /* register can wait until there is gas */
          }
        }
        if (!cancelled) {
          hydrate(snapshot);
          if (snapshot.nativeCtc >= 0.02) setLiveError(null);
        }
      } catch (error) {
        if (!cancelled) {
          setLiveError(error instanceof Error ? error.message : "Could not reach Creditcoin Testnet");
        }
      }
    }

    void sync(true);
    const onRefresh = () => void sync(false);
    window.addEventListener("zip-chain-refresh", onRefresh);
    const timer = window.setInterval(() => void sync(false), 20_000);
    return () => {
      cancelled = true;
      window.removeEventListener("zip-chain-refresh", onRefresh);
      window.clearInterval(timer);
    };
  }, [handle, hydrate, setLiveError]);
}
