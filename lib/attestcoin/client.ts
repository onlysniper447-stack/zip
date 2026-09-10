import { JsonRpcProvider } from "ethers";
import { chainInfo } from "@gluwa/usc-sdk";
import {
  CHAIN_INFO_PRECOMPILE,
  CREDITCOIN_TESTNET_RPC,
  SEPOLIA_CHAIN_KEY,
  type AttestSnapshot,
  type SettlementAttestation,
} from "@/lib/attestcoin/types";

export type { AttestSnapshot, SettlementAttestation };

function provider() {
  const rpc = process.env.CREDITCOIN_RPC_URL ?? CREDITCOIN_TESTNET_RPC;
  return new JsonRpcProvider(rpc, undefined, { staticNetwork: true });
}

function decodeChainName(value: string) {
  if (!value.startsWith("0x")) return value;
  try {
    const text = Buffer.from(value.slice(2), "hex").toString("utf8").replace(/\u0000/g, "").trim();
    return text || value;
  } catch {
    return value;
  }
}

export async function getAttestSnapshot(): Promise<AttestSnapshot> {
  const checkedAt = new Date().toISOString();
  try {
    const chainInfoProvider = new chainInfo.PrecompileChainInfoProvider(provider());
    const supported = await chainInfoProvider.getSupportedChains();
    const latest = await chainInfoProvider.getLatestAttestedHeightAndHash(SEPOLIA_CHAIN_KEY);
    const sepolia =
      supported.find((item) => item.chainKey === SEPOLIA_CHAIN_KEY) ??
      supported.find((item) => item.chainId === 11155111);

    return {
      live: latest.exists && supported.length > 0,
      network: "Creditcoin CC3 Testnet",
      sourceChain: sepolia ? decodeChainName(sepolia.chainName) : "Ethereum Sepolia",
      sourceChainKey: SEPOLIA_CHAIN_KEY,
      attestedHeight: latest.exists ? latest.height : null,
      attestedHash: latest.exists ? latest.hash : null,
      chains: supported.map((item) => ({
        chainKey: item.chainKey,
        chainId: item.chainId,
        name: decodeChainName(item.chainName),
      })),
      precompile: CHAIN_INFO_PRECOMPILE,
      checkedAt,
    };
  } catch (error) {
    return {
      live: false,
      network: "Creditcoin CC3 Testnet",
      sourceChain: "Ethereum Sepolia",
      sourceChainKey: SEPOLIA_CHAIN_KEY,
      attestedHeight: null,
      attestedHash: null,
      chains: [],
      precompile: CHAIN_INFO_PRECOMPILE,
      checkedAt,
      error: error instanceof Error ? error.message : "Attestcoin unreachable",
    };
  }
}

export async function attestForSettlement(): Promise<SettlementAttestation> {
  const snapshot = await getAttestSnapshot();
  if (!snapshot.live || snapshot.attestedHeight == null) {
    return {
      attested: false,
      label: "Verification pending",
      sourceChain: snapshot.sourceChain,
      attestedHeight: null,
      network: snapshot.network,
    };
  }
  return {
    attested: true,
    label: "Cross-chain verified",
    sourceChain: snapshot.sourceChain,
    attestedHeight: snapshot.attestedHeight,
    network: snapshot.network,
  };
}
