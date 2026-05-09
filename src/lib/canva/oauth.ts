import "server-only";

import { randomBytes, createHash } from "node:crypto";

import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";

import { getCanvaConfig } from "./server-client";

const CANVA_AUTH_URL = "https://www.canva.com/api/oauth/authorize";
const CANVA_TOKEN_URL =
  process.env.CANVA_TOKEN_URL || "https://api.canva.com/rest/v1/oauth/token";
const TOKEN_EXPIRY_BUFFER_MS = 5 * 60_000;
const REFRESH_LOCK_ID = 738_201_245;
const REFRESH_LOCK_TIMEOUT_MS = 2 * 60_000;
const SCOPES =
  "design:content:write design:content:read design:meta:read brandtemplate:meta:read brandtemplate:content:read";

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope?: string;
}

export class CanvaReconnectRequiredError extends Error {
  constructor(message = "Canva cần kết nối lại. Vào trang quản trị Canva để đăng nhập lại.") {
    super(message);
    this.name = "CanvaReconnectRequiredError";
  }
}

export type CanvaTokenStatus = {
  isConnected: boolean;
  status: string;
  expiresAt: Date | null;
  cooldownUntil: Date | null;
  lastRefreshAttemptAt: Date | null;
  lastRefreshError: string | null;
  updatedAt: Date | null;
};

let activeRefreshPromise: Promise<string> | null = null;

export async function getValidAccessToken(options?: {
  forceRefresh?: boolean;
}): Promise<string> {
  const stored = await getLatestToken();

  if (stored?.status === "NEEDS_RECONNECT") {
    throw new CanvaReconnectRequiredError();
  }

  if (
    !options?.forceRefresh &&
    stored &&
    stored.expiresAt.getTime() > Date.now() + TOKEN_EXPIRY_BUFFER_MS
  ) {
    return stored.accessToken;
  }

  if (activeRefreshPromise) {
    return activeRefreshPromise;
  }

  activeRefreshPromise = refreshWithDatabaseLock().finally(() => {
    activeRefreshPromise = null;
  });

  return activeRefreshPromise;
}

export async function getCanvaTokenStatus(): Promise<CanvaTokenStatus> {
  const token = await getLatestToken();

  return {
    isConnected: Boolean(token && token.status === "ACTIVE"),
    status: token?.status ?? "NEEDS_RECONNECT",
    expiresAt: token?.expiresAt ?? null,
    cooldownUntil: token?.cooldownUntil ?? null,
    lastRefreshAttemptAt: token?.lastRefreshAttemptAt ?? null,
    lastRefreshError: token?.lastRefreshError ?? null,
    updatedAt: token?.updatedAt ?? null,
  };
}

export function createCanvaAuthorizationUrl(redirectUri: string) {
  const config = getCanvaConfig();
  const verifier = base64url(randomBytes(32));
  const challenge = base64url(createHash("sha256").update(verifier).digest());
  const state = base64url(randomBytes(16));
  const authorizeUrl = new URL(CANVA_AUTH_URL);

  authorizeUrl.searchParams.set("client_id", config.clientId);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("scope", SCOPES);
  authorizeUrl.searchParams.set("code_challenge", challenge);
  authorizeUrl.searchParams.set("code_challenge_method", "S256");
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);

  return { authorizeUrl: authorizeUrl.toString(), verifier, state };
}

export async function connectCanvaWithAuthorizationCode(input: {
  code: string;
  codeVerifier: string;
  redirectUri: string;
}) {
  const tokens = await exchangeAuthorizationCode(input);
  await persistTokens(tokens);
}

