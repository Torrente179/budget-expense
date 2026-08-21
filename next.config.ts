import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep deterministic design-review captures free of development chrome.
  devIndicators:
    process.env.ENABLE_UP_DESIGN_REVIEW === "true" ? false : undefined,
};

export default nextConfig;
