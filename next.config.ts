import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PGlite loads its WebAssembly and data files from its package at runtime.
  serverExternalPackages: ["@electric-sql/pglite"],
  // Phones show the main nav as a bottom tab bar; keep the dev-only indicator out of its way.
  devIndicators: { position: "top-right" },
};

export default nextConfig;
