"use client";

import { useEffect, useState } from "react";
import type { AttestSnapshot } from "@/lib/attestcoin/types";

export function useAttest() {
  const [snapshot, setSnapshot] = useState<AttestSnapshot | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/attest/status")
      .then(async (response) => (await response.json()) as AttestSnapshot)
      .then((data) => {
        if (!cancelled) setSnapshot(data);
      })
      .catch(() => {
        if (!cancelled) {
          setSnapshot({
            live: false,
            network: "Creditcoin CC3 Testnet",
            sourceChain: "Ethereum Sepolia",
            sourceChainKey: 1,
            attestedHeight: null,
            attestedHash: null,
            chains: [],
            precompile: "0x0000000000000000000000000000000000000fd3",
            checkedAt: new Date().toISOString(),
            error: "Could not reach Creditcoin",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return snapshot;
}
