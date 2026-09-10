import { NextResponse } from "next/server";
import { getAttestSnapshot } from "@/lib/attestcoin/client";

export const dynamic = "force-dynamic";

export async function GET() {
  const snapshot = await getAttestSnapshot();
  return NextResponse.json(snapshot, { status: snapshot.live ? 200 : 503 });
}
