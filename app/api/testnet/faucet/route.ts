import { NextResponse } from "next/server";
import { getAddress, http, isAddress, parseEther, createWalletClient, formatEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { TESTNET_CHAIN, TESTNET_RPC } from "@/lib/testnet/config";
import { testnetPublicClient } from "@/lib/testnet/public";

const lastDrip = new Map<string, number>();
const COOLDOWN_MS = 6 * 60 * 60 * 1000;
const TARGET = parseEther("5");
const SKIP_IF = parseEther("2");
const OPERATOR_RESERVE = parseEther("0.5");

function operatorAccount() {
  const key = process.env.ZIP_OPERATOR_PRIVATE_KEY;
  if (!key || !/^0x[a-fA-F0-9]{64}$/.test(key)) return null;
  return privateKeyToAccount(key as `0x${string}`);
}

export async function POST(request: Request) {
  let body: { address?: string };
  try {
    body = (await request.json()) as { address?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.address || !isAddress(body.address)) {
    return NextResponse.json({ error: "Account is required" }, { status: 400 });
  }
  const operator = operatorAccount();
  if (!operator) {
    return NextResponse.json(
      { error: "Testnet top-up is not configured yet.", faucet: "https://docs.creditcoin.org/wallets/using-testnet-faucet" },
      { status: 503 },
    );
  }

  const address = getAddress(body.address);
  const now = Date.now();
  const prev = lastDrip.get(address.toLowerCase()) ?? 0;
  if (now - prev < COOLDOWN_MS) {
    return NextResponse.json({ ok: true, skipped: "cooldown", nextMs: COOLDOWN_MS - (now - prev) });
  }

  const [userBal, opBal] = await Promise.all([
    testnetPublicClient.getBalance({ address }),
    testnetPublicClient.getBalance({ address: operator.address }),
  ]);
  if (userBal >= SKIP_IF) {
    return NextResponse.json({ ok: true, skipped: "funded", balance: formatEther(userBal) });
  }
  const spendable = opBal > OPERATOR_RESERVE ? opBal - OPERATOR_RESERVE : BigInt(0);
  const amount = spendable >= TARGET ? TARGET : spendable;
  if (amount < parseEther("0.05")) {
    return NextResponse.json(
      {
        error: "ZIP Network is waiting on testnet cash. Add tCTC to the operator and retry.",
        operator: operator.address,
        faucet: "https://docs.creditcoin.org/wallets/using-testnet-faucet",
      },
      { status: 503 },
    );
  }

  const client = createWalletClient({
    account: operator,
    chain: TESTNET_CHAIN,
    transport: http(TESTNET_RPC),
  });
  const hash = await client.sendTransaction({
    account: operator,
    chain: TESTNET_CHAIN,
    to: address,
    value: amount,
  });
  lastDrip.set(address.toLowerCase(), now);
  return NextResponse.json({
    ok: true,
    hash,
    amount: formatEther(amount),
    to: address,
  });
}
