"use client";

import { create } from "zustand";

export type ReceiptPayload = {
  title: string;
  subtitle: string;
  amountCusd: number;
  counterparty?: string;
  memo?: string;
  receiptId: string;
  networkFeeLabel?: string;
  railLabel?: string;
  verifiedLabel?: string;
  explorerUrl?: string;
};

type UiState = {
  receipt: ReceiptPayload | null;
  scannerOpen: boolean;
  voiceOpen: boolean;
  openReceipt: (payload: ReceiptPayload) => void;
  closeReceipt: () => void;
  setScannerOpen: (open: boolean) => void;
  setVoiceOpen: (open: boolean) => void;
};

export const useUiStore = create<UiState>((set) => ({
  receipt: null,
  scannerOpen: false,
  voiceOpen: false,
  openReceipt: (payload) => set({ receipt: payload }),
  closeReceipt: () => set({ receipt: null }),
  setScannerOpen: (scannerOpen) => set({ scannerOpen }),
  setVoiceOpen: (voiceOpen) => set({ voiceOpen }),
}));
