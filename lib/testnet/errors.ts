export function networkUserMessage(error: unknown) {
  const raw = error instanceof Error ? error.message : String(error);
  if (/timeout|took too long|timed out|failed to fetch|network|429|503/i.test(raw)) {
    return "ZIP Network is busy. We’ll keep trying in the background.";
  }
  if (/insufficient funds|exceeds balance/i.test(raw)) {
    return "Not enough testnet cash. Open Settings and tap Get testnet cash.";
  }
  if (/user rejected|denied/i.test(raw)) return "Cancelled.";
  return "Couldn’t reach ZIP Network just now. Retrying…";
}