async function refreshWithDatabaseLock(): Promise<string> {
  return db.$transaction(
    async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${REFRESH_LOCK_ID})`;

      const stored = await tx.canvaToken.findFirst({
        orderBy: { updatedAt: "desc" },
      });

      if (stored?.status === "NEEDS_RECONNECT") {
        throw new CanvaReconnectRequiredError();
      }

      if (
        stored &&
        stored.expiresAt.getTime() > Date.now() + TOKEN_EXPIRY_BUFFER_MS
      ) {
        return stored.accessToken;
      }

      const refreshToken = stored?.refreshToken ?? getCanvaConfig().refreshToken;

      if (!refreshToken) {
        await markReconnectRequired(tx, stored?.id ?? null, "Canva refresh token is not configured");
        throw new CanvaReconnectRequiredError("Canva refresh token is not configured");
      }

      const lockedUntil = new Date(Date.now() + REFRESH_LOCK_TIMEOUT_MS);

      if (stored) {
        await tx.canvaToken.update({
          where: { id: stored.id },
          data: {
            status: "REFRESHING",
            refreshLockedUntil: lockedUntil,
            lastRefreshAttemptAt: new Date(),
            lastRefreshError: null,
          },
        });
      }

      try {
        const newTokens = await refreshAccessToken(refreshToken);
        const expiresAt = new Date(Date.now() + newTokens.expires_in * 1000);

        await tx.canvaToken.upsert({
          where: { id: stored?.id ?? "seed" },
          create: {
            accessToken: newTokens.access_token,
            refreshToken: newTokens.refresh_token,
            expiresAt,
            status: "ACTIVE",
            refreshLockedUntil: null,
            lastRefreshAttemptAt: new Date(),
            lastRefreshError: null,
            tokenType: newTokens.token_type,
            scope: newTokens.scope ?? null,
          },
          update: {
            accessToken: newTokens.access_token,
            refreshToken: newTokens.refresh_token,
            expiresAt,
            status: "ACTIVE",
            refreshLockedUntil: null,
            lastRefreshAttemptAt: new Date(),
            lastRefreshError: null,
            tokenType: newTokens.token_type,
            scope: newTokens.scope ?? null,
          },
        });

        return newTokens.access_token;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Canva token refresh failed";
        await markReconnectRequired(tx, stored?.id ?? null, message);
        throw isInvalidGrantMessage(message)
          ? new CanvaReconnectRequiredError()
          : error;
      }
    },
    { timeout: REFRESH_LOCK_TIMEOUT_MS + 30_000 },
  );
}

async function persistTokens(tokens: TokenResponse) {
  const existing = await getLatestToken();
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

  await db.canvaToken.upsert({
    where: { id: existing?.id ?? "oauth-seed" },
    create: {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt,
      status: "ACTIVE",
      refreshLockedUntil: null,
      lastRefreshAttemptAt: null,
      lastRefreshError: null,
      tokenType: tokens.token_type,
      scope: tokens.scope ?? null,
    },
    update: {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt,
      status: "ACTIVE",
      refreshLockedUntil: null,
      lastRefreshAttemptAt: null,
      lastRefreshError: null,
      tokenType: tokens.token_type,
      scope: tokens.scope ?? null,
    },
  });
}

async function markReconnectRequired(
  tx: Prisma.TransactionClient,
  tokenId: string | null,
  message: string,
) {
  if (!tokenId) return;

  await tx.canvaToken.update({
    where: { id: tokenId },
    data: {
      status: "NEEDS_RECONNECT",
      refreshLockedUntil: null,
      lastRefreshAttemptAt: new Date(),
      lastRefreshError: message,
    },
  });
}

async function getLatestToken() {
  return db.canvaToken.findFirst({
    orderBy: { updatedAt: "desc" },
  });
}

async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const params = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  return requestToken(params);
}

async function exchangeAuthorizationCode(input: {
  code: string;
  codeVerifier: string;
  redirectUri: string;
}): Promise<TokenResponse> {
  const params = new URLSearchParams({
    grant_type: "authorization_code",
    code: input.code,
    code_verifier: input.codeVerifier,
    redirect_uri: input.redirectUri,
  });

  return requestToken(params);
}

async function requestToken(params: URLSearchParams): Promise<TokenResponse> {
  const config = getCanvaConfig();
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

function base64url(buffer: Buffer): string {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function isInvalidGrantMessage(message: string) {
  return message.includes("invalid_grant") || message.includes("Token lineage");
}
