import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { getValidAccessToken } = vi.hoisted(() => ({
  getValidAccessToken: vi.fn(),
}));

vi.mock("@/lib/canva/oauth", () => ({
  getValidAccessToken,
}));

import { CanvaRateLimitError, canvaFetch } from "@/lib/canva/client";

describe("canvaFetch", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("adds Authorization header with Bearer token", async () => {
    getValidAccessToken.mockResolvedValue("token-1");
    fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));

    await canvaFetch("/designs/abc");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("https://api.canva.com/rest/v1/designs/abc");
    const headers = new Headers(init?.headers);
    expect(headers.get("Authorization")).toBe("Bearer token-1");
    expect(headers.get("Content-Type")).toBe("application/json");
  });

  it("retries once on 401 and forces token refresh", async () => {
    getValidAccessToken.mockResolvedValueOnce("expired-token");
    getValidAccessToken.mockResolvedValueOnce("fresh-token");
    fetchMock
      .mockResolvedValueOnce(new Response("unauthorized", { status: 401 }))
      .mockResolvedValueOnce(new Response("{}", { status: 200 }));

    const response = await canvaFetch("/designs/abc");

    expect(response.status).toBe(200);
    expect(getValidAccessToken).toHaveBeenNthCalledWith(1, {
      forceRefresh: undefined,
    });
    expect(getValidAccessToken).toHaveBeenNthCalledWith(2, {
      forceRefresh: true,
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not retry non-401 errors", async () => {
    getValidAccessToken.mockResolvedValue("token-1");
    fetchMock.mockResolvedValue(new Response("server error", { status: 500 }));

    const response = await canvaFetch("/designs/abc");

    expect(response.status).toBe(500);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(getValidAccessToken).toHaveBeenCalledTimes(1);
  });

  it("throws CanvaRateLimitError with Retry-After cooldown", async () => {
    getValidAccessToken.mockResolvedValue("token-1");
    fetchMock.mockResolvedValue(
      new Response("busy", {
        status: 429,
        headers: { "Retry-After": "120" },
      })
    );

    await expect(canvaFetch("/designs/abc")).rejects.toMatchObject({
      name: "CanvaRateLimitError",
      cooldownSeconds: 120,
    });
  });

  it("defaults rate-limit cooldown to 60 seconds when Retry-After is missing", async () => {
    getValidAccessToken.mockResolvedValue("token-1");
    fetchMock.mockResolvedValue(new Response("busy", { status: 429 }));

    await expect(canvaFetch("/designs/abc")).rejects.toEqual(
      new CanvaRateLimitError(60)
    );
  });
});
