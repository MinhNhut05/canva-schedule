import "server-only";

import { getCanvaEnv } from "@/lib/env";

/**
 * Server-only Canva client wrapper.
 * This is the only approved access path for Canva credentials.
 */
export function getCanvaConfig() {
  const env = getCanvaEnv();
  return {
    clientId: env.CANVA_CLIENT_ID,
    clientSecret: env.CANVA_CLIENT_SECRET,
    accessToken: env.CANVA_ACCESS_TOKEN,
    refreshToken: env.CANVA_REFRESH_TOKEN,
  };
}
