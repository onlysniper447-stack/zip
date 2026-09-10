import { defineChain } from "viem";

export const creditcoin = defineChain({
  id: 102030,
  name: "Creditcoin",
  nativeCurrency: { name: "Creditcoin", symbol: "CTC", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://mainnet3.creditcoin.network"] },
  },
  blockExplorers: {
    default: { name: "Creditcoin Explorer", url: "https://creditcoin.blockscout.com" },
  },
});

export const creditcoinTestnet = defineChain({
  id: 102031,
  name: "Creditcoin Testnet",
  nativeCurrency: { name: "Creditcoin", symbol: "CTC", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.cc3-testnet.creditcoin.network"] },
  },
  blockExplorers: {
    default: {
      name: "Creditcoin Testnet Explorer",
      url: "https://creditcoin-testnet.blockscout.com",
    },
  },
});

export const ZIP_NETWORK_LABEL = "ZIP Network";
export const CREDIT_BUREAU_LABEL = "Verified on Creditcoin";
