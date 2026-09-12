"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ActivityItem, VaultId } from "@/lib/mock/catalog";
import { createReceiptId } from "@/lib/ids";
import { DEFAULT_TOKEN_BALANCES, type SwapCoinId, type SwapTokenId } from "@/lib/mock/swap-assets";
import type { ChainSnapshot } from "@/lib/testnet/snapshot";

export type TokenBalances = Record<SwapCoinId, number>;

export type LoanRecord = {
  principalCusd: number;
  remainingCusd: number;
  apr: number;
  weeks: number;
  tranche: "standard" | "collateral";
  destination: "wallet" | "rail";
  startedAt: string;
  receiptId: string;
};

export type VaultPosition = {
  id: VaultId;
  depositedCusd: number;
};

export type StockHolding = {
  symbol: string;
  shares: number;
};

type WalletState = {
  booted: boolean;
  hideBalances: boolean;
  activeCusd: number;
  vaults: VaultPosition[];
  holdings: StockHolding[];
  tokenBalances: TokenBalances;
  activity: ActivityItem[];
  loan: LoanRecord | null;
  yieldOriginMs: number;
  chainAddress: string | null;
  nativeCtc: number;
  liveError: string | null;
  boot: () => void;
  toggleHide: () => void;
  hydrateFromChain: (snapshot: ChainSnapshot) => void;
  setLiveError: (liveError: string | null) => void;
  applyTip: (input: {
    to: string;
    amountCusd: number;
    memo?: string;
    receiptId: string;
  }) => void;
  applyReceivePreview: (amountCusd: number) => void;
  applySave: (vaultId: VaultId, amountCusd: number, receiptId: string) => void;
  applyWithdraw: (vaultId: VaultId, amountCusd: number, receiptId: string) => void;
  applyBorrow: (loan: LoanRecord) => void;
  applyOfframp: (input: {
    amountCusd: number;
    destination: string;
    receiptId: string;
  }) => void;
  applyStockTrade: (input: {
    symbol: string;
    side: "buy" | "sell";
    shares: number;
    priceUsd: number;
    receiptId: string;
  }) => void;
  applySwap: (input: {
    fromId: SwapTokenId;
    toId: SwapTokenId;
    fromAmount: number;
    toAmount: number;
    usd: number;
    receiptId: string;
  }) => void;
};

function pushActivity(list: ActivityItem[], item: ActivityItem) {
  return [item, ...list].slice(0, 40);
}

