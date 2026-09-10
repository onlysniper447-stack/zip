"use client";

import Link from "next/link";
import { PageHeader } from "@/components/flow/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useAttest } from "@/hooks/use-attest";
import {
  BLOCK_PROVER_PRECOMPILE,
  CHAIN_INFO_PRECOMPILE,
  CREDITCOIN_EXPLORER,
  CREDITCOIN_TESTNET_RPC,
} from "@/lib/attestcoin/types";

export function AttestcoinDocs() {
  const snapshot = useAttest();

  return (
    <div>
      <PageHeader title="How ZIP is verified" subtitle="Attestcoin Protocol on Creditcoin testnet" />
      <div className="space-y-4 px-5 pb-10">
        <Card>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-bold">Live status</p>
            <Badge tone={snapshot?.live ? "success" : "warn"}>{snapshot?.live ? "Connected" : "Checking…"}</Badge>
          </div>
          <p className="mt-2 text-sm text-muted">
            ZIP reads attested Ethereum state on Creditcoin CC3 Testnet before it settles a payment or prices a loan.
          </p>
          {snapshot?.live ? (
            <dl className="mt-3 space-y-2 text-sm">
              <Row label="Network" value={snapshot.network} />
              <Row label="Source" value={snapshot.sourceChain} />
              <Row label="Attested height" value={String(snapshot.attestedHeight ?? "—")} />
              <Row label="Chains" value={snapshot.chains.map((c) => c.name).join(", ") || "—"} />
            </dl>
          ) : (
            <p className="mt-3 text-sm text-danger">{snapshot?.error ?? "Waiting for Creditcoin."}</p>
          )}
        </Card>

        <Card>
          <p className="text-sm font-bold">What ZIP uses Attestcoin for</p>
          <ol className="mt-2 list-decimal space-y-2 pl-4 text-sm leading-6 text-muted">
            <li>
              A stablecoin hop on Ethereum (Sepolia in this demo) is the source of truth for incoming value.
            </li>
            <li>
              Attestors record that Ethereum block on Creditcoin. ZIP queries the ChainInfo precompile for the latest
              attested height.
            </li>
            <li>
              Settlement and credit scoring only mark as “Cross-chain verified” when that attestation exists on CC3
              Testnet.
            </li>
          </ol>
        </Card>

        <Card>
          <p className="text-sm font-bold">Testnet deployment</p>
          <dl className="mt-3 space-y-2 text-sm">
            <Row label="Creditcoin RPC" value={CREDITCOIN_TESTNET_RPC.replace("https://", "")} />
            <Row label="ChainInfo" value={CHAIN_INFO_PRECOMPILE} />
            <Row label="BlockProver" value={BLOCK_PROVER_PRECOMPILE} />
          </dl>
          <a
            className="mt-3 inline-block text-sm font-bold text-primary"
            href={`${CREDITCOIN_EXPLORER}/address/${CHAIN_INFO_PRECOMPILE}`}
            target="_blank"
            rel="noreferrer"
          >
            Open ChainInfo on explorer
          </a>
        </Card>

        <Card>
          <p className="text-sm font-bold">Code map</p>
          <ul className="mt-2 space-y-1 text-sm text-muted">
            <li>
              <code className="text-foreground">lib/attestcoin/client.ts</code> — SDK + precompile calls
            </li>
            <li>
              <code className="text-foreground">app/api/attest/status</code> — live attestation snapshot
            </li>
            <li>
              <code className="text-foreground">lib/payments/engine.ts</code> — settlement waits on attestation
            </li>
          </ul>
          <p className="mt-3 text-sm text-muted">
            Full write-up: <code className="text-foreground">docs/ATTESTCOIN.md</code> in the repo.
          </p>
        </Card>

        <Link href="/" className="inline-block text-sm font-bold text-primary">
          Back to ZIP
        </Link>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className="max-w-[60%] break-all text-right font-medium text-foreground">{value}</dd>
    </div>
  );
}
