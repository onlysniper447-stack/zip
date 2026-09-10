export const springSoft = { type: "spring" as const, stiffness: 320, damping: 32, mass: 0.8 };
export const springSnappy = { type: "spring" as const, stiffness: 420, damping: 28, mass: 0.7 };
export const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 8 },
};
