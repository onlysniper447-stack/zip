import { keccak256, toBytes, type Address } from "viem";

export function normalizeHandle(handle: string) {
  return handle.replace(/^[@$]/, "").trim().toLowerCase();
}

/** Unregistered $handles receive on this derived address so the transfer is still on-chain. */
export function fallbackHandleAddress(handle: string): Address {
  const hash = keccak256(toBytes(`zip.contact:${normalizeHandle(handle)}`));
  return `0x${hash.slice(-40)}` as Address;
}
