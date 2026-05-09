import { describe, it, expect } from "vitest";
import {
  structuredDraftSchema,
  activitySchema,
  menuItemSchema,
  oneDaySchema,
  twoDaySchema,
  threeDaySchema,
} from "../extraction-schema";

describe("activitySchema", () => {
  it("accepts valid activity with all fields", () => {
    const result = activitySchema.safeParse({
      timeLabel: "6:00",
      text: "Khởi hành từ TP.HCM",
      sourceConfidence: "high",
      needsReview: false,
    });
    expect(result.success).toBe(true);
  });

  it("accepts activity without optional timeLabel", () => {
    const result = activitySchema.safeParse({
      text: "Tham quan Dinh Độc Lập",
      sourceConfidence: "medium",
    });
    expect(result.success).toBe(true);
  });

  it("rejects activity with empty text", () => {
    const result = activitySchema.safeParse({
      text: "",
      sourceConfidence: "high",
    });
    expect(result.success).toBe(false);
  });

  it("defaults needsReview to false", () => {
    const result = activitySchema.parse({
      text: "Ăn sáng",
      sourceConfidence: "high",
    });
    expect(result.needsReview).toBe(false);
  });
});

describe("menuItemSchema", () => {
  it("accepts menu item text and defaults needsReview", () => {
    const result = menuItemSchema.parse({ text: "Bánh mì" });
    expect(result.needsReview).toBe(false);
  });
});

describe("oneDaySchema", () => {
  it("accepts valid one-day schema directly", () => {
    const result = oneDaySchema.safeParse({
      duration: "ONE_DAY",
      itinerary: {
        morning: [{ text: "Khởi hành", sourceConfidence: "high" }],
        afternoon: [{ text: "Về", sourceConfidence: "high" }],
      },
      menu: {
        morning: [],
        lunch: [],
        afternoon: [],
      },
    });

    expect(result.success).toBe(true);
  });
});

describe("twoDaySchema", () => {
  it("accepts valid two-day schema directly", () => {
    const result = twoDaySchema.safeParse({
      duration: "TWO_DAY",
      itinerary: {
        day1: [{ text: "Khởi hành", sourceConfidence: "high" }],
        day2: [{ text: "Tham quan", sourceConfidence: "high" }],
      },
      menu: {
        morning_day1: [],
        lunch_day1: [],
        afternoon_day1: [],
        morning_day2: [],
        lunch_day2: [],
        afternoon_day2: [],
      },
    });

    expect(result.success).toBe(true);
  });
});

describe("threeDaySchema", () => {
  it("accepts valid three-day schema directly", () => {
    const result = threeDaySchema.safeParse({
      duration: "THREE_DAY",
      itinerary: {
        day1: [{ text: "Khởi hành", sourceConfidence: "high" }],
        day2: [{ text: "Tham quan", sourceConfidence: "high" }],
        day3: [{ text: "Về", sourceConfidence: "high" }],
      },
      menu: {
        morning_day1: [],
        lunch_day1: [],
        afternoon_day1: [],
        morning_day2: [],
        lunch_day2: [],
        afternoon_day2: [],
        morning_day3: [],
        lunch_day3: [],
        afternoon_day3: [],
      },
    });

    expect(result.success).toBe(true);
  });
});

