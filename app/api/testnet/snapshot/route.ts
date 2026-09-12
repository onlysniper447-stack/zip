import { NextResponse } from "next/server";
import { isAddress } from "viem";
import { readChainSnapshot } from "@/lib/testnet/snapshot";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const address = new URL(request.url).searchParams.get("address");
  if (!address || !isAddress(address)) {
    return NextResponse.json({ error: "Account is required" }, { status: 400 });
  }
  try {
    const snapshot = await readChainSnapshot(address);
    return NextResponse.json(snapshot);
  } catch {
    return NextResponse.json({ error: "ZIP Network is busy. We’ll keep trying in the background." }, { status: 503 });
  }
}
