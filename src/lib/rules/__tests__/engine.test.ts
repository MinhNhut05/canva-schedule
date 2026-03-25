import type {
  OneDayDraft,
  StructuredDraft,
  TwoDayDraft,
} from "@/lib/ai/extraction-schema";
import { describe, expect, it } from "vitest";
import {
  DEFAULT_GROUP_GREETING,
  SCHOOL_GREETING,
} from "../definitions";
import { applyRules, violationsToReviewFlags } from "../engine";

function makeOneDaySchoolDraft(
  overrides: Partial<OneDayDraft> = {},
): OneDayDraft {
  return {
    duration: "ONE_DAY",
    title: "Tour Vũng Tàu 1 ngày",
    clientName: "Trường THPT Trần Đại Nghĩa",
    clientType: "SCHOOL",
    schoolName: "THPT Trần Đại Nghĩa",
    tourDate: "15/04/2026",
    greetingText: SCHOOL_GREETING,
    pickupLocation: "Trường THPT Trần Đại Nghĩa",
    returnLocation: "Về lại THPT Trần Đại Nghĩa",
    reviewFlags: [],
    itinerary: {
      morning: [
        { text: "Khởi hành từ trường", sourceConfidence: "high", needsReview: false },
      ],
      afternoon: [
        { text: "Về lại trường", sourceConfidence: "high", needsReview: false },
      ],
    },
    menu: {
      morning: [{ text: "Bánh mì", needsReview: false }],
      lunch: [{ text: "Cơm tấm", needsReview: false }],
      afternoon: [{ text: "Trái cây", needsReview: false }],
    },
    ...overrides,
  } as OneDayDraft;
}

function makeTwoDayGroupDraft(
  overrides: Partial<TwoDayDraft> = {},
): TwoDayDraft {
  return {
    duration: "TWO_DAY",
    title: "Tour Đà Lạt 2 ngày",
    clientName: "Công ty ABC",
    clientType: "GROUP",
    greetingText: DEFAULT_GROUP_GREETING,
    pickupLocation: "Văn phòng công ty",
    returnLocation: "Văn phòng công ty",
    reviewFlags: [],
    itinerary: {
      day1: [
        { text: "Khởi hành", sourceConfidence: "high", needsReview: false },
      ],
      day2: [
        { text: "Tham quan", sourceConfidence: "high", needsReview: false },
      ],
    },
    menu: {
      day1: [{ text: "Phở bò", needsReview: false }],
      day2: [{ text: "Bún bò", needsReview: false }],
    },
    ...overrides,
  } as TwoDayDraft;
}

describe("RULE-01: 1-day layout structure", () => {
  it("passes when ONE_DAY has non-empty morning and afternoon", () => {
    const result = applyRules(makeOneDaySchoolDraft());
    expect(result.violations.filter((v) => v.ruleId === "RULE-01")).toHaveLength(0);
  });

  it("flags when ONE_DAY morning is empty", () => {
    const draft = makeOneDaySchoolDraft();
    draft.itinerary.morning = [];

    const result = applyRules(draft);
    const violations = result.violations.filter((v) => v.ruleId === "RULE-01");

    expect(violations).toHaveLength(1);
    expect(violations[0].field).toBe("itinerary.morning");
    expect(violations[0].severity).toBe("needs_review");
  });

  it("flags when ONE_DAY afternoon is empty", () => {
    const draft = makeOneDaySchoolDraft();
    draft.itinerary.afternoon = [];

    const result = applyRules(draft);
    const violations = result.violations.filter((v) => v.ruleId === "RULE-01");

    expect(violations).toHaveLength(1);
    expect(violations[0].field).toBe("itinerary.afternoon");
  });

  it("flags both morning and afternoon when both are empty", () => {
    const draft = makeOneDaySchoolDraft();
    draft.itinerary.morning = [];
    draft.itinerary.afternoon = [];

    const result = applyRules(draft);
    expect(result.violations.filter((v) => v.ruleId === "RULE-01")).toHaveLength(2);
  });

  it("does not apply to TWO_DAY drafts", () => {
    const result = applyRules(makeTwoDayGroupDraft());
    expect(result.violations.filter((v) => v.ruleId === "RULE-01")).toHaveLength(0);
  });
});

