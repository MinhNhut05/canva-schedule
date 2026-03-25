import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { findFirst, upsert, getCanvaConfig } = vi.hoisted(() => ({
  findFirst: vi.fn(),
  upsert: vi.fn(),
  getCanvaConfig: vi.fn(() => ({
    clientId: "test-client-id",
    clientSecret: "test-client-secret",
    accessToken: "test-access-token",
    refreshToken: "env-refresh-token",
    templates: {
      ONE_DAY_ITINERARY: "template-1day-itinerary",
      ONE_DAY_MENU: "template-1day-menu",
      TWO_DAY_ITINERARY: "template-2day-itinerary",
      TWO_DAY_MENU: "template-2day-menu",
    },
  })),
}));

vi.mock("@/lib/db", () => ({
  db: {
    canvaToken: {
      findFirst,
      upsert,
    },
  },
}));

vi.mock("@/lib/canva/server-client", () => ({
  getCanvaConfig,
}));

import { getValidAccessToken } from "@/lib/canva/oauth";

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

describe("getValidAccessToken", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", fetchMock);
    upsert.mockResolvedValue(undefined);
  });

  it("returns stored token when not expired", async () => {
    findFirst.mockResolvedValue({
      id: "token-1",
      accessToken: "stored-access-token",
      refreshToken: "stored-refresh-token",
      expiresAt: new Date(Date.now() + 5 * 60_000),
    });

    await expect(getValidAccessToken()).resolves.toBe("stored-access-token");
    expect(fetchMock).not.toHaveBeenCalled();
    expect(upsert).not.toHaveBeenCalled();
  });

  it("calls refresh endpoint when token is expired", async () => {
    findFirst.mockResolvedValue({
      id: "token-1",
      accessToken: "expired-access-token",
      refreshToken: "stored-refresh-token",
      expiresAt: new Date(Date.now() - 1_000),
    });
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(createTokenResponse()), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    await expect(getValidAccessToken()).resolves.toBe("new-access-token");

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
    findFirst.mockResolvedValue({
      id: "token-1",
      accessToken: "expired-access-token",
      refreshToken: "stored-refresh-token",
      expiresAt: new Date(Date.now() - 1_000),
    });
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
          tokenType: "Bearer",
          scope: "design:content:write",
        }),
      })
    );
  });

  it("throws meaningful error on refresh failure", async () => {
    findFirst.mockResolvedValue({
      id: "token-1",
      accessToken: "expired-access-token",
      refreshToken: "stored-refresh-token",
      expiresAt: new Date(Date.now() - 1_000),
    });
    fetchMock.mockResolvedValue(
      new Response("invalid_grant", {
        status: 401,
      })
    );

    await expect(getValidAccessToken()).rejects.toThrow(
      "Canva token refresh failed (401): invalid_grant"
    );
  });
});
