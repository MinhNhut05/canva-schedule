import "server-only";

import { getAiEnv } from "@/lib/env";

/**
 * Server-only AI client wrapper.
 * This is the only approved access path for AI credentials.
 */
export function getAiConfig() {
  const { AI_API_URL, AI_API_KEY } = getAiEnv();
  return {
    baseUrl: AI_API_URL,
    apiKey: AI_API_KEY,
  };
}