describe("RULE-02: 2-day layout structure", () => {
  it("passes when TWO_DAY has non-empty day1 and day2", () => {
    const result = applyRules(makeTwoDayGroupDraft());
    expect(result.violations.filter((v) => v.ruleId === "RULE-02")).toHaveLength(0);
  });

  it("flags when TWO_DAY day1 is empty", () => {
    const draft = makeTwoDayGroupDraft();
    draft.itinerary.day1 = [];

    const result = applyRules(draft);
    const violations = result.violations.filter((v) => v.ruleId === "RULE-02");

    expect(violations).toHaveLength(1);
    expect(violations[0].field).toBe("itinerary.day1");
    expect(violations[0].severity).toBe("needs_review");
  });

  it("flags when TWO_DAY day2 is empty", () => {
    const draft = makeTwoDayGroupDraft();
    draft.itinerary.day2 = [];

    const result = applyRules(draft);
    const violations = result.violations.filter((v) => v.ruleId === "RULE-02");

    expect(violations).toHaveLength(1);
    expect(violations[0].field).toBe("itinerary.day2");
  });

  it("does not apply to ONE_DAY drafts", () => {
    const result = applyRules(makeOneDaySchoolDraft());
    expect(result.violations.filter((v) => v.ruleId === "RULE-02")).toHaveLength(0);
  });
});

describe("RULE-03: School greeting", () => {
  it("passes when SCHOOL has correct greeting", () => {
    const result = applyRules(makeOneDaySchoolDraft({ greetingText: SCHOOL_GREETING }));
    expect(result.violations.filter((v) => v.ruleId === "RULE-03")).toHaveLength(0);
  });

  it("auto-fixes incorrect greeting for SCHOOL", () => {
    const result = applyRules(
      makeOneDaySchoolDraft({ greetingText: "Xin chào các bạn" }),
    );
    const violations = result.violations.filter((v) => v.ruleId === "RULE-03");

    expect(violations).toHaveLength(1);
    expect(violations[0].severity).toBe("auto_fixed");
    expect(violations[0].originalValue).toBe("Xin chào các bạn");
    expect(violations[0].correctedValue).toBe(SCHOOL_GREETING);
    expect(result.correctedDraft.greetingText).toBe(SCHOOL_GREETING);
  });

  it("auto-fixes missing greeting for SCHOOL", () => {
    const result = applyRules(makeOneDaySchoolDraft({ greetingText: undefined }));
    const violations = result.violations.filter((v) => v.ruleId === "RULE-03");

    expect(violations).toHaveLength(1);
    expect(violations[0].severity).toBe("auto_fixed");
    expect(violations[0].originalValue).toBeNull();
    expect(result.correctedDraft.greetingText).toBe(SCHOOL_GREETING);
  });

  it("does not apply to GROUP drafts", () => {
    const result = applyRules(makeTwoDayGroupDraft({ greetingText: "Wrong greeting" }));
    expect(result.violations.filter((v) => v.ruleId === "RULE-03")).toHaveLength(0);
  });
});

describe("RULE-04: Business/group greeting", () => {
  it("passes when GROUP has greeting 'Quý khách'", () => {
    const result = applyRules(makeTwoDayGroupDraft({ greetingText: "Quý khách" }));
    expect(result.violations.filter((v) => v.ruleId === "RULE-04")).toHaveLength(0);
  });

  it("passes when GROUP has greeting 'Quý đoàn'", () => {
    const result = applyRules(makeTwoDayGroupDraft({ greetingText: "Quý đoàn" }));
    expect(result.violations.filter((v) => v.ruleId === "RULE-04")).toHaveLength(0);
  });

  it("auto-fixes incorrect greeting for GROUP", () => {
    const result = applyRules(
      makeTwoDayGroupDraft({ greetingText: "Xin chào quý vị" }),
    );
    const violations = result.violations.filter((v) => v.ruleId === "RULE-04");

    expect(violations).toHaveLength(1);
    expect(violations[0].severity).toBe("auto_fixed");
    expect(violations[0].originalValue).toBe("Xin chào quý vị");
    expect(violations[0].correctedValue).toBe(DEFAULT_GROUP_GREETING);
    expect(result.correctedDraft.greetingText).toBe(DEFAULT_GROUP_GREETING);
  });

  it("auto-fixes missing greeting for GROUP", () => {
    const result = applyRules(makeTwoDayGroupDraft({ greetingText: undefined }));
    const violations = result.violations.filter((v) => v.ruleId === "RULE-04");

    expect(violations).toHaveLength(1);
    expect(violations[0].severity).toBe("auto_fixed");
    expect(result.correctedDraft.greetingText).toBe(DEFAULT_GROUP_GREETING);
  });

  it("does not apply to SCHOOL drafts", () => {
    const result = applyRules(makeOneDaySchoolDraft());
    expect(result.violations.filter((v) => v.ruleId === "RULE-04")).toHaveLength(0);
  });
});

