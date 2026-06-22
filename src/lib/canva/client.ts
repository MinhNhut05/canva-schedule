import "server-only";

import { CanvaRateLimitError } from "./errors";
import { getValidAccessToken } from "./oauth";

const CANVA_API_BASE =
  process.env.CANVA_API_BASE_URL || "https://api.canva.com/rest/v1";

export { CanvaRateLimitError };

export async function canvaFetch(
  path: string,
  init?: RequestInit & {
    retried?: boolean;
    forceRefreshToken?: boolean;
    accessTokenOverride?: string;
  }
): Promise<Response> {
  const {
    retried,
    forceRefreshToken,
    accessTokenOverride,
    ...requestInit
  } = init ?? {};
  const token =
    accessTokenOverride ??
    (await getValidAccessToken({
      forceRefresh: forceRefreshToken,
    }));
  const url = path.startsWith("http") ? path : `${CANVA_API_BASE}${path}`;
  const headers = new Headers(requestInit.headers);

  headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...requestInit,
    headers,
    cache: "no-store",
  });

  if (response.status === 429) {
    const retryAfter = response.headers.get("Retry-After");
    const cooldownSeconds = retryAfter ? Number.parseInt(retryAfter, 10) : 60;
    throw new CanvaRateLimitError(Number.isNaN(cooldownSeconds) ? 60 : cooldownSeconds);
  }

  if (response.status === 401 && !retried) {
    const latestKnownToken = await getValidAccessToken();
    const shouldForceRefresh = latestKnownToken === token;

    return canvaFetch(path, {
      ...requestInit,
      retried: true,
      forceRefreshToken: shouldForceRefresh,
      accessTokenOverride: shouldForceRefresh ? undefined : latestKnownToken,
    });
  }

  return response;
}
