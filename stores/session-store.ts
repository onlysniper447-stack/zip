"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { FiatCode } from "@/lib/money";

export type SessionState = {
  onboarded: boolean;
  handle: string;
  displayName: string;
  phone: string;
  creditScore: number;
  passkeyBound: boolean;
  preferredFiat: FiatCode;
  setPreferredFiat: (fiat: FiatCode) => void;
  completeOnboarding: (input: { handle: string; displayName: string; phone: string }) => void;
  signOut: voidFn;
};

type voidFn = () => void;

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      onboarded: true,
      handle: "ada",
      displayName: "Adaeze Okonkwo",
      phone: "+234 803 441 2291",
      creditScore: 720,
      passkeyBound: true,
      preferredFiat: "NGN",
      setPreferredFiat: (preferredFiat) => set({ preferredFiat }),
      completeOnboarding: ({ handle, displayName, phone }) =>
        set({
          onboarded: true,
          handle: handle.replace(/^\$/, "").toLowerCase(),
          displayName,
          phone,
          passkeyBound: true,
        }),
      signOut: () =>
        set({
          onboarded: false,
          handle: "",
          displayName: "",
          phone: "",
          passkeyBound: false,
          creditScore: 580,
        }),
    }),
    { name: "zip-session" },
  ),
);