const EMPTY_TOKENS: TokenBalances = { CTC: 0, USDC: 0, "g-CRE": 0, ETH: 0 };

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      booted: false,
      hideBalances: false,
      activeCusd: 0,
      vaults: [],
      holdings: [],
      tokenBalances: { ...EMPTY_TOKENS },
      activity: [],
      loan: null,
      yieldOriginMs: Date.now(),
      chainAddress: null,
      nativeCtc: 0,
      liveError: null,
      boot: () => {
        if (!get().booted) set({ booted: true, yieldOriginMs: Date.now() });
      },
      toggleHide: () => set({ hideBalances: !get().hideBalances }),
      hydrateFromChain: (snapshot) =>
        set({
          chainAddress: snapshot.address,
          nativeCtc: snapshot.nativeCtc,
          activeCusd: snapshot.activeCusd,
          vaults: snapshot.vaults,
          tokenBalances: snapshot.tokenBalances,
          liveError: null,
        }),
      setLiveError: (liveError) => set({ liveError }),
      applyTip: ({ to, amountCusd, memo, receiptId }) =>
        set({
          activeCusd: get().activeCusd - amountCusd,
          activity: pushActivity(get().activity, {
            id: receiptId,
            kind: "tip",
            title: `Sent to $${to}`,
            subtitle: memo || "Instant tip",
            amountCusd: -amountCusd,
            at: new Date().toISOString(),
            receiptId,
            status: "complete",
          }),
        }),
      applyReceivePreview: (amountCusd) => {
        const receiptId = createReceiptId();
        set({
          activeCusd: get().activeCusd + amountCusd,
          activity: pushActivity(get().activity, {
            id: receiptId,
            kind: "receive",
            title: "Incoming payment",
            subtitle: "Payment link",
            amountCusd,
            at: new Date().toISOString(),
            receiptId,
            status: "complete",
          }),
        });
      },
      applySave: (vaultId, amountCusd, receiptId) => {
        const vaults = get().vaults.map((vault) =>
          vault.id === vaultId ? { ...vault, depositedCusd: vault.depositedCusd + amountCusd } : vault,
        );
        const has = vaults.some((vault) => vault.id === vaultId);
        set({
          activeCusd: get().activeCusd - amountCusd,
          vaults: has ? vaults : [...vaults, { id: vaultId, depositedCusd: amountCusd }],
          activity: pushActivity(get().activity, {
            id: receiptId,
            kind: "save",
            title: "Moved to vault",
            subtitle: vaultId,
            amountCusd: -amountCusd,
            at: new Date().toISOString(),
            receiptId,
            status: "complete",
          }),
        });
      },
      applyWithdraw: (vaultId, amountCusd, receiptId) =>
        set({
          activeCusd: get().activeCusd + amountCusd,
          vaults: get().vaults.map((vault) =>
            vault.id === vaultId
              ? { ...vault, depositedCusd: Math.max(0, vault.depositedCusd - amountCusd) }
              : vault,
          ),
          activity: pushActivity(get().activity, {
            id: receiptId,
            kind: "save",
            title: "Back to ZIP Wallet",
            subtitle: vaultId,
            amountCusd,
            at: new Date().toISOString(),
            receiptId,
            status: "complete",
          }),
        }),
      applyBorrow: (loan) =>
        set({
          activeCusd: loan.destination === "wallet" ? get().activeCusd + loan.principalCusd : get().activeCusd,
          loan,
          activity: pushActivity(get().activity, {
            id: loan.receiptId,
            kind: "loan",
            title: loan.destination === "wallet" ? "Loan to ZIP Wallet" : "Loan sent to bank",
            subtitle: `${Math.round(loan.apr * 1000) / 10}% · ${loan.weeks} weeks`,
            amountCusd: loan.principalCusd,
            at: loan.startedAt,
            receiptId: loan.receiptId,
            status: "complete",
          }),
        }),
      applyOfframp: ({ amountCusd, destination, receiptId }) =>
        set({
          activeCusd: get().activeCusd - amountCusd,
          activity: pushActivity(get().activity, {
            id: receiptId,
            kind: "cashout",
            title: `To ${destination}`,
            subtitle: "Usually arrives in minutes",
            amountCusd: -amountCusd,
            at: new Date().toISOString(),
            receiptId,
            status: "complete",
          }),
        }),
      applyStockTrade: ({ symbol, side, shares, priceUsd, receiptId }) => {
        const notional = shares * priceUsd;
        const list = get().holdings ?? [];
        const current = list.find((item) => item.symbol === symbol)?.shares ?? 0;
        const nextShares = side === "buy" ? current + shares : Math.max(0, current - shares);
        const holdings = [
          ...list.filter((item) => item.symbol !== symbol),
          ...(nextShares > 0.0001 ? [{ symbol, shares: nextShares }] : []),
        ];
        set({
          activeCusd: get().activeCusd + (side === "buy" ? -notional : notional),
          holdings,
          activity: pushActivity(get().activity, {
            id: receiptId,
            kind: "stock",
            title: `${side === "buy" ? "Bought" : "Sold"} ${symbol}`,
            subtitle: `${shares.toFixed(4)} shares`,
            amountCusd: side === "buy" ? -notional : notional,
            at: new Date().toISOString(),
            receiptId,
            status: "complete",
          }),
        });
      },
      applySwap: ({ fromId, toId, fromAmount, toAmount, usd, receiptId }) => {
        const tokens = { ...(get().tokenBalances ?? DEFAULT_TOKEN_BALANCES) };
        let activeCusd = get().activeCusd;
        if (fromId === "cash") activeCusd -= usd;
        else tokens[fromId] = Math.max(0, (tokens[fromId] ?? 0) - fromAmount);
        if (toId === "cash") activeCusd += usd;
        else tokens[toId] = (tokens[toId] ?? 0) + toAmount;
        set({
          activeCusd,
          tokenBalances: tokens,
          activity: pushActivity(get().activity, {
            id: receiptId,
            kind: "swap",
            title: `Swapped ${fromId === "cash" ? "cash" : fromId} → ${toId === "cash" ? "cash" : toId}`,
            subtitle: "Instant swap · sponsored",
            amountCusd: 0,
            at: new Date().toISOString(),
            receiptId,
            status: "complete",
          }),
        });
      },
    }),
    {
      name: "zip-wallet-cc3",
      partialize: (state) => ({
        hideBalances: state.hideBalances,
        holdings: state.holdings ?? [],
        activity: state.activity,
        loan: state.loan,
      }),
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<WalletState>;
        return {
          ...current,
          hideBalances: saved.hideBalances ?? current.hideBalances,
          holdings: saved.holdings ?? current.holdings ?? [],
          activity: saved.activity ?? current.activity,
          loan: saved.loan === undefined ? current.loan : saved.loan,
        };
      },
    },
  ),
);

export function vaultTotal(vaults: VaultPosition[]) {
  return vaults.reduce((sum, vault) => sum + vault.depositedCusd, 0);
}