describe("RULE-05: School name integrity", () => {
  it("passes when schoolName is a clean single string", () => {
    const result = applyRules(
      makeOneDaySchoolDraft({ schoolName: "THPT Trần Đại Nghĩa" }),
    );
    expect(result.violations.filter((v) => v.ruleId === "RULE-05")).toHaveLength(0);
  });

  it("auto-fixes schoolName with line breaks", () => {
    const result = applyRules(
      makeOneDaySchoolDraft({ schoolName: "THPT Trần\nĐại Nghĩa" }),
    );
    const violations = result.violations.filter((v) => v.ruleId === "RULE-05");

    expect(violations).toHaveLength(1);
    expect(violations[0].severity).toBe("auto_fixed");
    expect(violations[0].originalValue).toBe("THPT Trần\nĐại Nghĩa");
    expect(violations[0].correctedValue).toBe("THPT Trần Đại Nghĩa");
    expect(result.correctedDraft.schoolName).toBe("THPT Trần Đại Nghĩa");
  });

  it("auto-fixes schoolName with excessive whitespace", () => {
    const result = applyRules(
      makeOneDaySchoolDraft({ schoolName: "THPT   Trần   Đại   Nghĩa" }),
    );
    const violations = result.violations.filter((v) => v.ruleId === "RULE-05");

    expect(violations).toHaveLength(1);
    expect(violations[0].severity).toBe("auto_fixed");
    expect(result.correctedDraft.schoolName).toBe("THPT Trần Đại Nghĩa");
  });

  it("auto-fixes schoolName with carriage return", () => {
    const result = applyRules(
      makeOneDaySchoolDraft({ schoolName: "THPT Trần\r\nĐại Nghĩa" }),
    );
    expect(result.violations.filter((v) => v.ruleId === "RULE-05")).toHaveLength(1);
    expect(result.correctedDraft.schoolName).toBe("THPT Trần Đại Nghĩa");
  });

  it("does not flag when schoolName is missing", () => {
    const result = applyRules(makeOneDaySchoolDraft({ schoolName: undefined }));
    expect(result.violations.filter((v) => v.ruleId === "RULE-05")).toHaveLength(0);
  });
});

describe("RULE-06: Return-to-school wording", () => {
  it("passes when returnLocation includes school name", () => {
    const result = applyRules(
      makeOneDaySchoolDraft({ returnLocation: "Về lại THPT Trần Đại Nghĩa" }),
    );
    expect(result.violations.filter((v) => v.ruleId === "RULE-06")).toHaveLength(0);
  });

  it("auto-fixes when returnLocation does not include school name", () => {
    const result = applyRules(
      makeOneDaySchoolDraft({ returnLocation: "Về lại trường" }),
    );
    const violations = result.violations.filter((v) => v.ruleId === "RULE-06");

    expect(violations).toHaveLength(1);
    expect(violations[0].severity).toBe("auto_fixed");
    expect(violations[0].originalValue).toBe("Về lại trường");
    expect(violations[0].correctedValue).toBe("Về lại THPT Trần Đại Nghĩa");
    expect(result.correctedDraft.returnLocation).toBe("Về lại THPT Trần Đại Nghĩa");
  });

  it("auto-fixes when returnLocation is missing", () => {
    const result = applyRules(makeOneDaySchoolDraft({ returnLocation: undefined }));
    const violations = result.violations.filter((v) => v.ruleId === "RULE-06");

    expect(violations).toHaveLength(1);
    expect(violations[0].severity).toBe("auto_fixed");
    expect(violations[0].originalValue).toBeNull();
    expect(result.correctedDraft.returnLocation).toBe("Về lại THPT Trần Đại Nghĩa");
  });

  it("does not apply when clientType is not SCHOOL", () => {
    const result = applyRules(makeTwoDayGroupDraft({ returnLocation: "Về lại văn phòng" }));
    expect(result.violations.filter((v) => v.ruleId === "RULE-06")).toHaveLength(0);
  });

  it("does not apply when schoolName is missing", () => {
    const result = applyRules(
      makeOneDaySchoolDraft({ schoolName: undefined, returnLocation: "Về lại trường" }),
    );
    expect(result.violations.filter((v) => v.ruleId === "RULE-06")).toHaveLength(0);
  });
});

