import { http, createConfig } from "wagmi";
import { injected } from "wagmi/connectors";
import { creditcoinTestnet } from "@/lib/creditcoin";
import { TESTNET_RPC } from "@/lib/testnet/config";

export const wagmiConfig = createConfig({
  chains: [creditcoinTestnet],
  connectors: [injected()],
  transports: {
    [creditcoinTestnet.id]: http(TESTNET_RPC),
  },
  ssr: true,
});
