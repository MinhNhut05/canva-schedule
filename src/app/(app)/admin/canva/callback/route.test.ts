import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));
vi.mock("@/lib/canva/oauth", () => ({
  connectCanvaWithAuthorizationCode: vi.fn(),
}));
vi.mock("../actions", () => ({
  getCanvaOAuthSession: vi.fn(),
}));

import { auth } from "@/lib/auth";
import { connectCanvaWithAuthorizationCode } from "@/lib/canva/oauth";

import { getCanvaOAuthSession } from "../actions";
import { GET } from "./route";

describe("Canva OAuth callback", () => {
  const originalAuthUrl = process.env.AUTH_URL;

  beforeEach(() => {
    process.env.AUTH_URL = "https://trusted.example.com";
    vi.mocked(auth as unknown as () => Promise<unknown>).mockResolvedValue({
      user: { id: "admin-1", role: "admin" },
      expires: "2099-01-01T00:00:00.000Z",
    });
    vi.mocked(getCanvaOAuthSession).mockResolvedValue({
      state: "expected-state",
      verifier: "verifier",
      redirectUri: "https://trusted.example.com/admin/canva/callback",
    });
    vi.mocked(connectCanvaWithAuthorizationCode).mockResolvedValue(undefined);
  });

  afterEach(() => {
    if (originalAuthUrl === undefined) {
      delete process.env.AUTH_URL;
    } else {
      process.env.AUTH_URL = originalAuthUrl;
    }
  });

  it("redirects to the canonical origin instead of the request host", async () => {
    const url = new URL(
      "https://attacker.example/admin/canva/callback?code=code&state=expected-state",
    );
    const request = { url: url.toString(), nextUrl: url };

    const response = await GET(request as never);

    expect(response.headers.get("location")).toBe(
      "https://trusted.example.com/admin/canva?connected=1",
    );
  });

  it("redirects a non-admin to login on the canonical origin", async () => {
    vi.mocked(auth as unknown as () => Promise<unknown>).mockResolvedValue({
      user: { id: "member-1", role: "member" },
      expires: "2099-01-01T00:00:00.000Z",
    });
    const url = new URL("https://attacker.example/admin/canva/callback");

    const response = await GET({ url: url.toString(), nextUrl: url } as never);

    expect(response.headers.get("location")).toBe(
      "https://trusted.example.com/login",
    );
  });
});
