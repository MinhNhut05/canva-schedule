import type { NextConfig } from "next";

// ---------------------------------------------------------------------------
// SAFE-01: Fail fast if required server secrets are missing.
// Inline here because next.config.ts is transpiled separately by Next.js
// and cannot import from src/lib/* reliably.
// The canonical env module is src/lib/env.ts (with server-only guard).
// ---------------------------------------------------------------------------
function validateStartupEnv(): void {
  // Reject NEXT_PUBLIC_ secret aliases
  const forbiddenKeys = [
    "NEXT_PUBLIC_AUTH_SECRET",
    "NEXT_PUBLIC_AI_API_KEY",
    "NEXT_PUBLIC_AI_API_URL",
    "NEXT_PUBLIC_CANVA_CLIENT_ID",
    "NEXT_PUBLIC_CANVA_CLIENT_SECRET",
    "NEXT_PUBLIC_CANVA_ACCESS_TOKEN",
    "NEXT_PUBLIC_CANVA_REFRESH_TOKEN",
    "NEXT_PUBLIC_CANVA_TEMPLATE_ID",
    "NEXT_PUBLIC_DATABASE_URL",
  ];
  const leaked = forbiddenKeys.filter((key) => process.env[key] !== undefined);
  if (leaked.length > 0) {
    throw new Error(
      `SAFE-01 violation: Secrets must not use NEXT_PUBLIC_ prefix. ` +
        `Remove these env vars: ${leaked.join(", ")}`
    );
  }

  // Require startup secrets
  const missing: string[] = [];
  if (!process.env.AUTH_SECRET) missing.push("AUTH_SECRET");
  if (!process.env.DATABASE_URL) missing.push("DATABASE_URL");

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n` +
        missing.map((v) => `  - ${v}`).join("\n") +
        `\n\nCopy .env.example to .env and fill in the values.`
    );
  }
}

validateStartupEnv();

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    serverActions: {
      bodySizeLimit: "32mb",
    },
    middlewareClientMaxBodySize: "32mb",
  },
};

export default nextConfig;
