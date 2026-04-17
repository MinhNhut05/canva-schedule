import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock auth
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

// Mock db
vi.mock("@/lib/db", () => ({
  db: {
    companyRule: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Mock revalidatePath
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  createRule,
  updateRule,
  softDeleteRule,
  toggleRuleActive,
} from "../actions";

describe("Admin rules actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createRule", () => {
    it("rejects non-admin users", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "1", role: "member" },
      } as any);

      await expect(
        createRule({ name: "Test", description: "Test desc", category: "test" })
      ).rejects.toThrow("Bạn không có quyền");
    });

    it("creates rule with auto-generated ruleId for admin", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "1", role: "admin" },
      } as any);
      vi.mocked(db.companyRule.findFirst).mockResolvedValue({
        ruleId: "RULE-07",
      } as any);
      vi.mocked(db.companyRule.create).mockResolvedValue({} as any);

      const result = await createRule({
        name: "New rule",
        description: "New desc",
        category: "test",
      });

      expect(result.success).toBe(true);
      expect(db.companyRule.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ ruleId: "RULE-08" }),
        })
      );
    });

    it("returns error when required fields are empty", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "1", role: "admin" },
      } as any);

      const result = await createRule({ name: "", description: "desc", category: "cat" });

      expect(result.success).toBe(false);
      expect(result.error).toContain("bắt buộc");
    });
  });

  describe("softDeleteRule", () => {
    it("rejects deletion of seeded rules", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "1", role: "admin" },
      } as any);

      const result = await softDeleteRule("RULE-01");

      expect(result.success).toBe(false);
      expect(result.error).toContain("Quy tắc gốc không được xóa");
    });

    it("allows soft delete of non-seeded rules", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "1", role: "admin" },
      } as any);
      vi.mocked(db.companyRule.findUnique).mockResolvedValue({
        ruleId: "RULE-99",
        isActive: true,
      } as any);
      vi.mocked(db.companyRule.update).mockResolvedValue({} as any);

      const result = await softDeleteRule("RULE-99");

      expect(result.success).toBe(true);
      expect(db.companyRule.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { isActive: false },
        })
      );
    });

    it("rejects non-admin users", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "1", role: "member" },
      } as any);

      await expect(softDeleteRule("RULE-08")).rejects.toThrow("Bạn không có quyền");
    });
  });

  describe("toggleRuleActive", () => {
    it("toggles isActive for any rule", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "1", role: "admin" },
      } as any);
      vi.mocked(db.companyRule.findUnique).mockResolvedValue({
        ruleId: "RULE-01",
        isActive: true,
      } as any);
      vi.mocked(db.companyRule.update).mockResolvedValue({} as any);

      const result = await toggleRuleActive("RULE-01", false);

      expect(result.success).toBe(true);
    });
  });

  describe("updateRule", () => {
    it("returns error when rule not found", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "1", role: "admin" },
      } as any);
      vi.mocked(db.companyRule.findUnique).mockResolvedValue(null);

      const result = await updateRule("RULE-99", { name: "New Name" });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Không tìm thấy");
    });
  });
});
