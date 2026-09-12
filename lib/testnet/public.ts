import { createPublicClient, http } from "viem";
import { TESTNET_CHAIN, TESTNET_RPC } from "@/lib/testnet/config";

export const testnetPublicClient = createPublicClient({
  chain: TESTNET_CHAIN,
  transport: http(TESTNET_RPC),
});
