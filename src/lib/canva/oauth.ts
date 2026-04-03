import "server-only";

import { db } from "@/lib/db";

import { getCanvaConfig } from "./server-client";

const CANVA_TOKEN_URL =
  process.env.CANVA_TOKEN_URL || "https://api.canva.com/rest/v1/oauth/token";
const TOKEN_EXPIRY_BUFFER_MS = 60_000;

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope?: string;
}

// ---------------------------------------------------------------------------
// Mutex: ensures only one refresh runs at a time.
// Canva refresh tokens are single-use — if two requests try to refresh
// concurrently with the same token, the second one will fail and the
// refresh token is permanently lost (requiring a full re-OAuth).
// ---------------------------------------------------------------------------
let activeRefreshPromise: Promise<string> | null = null;

export async function getValidAccessToken(options?: {
  forceRefresh?: boolean;
}): Promise<string> {
  const stored = await db.canvaToken.findFirst({
    orderBy: { updatedAt: "desc" },
  });

  if (
    !options?.forceRefresh &&
    stored &&
    stored.expiresAt.getTime() > Date.now() + TOKEN_EXPIRY_BUFFER_MS
  ) {
    return stored.accessToken;
  }

  // If another request is already refreshing, wait for it instead of
  // starting a second refresh (which would invalidate the token).
  if (activeRefreshPromise) {
    return activeRefreshPromise;
  }

  // Start refresh and let other callers share the same promise.
  activeRefreshPromise = performRefresh(stored?.refreshToken ?? null, stored?.id ?? null)
    .finally(() => {
      activeRefreshPromise = null;
    });

  return activeRefreshPromise;
}

async function performRefresh(
  storedRefreshToken: string | null,
  storedId: string | null,
): Promise<string> {
  const refreshToken = storedRefreshToken ?? getCanvaConfig().refreshToken;

  if (!refreshToken) {
    throw new Error("Canva refresh token is not configured");
  }

  const newTokens = await refreshAccessToken(refreshToken);
  const expiresAt = new Date(Date.now() + newTokens.expires_in * 1000);

  await db.canvaToken.upsert({
    where: { id: storedId ?? "seed" },
    create: {
      accessToken: newTokens.access_token,
      refreshToken: newTokens.refresh_token,
      expiresAt,
      tokenType: newTokens.token_type,
      scope: newTokens.scope ?? null,
    },
    update: {
      accessToken: newTokens.access_token,
      refreshToken: newTokens.refresh_token,
      expiresAt,
      tokenType: newTokens.token_type,
      scope: newTokens.scope ?? null,
    },
  });

  return newTokens.access_token;
}

async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const config = getCanvaConfig();
  const params = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const response = await fetch(CANVA_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "unknown");
    throw new Error(
      `Canva token refresh failed (${response.status}): ${errorText}`
    );
  }

  return (await response.json()) as TokenResponse;
}