describe("structuredDraftSchema — ONE_DAY", () => {
  const validOneDay = {
    duration: "ONE_DAY",
    programName: "CHƯƠNG TRÌNH HƯỚNG NGHIỆP TÌM HIỂU NGÀNH NGHỀ",
    title: "SÓC TRĂNG – CẦN THƠ",
    clientName: "Trường THPT Trần Đại Nghĩa",
    clientType: "SCHOOL",
    schoolName: "THPT Trần Đại Nghĩa",
    tourDate: "15/04/2026",
    greetingText: "Quý thầy cô và các bạn học sinh",
    pickupLocation: "Trường THPT Trần Đại Nghĩa",
    returnLocation: "Về lại THPT Trần Đại Nghĩa",
    reviewFlags: [],
    itinerary: {
      morning: [{ text: "Khởi hành", sourceConfidence: "high", needsReview: false }],
      afternoon: [{ text: "Về lại trường", sourceConfidence: "high", needsReview: false }],
    },
    menu: {
      morning: [{ text: "Bánh mì", needsReview: false }],
      lunch: [{ text: "Cơm tấm", needsReview: false }],
      afternoon: [{ text: "Trái cây", needsReview: false }],
    },
  };

  it("accepts valid one-day tour", () => {
    const result = structuredDraftSchema.safeParse(validOneDay);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.duration).toBe("ONE_DAY");
      expect(result.data.programName).toBe("CHƯƠNG TRÌNH HƯỚNG NGHIỆP TÌM HIỂU NGÀNH NGHỀ");
      expect(result.data.title).toBe("SÓC TRĂNG – CẦN THƠ");
    }
  });

  it("rejects ONE_DAY with day1/day2 itinerary structure", () => {
    const invalid = {
      ...validOneDay,
      itinerary: {
        day1: [{ text: "Khởi hành", sourceConfidence: "high" }],
        day2: [{ text: "Về", sourceConfidence: "high" }],
      },
    };
    const result = structuredDraftSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("accepts one-day with optional fields missing (blank/flagged)", () => {
    const minimal = {
      duration: "ONE_DAY",
      itinerary: {
        morning: [{ text: "Khởi hành", sourceConfidence: "high" }],
        afternoon: [{ text: "Về", sourceConfidence: "high" }],
      },
      menu: {
        morning: [],
        lunch: [],
        afternoon: [],
      },
    };
    const result = structuredDraftSchema.safeParse(minimal);
    expect(result.success).toBe(true);
  });
});

describe("structuredDraftSchema — TWO_DAY", () => {
  const validTwoDay = {
    duration: "TWO_DAY",
    programName: "CHƯƠNG TRÌNH THAM QUAN DÃ NGOẠI",
    title: "ĐÀ LẠT – TEAM BUILDING",
    clientType: "GROUP",
    greetingText: "Quý khách",
    reviewFlags: [],
    itinerary: {
      day1: [{ text: "Khởi hành", sourceConfidence: "high" }],
      day2: [{ text: "Tham quan", sourceConfidence: "high" }],
    },
    menu: {
      morning_day1: [{ text: "Bánh mì", needsReview: false }],
      lunch_day1: [{ text: "Phở bò", needsReview: false }],
      afternoon_day1: [],
      morning_day2: [{ text: "Hủ tiếu", needsReview: false }],
      lunch_day2: [{ text: "Bún bò", needsReview: false }],
      afternoon_day2: [],
    },
  };

  it("accepts valid two-day tour", () => {
    const result = structuredDraftSchema.safeParse(validTwoDay);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.duration).toBe("TWO_DAY");
      expect(result.data.programName).toBe("CHƯƠNG TRÌNH THAM QUAN DÃ NGOẠI");
      expect(result.data.title).toBe("ĐÀ LẠT – TEAM BUILDING");
    }
  });

  it("rejects TWO_DAY with morning/afternoon itinerary structure", () => {
    const invalid = {
      ...validTwoDay,
      itinerary: {
        morning: [{ text: "Khởi hành", sourceConfidence: "high" }],
        afternoon: [{ text: "Về", sourceConfidence: "high" }],
      },
    };
    const result = structuredDraftSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

describe("SAFE-02: schema validation rejects invalid output", () => {
  it("rejects completely invalid JSON shape", () => {
    const result = structuredDraftSchema.safeParse({ foo: "bar" });
    expect(result.success).toBe(false);
  });

  it("rejects unknown duration value", () => {
    const result = structuredDraftSchema.safeParse({
      duration: "FOUR_DAY",
      itinerary: {},
      menu: {},
    });
    expect(result.success).toBe(false);
  });

  it("rejects null input", () => {
    const result = structuredDraftSchema.safeParse(null);
    expect(result.success).toBe(false);
  });

  it("rejects string input", () => {
    const result = structuredDraftSchema.safeParse("just a string");
    expect(result.success).toBe(false);
  });
});
