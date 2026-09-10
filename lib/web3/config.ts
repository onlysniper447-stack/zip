import { http, createConfig } from "wagmi";
import { creditcoin, creditcoinTestnet } from "@/lib/creditcoin";

export const wagmiConfig = createConfig({
  chains: [creditcoin, creditcoinTestnet],
  transports: {
    [creditcoin.id]: http(),
    [creditcoinTestnet.id]: http(),
  },
  ssr: true,
});
