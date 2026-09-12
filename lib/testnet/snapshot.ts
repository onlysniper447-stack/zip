import { getAddress, type Address } from "viem";
import type { VaultId } from "@/lib/mock/catalog";
import type { SwapCoinId } from "@/lib/mock/swap-assets";
import { zipHubAbi } from "@/lib/testnet/abi";
import { hubAddress } from "@/lib/testnet/config";
import { POOL_KEYS, TOKEN_KEYS, poolId, tokenId } from "@/lib/testnet/ids";
import { testnetPublicClient } from "@/lib/testnet/public";
import { weiToCusd } from "@/lib/testnet/units";

export type ChainSnapshot = {
  address: Address;
  live: true;
  nativeCtc: number;
  activeCusd: number;
  vaults: Array<{ id: VaultId; depositedCusd: number }>;
  tokenBalances: Record<SwapCoinId, number>;
  registeredHandle: string;
  hub: Address | null;
};

export async function readChainSnapshot(address: Address): Promise<ChainSnapshot> {
  const account = getAddress(address);
  const native = await testnetPublicClient.getBalance({ address: account });
  const hub = hubAddress();
  const vaults: Array<{ id: VaultId; depositedCusd: number }> = [];
  const tokenBalances: Record<SwapCoinId, number> = { CTC: 0, USDC: 0, "g-CRE": 0, ETH: 0 };
  let registeredHandle = "";

  if (hub) {
    const handleResult = await Promise.allSettled([
      testnetPublicClient.readContract({
        address: hub,
        abi: zipHubAbi,
        functionName: "addressToHandle",
        args: [account],
      }),
    ]);
    if (handleResult[0].status === "fulfilled") registeredHandle = String(handleResult[0].value ?? "");

    const poolResults = await Promise.allSettled(
      POOL_KEYS.map((id) =>
        testnetPublicClient.readContract({
          address: hub,
          abi: zipHubAbi,
          functionName: "poolBal",
          args: [account, poolId(id)],
        }),
      ),
    );
    POOL_KEYS.forEach((id, index) => {
      const row = poolResults[index];
      vaults.push({
        id,
        depositedCusd: weiToCusd(row.status === "fulfilled" ? row.value : BigInt(0)),
      });
    });

    const tokenResults = await Promise.allSettled(
      TOKEN_KEYS.map((id) =>
        testnetPublicClient.readContract({
          address: hub,
          abi: zipHubAbi,
          functionName: "tokenBal",
          args: [account, tokenId(id)],
        }),
      ),
    );
    TOKEN_KEYS.forEach((id, index) => {
      const row = tokenResults[index];
      tokenBalances[id] = Number(
        weiToCusd(row.status === "fulfilled" ? row.value : BigInt(0)).toFixed(6),
      );
    });
  }

  return {
    address: account,
    live: true,
    nativeCtc: Number(native) / 1e18,
    activeCusd: weiToCusd(native),
    vaults,
    tokenBalances,
    registeredHandle,
    hub,
  };
}