describe("RULE-07: Menu separation and structure", () => {
  it("passes when ONE_DAY menu has items", () => {
    const result = applyRules(makeOneDaySchoolDraft());
    expect(result.violations.filter((v) => v.ruleId === "RULE-07")).toHaveLength(0);
  });

  it("flags when ONE_DAY menu is completely empty", () => {
    const draft = makeOneDaySchoolDraft();
    draft.menu = { morning: [], lunch: [], afternoon: [] };

    const result = applyRules(draft);
    const violations = result.violations.filter((v) => v.ruleId === "RULE-07");

    expect(violations).toHaveLength(1);
    expect(violations[0].severity).toBe("needs_review");
    expect(violations[0].field).toBe("menu");
  });

  it("passes when TWO_DAY menu has items", () => {
    const result = applyRules(makeTwoDayGroupDraft());
    expect(result.violations.filter((v) => v.ruleId === "RULE-07")).toHaveLength(0);
  });

  it("flags when TWO_DAY menu is completely empty", () => {
    const draft = makeTwoDayGroupDraft();
    draft.menu = { day1: [], day2: [] };

    const result = applyRules(draft);
    const violations = result.violations.filter((v) => v.ruleId === "RULE-07");

    expect(violations).toHaveLength(1);
    expect(violations[0].severity).toBe("needs_review");
    expect(violations[0].field).toBe("menu");
  });

  it("passes when only some menu sections have items", () => {
    const draft = makeOneDaySchoolDraft();
    draft.menu = {
      morning: [],
      lunch: [{ text: "Cơm tấm", needsReview: false }],
      afternoon: [],
    };

    const result = applyRules(draft);
    expect(result.violations.filter((v) => v.ruleId === "RULE-07")).toHaveLength(0);
  });
});

describe("applyRules() orchestrator", () => {
  it("returns correct autoFixCount and needsReviewCount", () => {
    const draft = makeOneDaySchoolDraft({ greetingText: "Xin chào" });
    draft.menu = { morning: [], lunch: [], afternoon: [] };

    const result = applyRules(draft);

    expect(result.autoFixCount).toBeGreaterThanOrEqual(1);
    expect(result.needsReviewCount).toBeGreaterThanOrEqual(1);
    expect(result.violations.length).toBe(
      result.autoFixCount + result.needsReviewCount,
    );
  });

  it("does not mutate the original draft", () => {
    const draft = makeOneDaySchoolDraft({ greetingText: "Wrong greeting" });
    const originalGreeting = draft.greetingText;

    applyRules(draft);

    expect(draft.greetingText).toBe(originalGreeting);
  });

  it("chains rule fixes correctly", () => {
    const result = applyRules(
      makeOneDaySchoolDraft({
        schoolName: "THPT Trần\nĐại Nghĩa",
        returnLocation: "Về lại trường",
      }),
    );

    expect(result.correctedDraft.schoolName).toBe("THPT Trần Đại Nghĩa");
    expect(result.correctedDraft.returnLocation).toBe("Về lại THPT Trần Đại Nghĩa");
  });

  it("returns zero violations for a fully compliant draft", () => {
    const result = applyRules(makeOneDaySchoolDraft());

    expect(result.violations).toHaveLength(0);
    expect(result.autoFixCount).toBe(0);
    expect(result.needsReviewCount).toBe(0);
  });
});

describe("violationsToReviewFlags()", () => {
  it("converts violations to flag strings", () => {
    const flags = violationsToReviewFlags([
      {
        ruleId: "RULE-03",
        field: "greetingText",
        message: "test",
        severity: "auto_fixed",
        originalValue: "old",
        correctedValue: "new",
      },
      {
        ruleId: "RULE-07",
        field: "menu",
        message: "test",
        severity: "needs_review",
        originalValue: null,
        correctedValue: null,
      },
    ]);

    expect(flags).toEqual([
      "rule:RULE-03:auto_fixed",
      "rule:RULE-07:needs_review",
    ]);
  });

  it("returns empty array for no violations", () => {
    expect(violationsToReviewFlags([])).toEqual([]);
  });
});
