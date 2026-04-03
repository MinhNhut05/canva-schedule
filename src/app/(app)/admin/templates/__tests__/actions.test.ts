import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    canvaTemplate: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/canva/verify-template", () => ({
  verifyCanvaTemplate: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { verifyCanvaTemplate } from "@/lib/canva/verify-template";
import { updateTemplate } from "../actions";
import { getFieldsForTemplate } from "@/lib/canva/field-map";

describe("Admin templates actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("updateTemplate", () => {
    it("rejects non-admin users", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "1", role: "member" },
      } as any);

      await expect(
        updateTemplate("tmpl-1", { templateId: "new-id" })
      ).rejects.toThrow("Bạn không có quyền");
    });

    it("verifies template with Canva API when templateId changes", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "1", role: "admin" },
      } as any);
      vi.mocked(db.canvaTemplate.findUnique).mockResolvedValue({
        id: "tmpl-1",
        templateId: "old-id",
      } as any);
      vi.mocked(verifyCanvaTemplate).mockResolvedValue({ success: true });
      vi.mocked(db.canvaTemplate.update).mockResolvedValue({} as any);

      const result = await updateTemplate("tmpl-1", { templateId: "new-id" });

      expect(verifyCanvaTemplate).toHaveBeenCalledWith("new-id");
      expect(result.success).toBe(true);
    });

    it("rejects save when Canva verification fails", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "1", role: "admin" },
      } as any);
      vi.mocked(db.canvaTemplate.findUnique).mockResolvedValue({
        id: "tmpl-1",
        templateId: "old-id",
      } as any);
      vi.mocked(verifyCanvaTemplate).mockResolvedValue({
        success: false,
        error: "Không tìm thấy mẫu Canva với ID này.",
      });

      const result = await updateTemplate("tmpl-1", { templateId: "invalid-id" });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Không tìm thấy");
      expect(db.canvaTemplate.update).not.toHaveBeenCalled();
    });

    it("skips verification when templateId unchanged", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "1", role: "admin" },
      } as any);
      vi.mocked(db.canvaTemplate.findUnique).mockResolvedValue({
        id: "tmpl-1",
        templateId: "same-id",
      } as any);
      vi.mocked(db.canvaTemplate.update).mockResolvedValue({} as any);

      await updateTemplate("tmpl-1", { templateId: "same-id", isActive: false });

      expect(verifyCanvaTemplate).not.toHaveBeenCalled();
    });

    it("returns error when template not found", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "1", role: "admin" },
      } as any);
      vi.mocked(db.canvaTemplate.findUnique).mockResolvedValue(null);

      const result = await updateTemplate("tmpl-99", { isActive: false });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Không tìm thấy");
    });
  });

  describe("getFieldsForTemplate", () => {
    it("returns ONE_DAY_ITINERARY fields for ONE_DAY + ITINERARY", () => {
      const fields = getFieldsForTemplate("ONE_DAY", "ITINERARY");
      expect(fields).toContain("title");
      expect(fields).toContain("program_label");
      expect(fields).toContain("tour_date");
      expect(fields).toContain("morning_block");
      expect(fields).toContain("afternoon_block");
      expect(fields).toHaveLength(5);
    });

    it("returns TWO_DAY_MENU fields for TWO_DAY + MENU", () => {
      const fields = getFieldsForTemplate("TWO_DAY", "MENU");
      expect(fields).toContain("title");
      expect(fields).toContain("menu_day1_block");
      expect(fields).toContain("menu_day2_block");
    });

    it("returns ONE_DAY_MENU fields for ONE_DAY + MENU", () => {
      const fields = getFieldsForTemplate("ONE_DAY", "MENU");
      expect(fields).toContain("menu_morning_block");
      expect(fields).toContain("menu_lunch_block");
    });

    it("returns TWO_DAY_ITINERARY fields for TWO_DAY + ITINERARY", () => {
      const fields = getFieldsForTemplate("TWO_DAY", "ITINERARY");
      expect(fields).toContain("day1_block");
      expect(fields).toContain("day2_block");
      expect(fields).toHaveLength(5);
    });

    it("returns empty array for unknown combination", () => {
      const fields = getFieldsForTemplate("THREE_DAY", "ITINERARY");
      expect(fields).toHaveLength(0);
    });
  });
});
