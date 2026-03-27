import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock "server-only" so tests run in Node environment
vi.mock("server-only", () => ({}));

vi.mock("@/lib/db", () => ({
  db: {
    canvaTemplate: {
      findUnique: vi.fn(),
    },
  },
}));

import { db } from "@/lib/db";
import { resolveTemplateId, resolveTemplatePair, getTemplatePairLabel } from "@/lib/canva/template-resolver";

describe("resolveTemplateId (DB-based)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns templateId from active DB record", async () => {
    vi.mocked(db.canvaTemplate.findUnique).mockResolvedValue({
      templateId: "DAGtest123",
      isActive: true,
    } as any);

    const result = await resolveTemplateId("ONE_DAY", "ITINERARY");

    expect(result).toBe("DAGtest123");
    expect(db.canvaTemplate.findUnique).toHaveBeenCalledWith({
      where: {
        tourDuration_artifactType: {
          tourDuration: "ONE_DAY",
          artifactType: "ITINERARY",
        },
      },
    });
  });

  it("throws when template not found", async () => {
    vi.mocked(db.canvaTemplate.findUnique).mockResolvedValue(null);

    await expect(resolveTemplateId("ONE_DAY", "MENU")).rejects.toThrow(
      "Missing active Canva template for ONE_DAY_MENU"
    );
  });

  it("throws when template is inactive", async () => {
    vi.mocked(db.canvaTemplate.findUnique).mockResolvedValue({
      templateId: "DAGtest456",
      isActive: false,
    } as any);

    await expect(resolveTemplateId("TWO_DAY", "ITINERARY")).rejects.toThrow(
      "Missing active Canva template"
    );
  });
});

describe("resolveTemplatePair", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns full pair for ONE_DAY with correct label", async () => {
    vi.mocked(db.canvaTemplate.findUnique).mockResolvedValue({
      templateId: "template-1day-itinerary",
      isActive: true,
    } as any);

    const pair = await resolveTemplatePair("ONE_DAY");
    expect(pair.duration).toBe("ONE_DAY");
    expect(pair.displayLabel).toBe("Tour 1 ngày");
  });

  it("returns full pair for TWO_DAY with correct label", async () => {
    vi.mocked(db.canvaTemplate.findUnique).mockResolvedValue({
      templateId: "template-2day-itinerary",
      isActive: true,
    } as any);

    const pair = await resolveTemplatePair("TWO_DAY");
    expect(pair.duration).toBe("TWO_DAY");
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
