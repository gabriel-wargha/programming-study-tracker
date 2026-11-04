import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PGlite loads its WebAssembly and data files from its package at runtime.
  serverExternalPackages: ["@electric-sql/pglite"],
};

export default nextConfig;
