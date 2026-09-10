export const CREDITCOIN_TESTNET_RPC = "https://rpc.cc3-testnet.creditcoin.network";
export const ATTEST_PROVER_URL = "https://prover.cc3-testnet.creditcoin.network";
export const SEPOLIA_CHAIN_KEY = 1;
export const CHAIN_INFO_PRECOMPILE = "0x0000000000000000000000000000000000000fd3";
export const BLOCK_PROVER_PRECOMPILE = "0x0000000000000000000000000000000000000FD2";
export const CREDITCOIN_EXPLORER = "https://creditcoin-testnet.blockscout.com";

export type AttestedChain = {
  chainKey: number;
  chainId: number;
  name: string;
};

export type AttestSnapshot = {
  live: boolean;
  network: "Creditcoin CC3 Testnet";
  sourceChain: string;
  sourceChainKey: number;
  attestedHeight: number | null;
  attestedHash: string | null;
  chains: AttestedChain[];
  precompile: string;
  checkedAt: string;
  error?: string;
};

export type SettlementAttestation = {
  attested: boolean;
  label: string;
  sourceChain: string;
  attestedHeight: number | null;
  network: string;
};
