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
import { resolveTemplateId, resolveTemplatePair, resolveTemplate, applyFieldMapping, getTemplatePairLabel } from "@/lib/canva/template-resolver";

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

// --------------------------------------------------------------------------
// resolveTemplate (returns templateId + fieldMapping)
// --------------------------------------------------------------------------
describe("resolveTemplate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns templateId and fieldMapping from active record", async () => {
    const mapping = { title: "ten_chuong_trinh", morning_block: "buoi_sang" };
    vi.mocked(db.canvaTemplate.findUnique).mockResolvedValue({
      templateId: "DAGfieldMap123",
      isActive: true,
      fieldMapping: mapping,
    } as any);

    const result = await resolveTemplate("ONE_DAY", "ITINERARY");

    expect(result.templateId).toBe("DAGfieldMap123");
    expect(result.fieldMapping).toEqual(mapping);
  });

  it("returns empty fieldMapping when stored as empty object", async () => {
    vi.mocked(db.canvaTemplate.findUnique).mockResolvedValue({
      templateId: "DAGempty",
      isActive: true,
      fieldMapping: {},
    } as any);

    const result = await resolveTemplate("TWO_DAY", "MENU");

    expect(result.fieldMapping).toEqual({});
  });

  it("returns empty fieldMapping when stored as null", async () => {
    vi.mocked(db.canvaTemplate.findUnique).mockResolvedValue({
      templateId: "DAGnull",
      isActive: true,
      fieldMapping: null,
    } as any);

    const result = await resolveTemplate("ONE_DAY", "MENU");

    expect(result.fieldMapping).toEqual({});
  });

  it("throws when template not found", async () => {
    vi.mocked(db.canvaTemplate.findUnique).mockResolvedValue(null);

    await expect(resolveTemplate("TWO_DAY", "ITINERARY")).rejects.toThrow(
      "Missing active Canva template for TWO_DAY_ITINERARY"
    );
  });
});

// --------------------------------------------------------------------------
// applyFieldMapping (pure function — no DB)
// --------------------------------------------------------------------------
describe("applyFieldMapping", () => {
  const sampleData = {
    title: { type: "text" as const, text: "Tour ABC" },
    morning_block: { type: "text" as const, text: "Activity content" },
    afternoon_block: { type: "text" as const, text: "Afternoon content" },
  };

  it("identity mapping — keys pass through unchanged", () => {
    const identity = { title: "title", morning_block: "morning_block", afternoon_block: "afternoon_block" };
    const result = applyFieldMapping(sampleData, identity);

    expect(result).toEqual(sampleData);
  });

  it("empty mapping — keys pass through unchanged (fast path)", () => {
    const result = applyFieldMapping(sampleData, {});

    expect(result).toEqual(sampleData);
  });

  it("custom mapping — remaps canonical keys to Canva element names", () => {
    const mapping = {
      title: "ten_tour",
      morning_block: "cot_sang",
      afternoon_block: "cot_chieu",
    };
    const result = applyFieldMapping(sampleData, mapping);

    expect(Object.keys(result).sort()).toEqual(["cot_chieu", "cot_sang", "ten_tour"]);
    expect(result["ten_tour"]).toEqual({ type: "text", text: "Tour ABC" });
    expect(result["cot_sang"]).toEqual({ type: "text", text: "Activity content" });
    expect(result["cot_chieu"]).toEqual({ type: "text", text: "Afternoon content" });
  });

  it("partial mapping — unmapped keys pass through as-is", () => {
    const partial = { title: "ten_tour" }; // only title is remapped
    const result = applyFieldMapping(sampleData, partial);

    expect(result["ten_tour"]).toEqual({ type: "text", text: "Tour ABC" });
    expect(result["morning_block"]).toEqual({ type: "text", text: "Activity content" });
    expect(result["afternoon_block"]).toEqual({ type: "text", text: "Afternoon content" });
    expect(result["title"]).toBeUndefined();
  });

  it("works with TWO_DAY menu fields", () => {
    const menuData = {
      title: { type: "text" as const, text: "Tour XYZ" },
      menu_day1_block: { type: "text" as const, text: "Menu ngày 1" },
      menu_day2_block: { type: "text" as const, text: "Menu ngày 2" },
    };
    const mapping = {
      title: "tieu_de",
      menu_day1_block: "thuc_don_ngay_1",
      menu_day2_block: "thuc_don_ngay_2",
    };
    const result = applyFieldMapping(menuData, mapping);

    expect(result["tieu_de"].text).toBe("Tour XYZ");
    expect(result["thuc_don_ngay_1"].text).toBe("Menu ngày 1");
    expect(result["thuc_don_ngay_2"].text).toBe("Menu ngày 2");
  });
});
