import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emits `.next/standalone` with a self-contained server and only the
  // node_modules it actually needs, which is what the Docker image runs.
  // Harmless for `next dev` / `next start`.
  output: "standalone",
};

export default nextConfig;
