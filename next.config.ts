import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["wagmi", "viem"],
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
