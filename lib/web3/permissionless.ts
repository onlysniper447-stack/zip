/**
 * ERC-4337 wiring (next slice).
 *
 * Plug permissionless.js here:
 * 1. Create a Smart Account Client against Creditcoin (chain id 102030).
 * 2. Attach a verifying paymaster so UserOperations stay "$0.00 Sponsored".
 * 3. Keep `executeIntent` in `lib/aa/smart-account.ts` as the only UI-facing API.
 *
 * The UI must keep talking in Receipt IDs, $handles, and network fees.
 */
export const AA_STATUS = "simulated" as const;
