import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.convex.cloud" },
    ],
  },
  transpilePackages: ["@chenglou/pretext"],
};

export default nextConfig;
