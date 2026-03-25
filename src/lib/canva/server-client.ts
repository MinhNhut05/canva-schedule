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
    templates: {
      ONE_DAY_ITINERARY: env.CANVA_TEMPLATE_1DAY_ITINERARY,
      ONE_DAY_MENU: env.CANVA_TEMPLATE_1DAY_MENU,
      TWO_DAY_ITINERARY: env.CANVA_TEMPLATE_2DAY_ITINERARY,
      TWO_DAY_MENU: env.CANVA_TEMPLATE_2DAY_MENU,
    },
  };
}
