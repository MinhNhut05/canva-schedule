import "server-only";

import { getValidAccessToken } from "./oauth";

const CANVA_API_BASE =
  process.env.CANVA_API_BASE_URL || "https://api.canva.com/rest/v1";

export class CanvaRateLimitError extends Error {
  constructor(public cooldownSeconds: number) {
    super(`Canva rate limited. Retry after ${cooldownSeconds} seconds.`);
    this.name = "CanvaRateLimitError";
  }
}

export async function canvaFetch(
  path: string,
  init?: RequestInit & { retried?: boolean; forceRefreshToken?: boolean }
): Promise<Response> {
  const token = await getValidAccessToken({
    forceRefresh: init?.forceRefreshToken,
  });
  const url = path.startsWith("http") ? path : `${CANVA_API_BASE}${path}`;
  const headers = new Headers(init?.headers);

  headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (response.status === 429) {
    const retryAfter = response.headers.get("Retry-After");
    const cooldownSeconds = retryAfter ? Number.parseInt(retryAfter, 10) : 60;
    throw new CanvaRateLimitError(Number.isNaN(cooldownSeconds) ? 60 : cooldownSeconds);
  }

  if (response.status === 401 && !init?.retried) {
    return canvaFetch(path, {
      ...init,
      retried: true,
      forceRefreshToken: true,
    });
  }

  return response;
}
