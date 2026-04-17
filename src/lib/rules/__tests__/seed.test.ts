import { describe, it, expect, vi } from "vitest";

import { seedCompanyRules, SEEDED_RULE_IDS } from "../seed";

describe("seedCompanyRules", () => {
  it("exports SEEDED_RULE_IDS with 9 entries", () => {
    expect(SEEDED_RULE_IDS.size).toBe(9);
    expect(SEEDED_RULE_IDS.has("RULE-01")).toBe(true);
    expect(SEEDED_RULE_IDS.has("RULE-07")).toBe(true);
    expect(SEEDED_RULE_IDS.has("RULE-09")).toBe(true);
  });

  it("SEEDED_RULE_IDS does not contain rules outside the seeded range", () => {
    expect(SEEDED_RULE_IDS.has("RULE-00")).toBe(false);
    expect(SEEDED_RULE_IDS.has("RULE-10")).toBe(false);
  });

  it("uses upsert with empty update{} (non-destructive) for each seeded rule", async () => {
    const mockUpsert = vi.fn().mockResolvedValue({});
    const mockPrisma = {
      companyRule: { upsert: mockUpsert },
    } as any;

    await seedCompanyRules(mockPrisma);

    expect(mockUpsert).toHaveBeenCalledTimes(9);

    // Each upsert should have update: {} (non-destructive)
    for (const call of mockUpsert.mock.calls) {
      expect(call[0]).toMatchObject({
        update: {},
      });
    }
  });

  it("seeds all 9 rules with correct ruleIds", async () => {
    const mockUpsert = vi.fn().mockResolvedValue({});
    const mockPrisma = {
      companyRule: { upsert: mockUpsert },
    } as any;

    await seedCompanyRules(mockPrisma);

    const seededIds = mockUpsert.mock.calls.map(
      (call: any[]) => call[0].where.ruleId
    );

    expect(seededIds).toContain("RULE-01");
    expect(seededIds).toContain("RULE-07");
    expect(seededIds).toContain("RULE-09");
    expect(seededIds).toHaveLength(9);
  });
});
