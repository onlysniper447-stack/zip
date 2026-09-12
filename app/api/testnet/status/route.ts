import { NextResponse } from "next/server";
import { formatEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { hubAddress, TESTNET_CHAIN_ID, TESTNET_EXPLORER, TESTNET_RPC } from "@/lib/testnet/config";
import { testnetPublicClient } from "@/lib/testnet/public";

export const dynamic = "force-dynamic";

export async function GET() {
  const hub = hubAddress();
  const rawKey = process.env.ZIP_OPERATOR_PRIVATE_KEY?.trim() ?? "";
  const key = rawKey.startsWith("0x") ? rawKey : rawKey ? `0x${rawKey}` : "";
  const expected = process.env.ZIP_OPERATOR_PUBLIC_ADDRESS?.trim();
  const derived = key && /^0x[a-fA-F0-9]{64}$/.test(key) ? privateKeyToAccount(key as `0x${string}`) : null;
  if (expected && derived && expected.toLowerCase() !== derived.address.toLowerCase()) {
    return NextResponse.json(
      {
        live: false,
        chainId: TESTNET_CHAIN_ID,
        error: "Operator key does not match ZIP_OPERATOR_PUBLIC_ADDRESS",
        operator: expected,
      },
      { status: 500 },
    );
  }
  const operator = derived;
  let operatorBalance: string | null = null;
  let hubBalance: string | null = null;
  let blockNumber: string | null = null;
  try {
    blockNumber = (await testnetPublicClient.getBlockNumber()).toString();
    if (operator) operatorBalance = formatEther(await testnetPublicClient.getBalance({ address: operator.address }));
    if (hub) hubBalance = formatEther(await testnetPublicClient.getBalance({ address: hub }));
  } catch (error) {
    return NextResponse.json(
      {
        live: false,
        chainId: TESTNET_CHAIN_ID,
        rpc: TESTNET_RPC,
        error: error instanceof Error ? error.message : "RPC unreachable",
      },
      { status: 503 },
    );
  }
  return NextResponse.json({
    live: true,
    chainId: TESTNET_CHAIN_ID,
    network: "Creditcoin Testnet",
    rpc: TESTNET_RPC,
    explorer: TESTNET_EXPLORER,
    hub,
    hubBalance,
    operator: operator?.address ?? null,
    operatorBalance,
    faucetReady: Boolean(operator && operatorBalance && Number(operatorBalance) > 0.5),
    blockNumber,
  });
}
