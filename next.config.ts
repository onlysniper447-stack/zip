import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["wagmi", "viem"],
  serverExternalPackages: ["@gluwa/usc-sdk", "ethers"],
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
