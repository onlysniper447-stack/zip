import { createPublicClient, fallback, http } from "viem";
import { TESTNET_CHAIN, TESTNET_RPCS } from "@/lib/testnet/config";

export const testnetPublicClient = createPublicClient({
  chain: TESTNET_CHAIN,
  transport: fallback(
    TESTNET_RPCS.map((url) =>
      http(url, {
        timeout: 20_000,
        retryCount: 2,
        retryDelay: 800,
      }),
    ),
    { retryCount: 1 },
  ),
});
