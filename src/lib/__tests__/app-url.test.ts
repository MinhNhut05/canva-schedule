import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { getAppUrl } from "@/lib/env";

const originalAuthUrl = process.env.AUTH_URL;

afterEach(() => {
  if (originalAuthUrl === undefined) {
    delete process.env.AUTH_URL;
  } else {
    process.env.AUTH_URL = originalAuthUrl;
  }
});

describe("getAppUrl", () => {
  it("returns the canonical origin without a path", () => {
    process.env.AUTH_URL = "https://canva.devteamos.me/auth?source=test";

    expect(getAppUrl()).toBe("https://canva.devteamos.me");
  });

  it("rejects a missing canonical origin", () => {
    delete process.env.AUTH_URL;

    expect(() => getAppUrl()).toThrow();
  });

  it("rejects non-http protocols", () => {
    process.env.AUTH_URL = "javascript:alert(1)";

    expect(() => getAppUrl()).toThrow("AUTH_URL must use http or https");
  });

  it("requires https in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    process.env.AUTH_URL = "http://canva.devteamos.me";

    expect(() => getAppUrl()).toThrow("AUTH_URL must use https in production");
    vi.unstubAllEnvs();
  });
});
