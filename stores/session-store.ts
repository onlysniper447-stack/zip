"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { FiatCode } from "@/lib/money";

export type SessionState = {
  onboarded: boolean;
  handle: string;
  displayName: string;
  phone: string;
  email: string;
  creditScore: number;
  passkeyBound: boolean;
  preferredFiat: FiatCode;
  setPreferredFiat: (fiat: FiatCode) => void;
  completeOnboarding: (input: { handle: string; displayName: string; phone: string; email?: string }) => void;
  signOut: voidFn;
};

type voidFn = () => void;

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      onboarded: false,
      handle: "",
      displayName: "",
      phone: "",
      email: "",
      creditScore: 580,
      passkeyBound: false,
      preferredFiat: "NGN",
      setPreferredFiat: (preferredFiat) => set({ preferredFiat }),
      completeOnboarding: ({ handle, displayName, phone, email }) =>
        set({
          onboarded: true,
          handle: handle.replace(/^\$/, "").toLowerCase(),
          displayName,
          phone,
          email: email?.trim() ?? "",
          passkeyBound: true,
          creditScore: 720,
        }),
      signOut: () =>
        set({
          onboarded: false,
          handle: "",
          displayName: "",
          phone: "",
          email: "",
          passkeyBound: false,
          creditScore: 580,
        }),
    }),
    { name: "zip-session-auth" },
  ),
);
