/**
 * Direct Creditcoin Testnet execution is live via `lib/testnet/execute.ts`.
 * ERC-4337 paymaster/bundler can replace the embedded signer later without
 * changing UI-facing `executeIntent`.
 */
export const AA_STATUS = "testnet-direct" as const;
