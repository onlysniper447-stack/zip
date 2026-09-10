export type HapticKind = "light" | "medium" | "success" | "warn" | "error";

const PATTERN: Record<HapticKind, number | number[]> = {
  light: 8,
  medium: 16,
  success: [8, 40, 18],
  warn: [12, 30, 12],
  error: [24, 40, 40, 40, 24],
};

export function haptic(kind: HapticKind = "light") {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") {
    return;
  }
  navigator.vibrate(PATTERN[kind]);
}
