import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock "server-only" so tests run in Node environment
vi.mock("server-only", () => ({}));

// Mock getCanvaConfig so tests don't require real env vars
vi.mock("@/lib/canva/server-client", () => ({
  getCanvaConfig: vi.fn(() => ({
    clientId: "test-client-id",
    clientSecret: "test-client-secret",
    accessToken: "test-access-token",
    refreshToken: "test-refresh-token",
    templates: {
      ONE_DAY_ITINERARY: "template-1day-itinerary",
      ONE_DAY_MENU: "template-1day-menu",
      TWO_DAY_ITINERARY: "template-2day-itinerary",
      TWO_DAY_MENU: "template-2day-menu",
    },
  })),
}));

import * as serverClient from "@/lib/canva/server-client";
import {
  resolveTemplateId,
  resolveTemplatePair,
  getTemplatePairLabel,
} from "@/lib/canva/template-resolver";

describe("resolveTemplateId", () => {
  it("returns ONE_DAY_ITINERARY template ID", () => {
    expect(resolveTemplateId("ONE_DAY", "ITINERARY")).toBe(
      "template-1day-itinerary"
    );
  });

  it("returns ONE_DAY_MENU template ID", () => {
    expect(resolveTemplateId("ONE_DAY", "MENU")).toBe("template-1day-menu");
  });

  it("returns TWO_DAY_ITINERARY template ID", () => {
    expect(resolveTemplateId("TWO_DAY", "ITINERARY")).toBe(
      "template-2day-itinerary"
    );
  });

  it("returns TWO_DAY_MENU template ID", () => {
    expect(resolveTemplateId("TWO_DAY", "MENU")).toBe("template-2day-menu");
  });

  it("throws when template config is missing", () => {
    vi.mocked(serverClient.getCanvaConfig).mockReturnValueOnce({
      clientId: "test",
      clientSecret: "test",
      accessToken: "test",
      refreshToken: "test",
      templates: {
        ONE_DAY_ITINERARY: "",
        ONE_DAY_MENU: "template-1day-menu",
        TWO_DAY_ITINERARY: "template-2day-itinerary",
        TWO_DAY_MENU: "template-2day-menu",
      },
    });
    expect(() => resolveTemplateId("ONE_DAY", "ITINERARY")).toThrow(
      "Missing template config for ONE_DAY_ITINERARY"
    );
  });
});

describe("resolveTemplatePair", () => {
  it("returns full pair for ONE_DAY with correct label", () => {
    const pair = resolveTemplatePair("ONE_DAY");
    expect(pair.duration).toBe("ONE_DAY");
    expect(pair.itineraryTemplateId).toBe("template-1day-itinerary");
    expect(pair.menuTemplateId).toBe("template-1day-menu");
    expect(pair.displayLabel).toBe("Tour 1 ngày");
  });

  it("returns full pair for TWO_DAY with correct label", () => {
    const pair = resolveTemplatePair("TWO_DAY");
    expect(pair.duration).toBe("TWO_DAY");
    expect(pair.itineraryTemplateId).toBe("template-2day-itinerary");
    expect(pair.menuTemplateId).toBe("template-2day-menu");
    expect(pair.displayLabel).toBe("Tour 2 ngày");
  });
});

describe("getTemplatePairLabel", () => {
  it("returns 'Tour 1 ngày' for ONE_DAY", () => {
    expect(getTemplatePairLabel("ONE_DAY")).toBe("Tour 1 ngày");
  });

  it("returns 'Tour 2 ngày' for TWO_DAY", () => {
    expect(getTemplatePairLabel("TWO_DAY")).toBe("Tour 2 ngày");
  });
});

