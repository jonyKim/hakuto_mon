import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ['http://localhost:3080', 'https://mon.the-market.io'],
};

export default nextConfig;
