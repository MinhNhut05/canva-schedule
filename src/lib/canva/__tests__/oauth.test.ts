import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { findFirst, upsert, update, executeRaw, transaction, getCanvaConfig } = vi.hoisted(() => {
  const findFirst = vi.fn();
  const upsert = vi.fn();
  const update = vi.fn();
  const executeRaw = vi.fn();

  return {
    findFirst,
    upsert,
    update,
    executeRaw,
    transaction: vi.fn((callback) =>
      callback({
        $executeRaw: executeRaw,
        canvaToken: {
          findFirst,
          upsert,
          update,
        },
      }),
    ),
    getCanvaConfig: vi.fn(() => ({
      clientId: "test-client-id",
      clientSecret: "test-client-secret",
      accessToken: undefined,
      refreshToken: "env-refresh-token",
    })),
  };
});

vi.mock("@/lib/db", () => ({
  db: {
    $transaction: transaction,
    canvaToken: {
      findFirst,
      upsert,
      update,
    },
  },
}));

vi.mock("@/lib/canva/server-client", () => ({
  getCanvaConfig,
}));

import { CanvaReconnectRequiredError, getValidAccessToken } from "@/lib/canva/oauth";

function createTokenResponse(overrides?: Partial<Record<string, unknown>>) {
  return {
    access_token: "new-access-token",
    refresh_token: "rotated-refresh-token",
    expires_in: 3600,
    token_type: "Bearer",
    scope: "design:content:write",
    ...overrides,
  };
}

function createStoredToken(overrides?: Partial<Record<string, unknown>>) {
  return {
    id: "token-1",
    accessToken: "stored-access-token",
    refreshToken: "stored-refresh-token",
    expiresAt: new Date(Date.now() + 10 * 60_000),
    status: "ACTIVE",
    ...overrides,
  };
}

describe("getValidAccessToken", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", fetchMock);
    executeRaw.mockResolvedValue(1);
    upsert.mockResolvedValue(undefined);
    update.mockResolvedValue(undefined);
  });

  it("returns stored token when not expired", async () => {
    findFirst.mockResolvedValue(createStoredToken());

    await expect(getValidAccessToken()).resolves.toBe("stored-access-token");
    expect(fetchMock).not.toHaveBeenCalled();
    expect(transaction).not.toHaveBeenCalled();
    expect(upsert).not.toHaveBeenCalled();
  });

  it("calls refresh endpoint when token is expired", async () => {
    findFirst.mockResolvedValue(
      createStoredToken({
        accessToken: "expired-access-token",
        expiresAt: new Date(Date.now() - 1_000),
      }),
    );
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(createTokenResponse()), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    await expect(getValidAccessToken()).resolves.toBe("new-access-token");

    expect(executeRaw).toHaveBeenCalled();
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "token-1" },
        data: expect.objectContaining({ status: "REFRESHING" }),
      }),
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("https://api.canva.com/rest/v1/oauth/token");
    expect(init?.method).toBe("POST");
    expect(init?.body).toBe(
      new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: "stored-refresh-token",
      }).toString()
    );
  });

  it("calls refresh endpoint when no token is stored", async () => {
    findFirst.mockResolvedValue(null);
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(createTokenResponse()), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    await expect(getValidAccessToken()).resolves.toBe("new-access-token");

    const [, init] = fetchMock.mock.calls[0]!;
    expect(init?.body).toBe(
      new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: "env-refresh-token",
      }).toString()
    );
  });

  it("persists rotated refresh token after refresh", async () => {
    findFirst.mockResolvedValue(
      createStoredToken({
        accessToken: "expired-access-token",
        expiresAt: new Date(Date.now() - 1_000),
      }),
    );
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify(
          createTokenResponse({
            access_token: "rotated-access-token",
            refresh_token: "rotated-refresh-token-2",
          })
        ),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      )
    );

    await getValidAccessToken();

    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "token-1" },
        update: expect.objectContaining({
          accessToken: "rotated-access-token",
          refreshToken: "rotated-refresh-token-2",
          status: "ACTIVE",
          refreshLockedUntil: null,
          lastRefreshError: null,
          tokenType: "Bearer",
          scope: "design:content:write",
        }),
      })
    );
  });

  it("marks token as needing reconnect on revoked lineage", async () => {
    findFirst.mockResolvedValue(
      createStoredToken({
        accessToken: "expired-access-token",
        expiresAt: new Date(Date.now() - 1_000),
      }),
    );
    fetchMock.mockResolvedValue(
      new Response('{"error":"invalid_grant","error_description":"Token lineage has been revoked"}', {
        status: 400,
      })
    );

    await expect(getValidAccessToken()).rejects.toBeInstanceOf(CanvaReconnectRequiredError);
    expect(update).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: { id: "token-1" },
        data: expect.objectContaining({
          status: "NEEDS_RECONNECT",
          refreshLockedUntil: null,
        }),
      }),
    );
  });

  it("deduplicates concurrent refresh calls (mutex)", async () => {
    findFirst.mockResolvedValue(
      createStoredToken({
        accessToken: "expired-access-token",
        expiresAt: new Date(Date.now() - 1_000),
      }),
    );

    fetchMock.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve(
                new Response(JSON.stringify(createTokenResponse()), {
                  status: 200,
                  headers: { "Content-Type": "application/json" },
                })
              ),
            50
          )
        )
    );

    const [r1, r2, r3] = await Promise.all([
      getValidAccessToken({ forceRefresh: true }),
      getValidAccessToken({ forceRefresh: true }),
      getValidAccessToken({ forceRefresh: true }),
    ]);

    expect(r1).toBe("new-access-token");
    expect(r2).toBe("new-access-token");
    expect(r3).toBe("new-access-token");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(transaction).toHaveBeenCalledTimes(1);
  });
});
