import { describe, it, expect } from "vitest";

import {
  buildOneDayItineraryPayload,
  buildOneDayMenuPayload,
  buildTwoDayItineraryPayload,
  buildTwoDayMenuPayload,
} from "@/lib/canva/payload";

// Helper to build a mock activity list
function makeActivities(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    text: `activity_${i + 1}`,
  }));
}

// Helper to build activities with timeLabels
function makeActivitiesWithTime(entries: { time?: string; text: string }[]) {
  return entries.map((e) => ({
    text: e.text,
    timeLabel: e.time,
  }));
}

function makeMenuItems(count: number) {
  return Array.from({ length: count }, (_, i) => ({ text: `item_${i + 1}` }));
}

const sharedDraft = {
  programName: "CHƯƠNG TRÌNH HƯỚNG NGHIỆP TÌM HIỂU NGÀNH NGHỀ",
  title: "SÓC TRĂNG – CẦN THƠ",
  clientName: "THPT Cai Nuoc",
  tourDate: "2026-03-25",
  greetingText: "Quý thầy cô và các bạn học sinh",
  pickupLocation: "Trường THPT Cai Nuoc",
  returnLocation: "Trường THPT Cai Nuoc",
};

function assertSharedFields(data: Record<string, { type: string; text: string }>) {
  expect(data["title"]).toEqual({ type: "text", text: "SÓC TRĂNG – CẦN THƠ" });
  expect(data["program_label"]).toEqual({ type: "text", text: "CHƯƠNG TRÌNH HƯỚNG NGHIỆP TÌM HIỂU NGÀNH NGHỀ" });
  expect(data["tour_date"]).toEqual({ type: "text", text: "2026-03-25" });
}

// --------------------------------------------------------------------------
// buildOneDayItineraryPayload
// --------------------------------------------------------------------------
describe("buildOneDayItineraryPayload", () => {
  it("falls back to default program label when programName is missing", () => {
    const draft = {
      ...sharedDraft,
      programName: undefined,
      itinerary: { morning: [], afternoon: [] },
    };
    const data = buildOneDayItineraryPayload(draft);
    expect(data["program_label"]).toEqual({
      type: "text",
      text: "CHƯƠNG TRÌNH THAM QUAN",
    });
    expect(data["title"]).toEqual({ type: "text", text: "SÓC TRĂNG – CẦN THƠ" });
  });

  it("includes shared fields (title, tour_date)", () => {
    const draft = {
      ...sharedDraft,
      itinerary: { morning: [], afternoon: [] },
    };
    const data = buildOneDayItineraryPayload(draft);
    assertSharedFields(data);
  });

  it("produces morning_block and afternoon_block fields", () => {
    const draft = {
      ...sharedDraft,
      itinerary: { morning: makeActivities(3), afternoon: makeActivities(2) },
    };
    const data = buildOneDayItineraryPayload(draft);
    expect(data["morning_block"]).toBeDefined();
    expect(data["morning_block"].type).toBe("text");
    expect(data["afternoon_block"]).toBeDefined();
    expect(data["afternoon_block"].type).toBe("text");
  });

  it("joins activities with double newlines into block", () => {
    const draft = {
      ...sharedDraft,
      itinerary: { morning: makeActivities(3), afternoon: makeActivities(2) },
    };
    const data = buildOneDayItineraryPayload(draft);
    expect(data["morning_block"].text).toBe(
      "\nactivity_1\n\n\nactivity_2\n\n\nactivity_3",
    );
    expect(data["afternoon_block"].text).toBe(
      "\nactivity_1\n\n\nactivity_2\n\n\nKết thúc chương trình!",
    );
  });

  it("returns empty morning_block and appends end program to afternoon when no activities", () => {
    const draft = {
      ...sharedDraft,
      itinerary: { morning: [], afternoon: [] },
    };
    const data = buildOneDayItineraryPayload(draft);
    expect(data["morning_block"].text).toBe("");
    expect(data["afternoon_block"].text).toBe("\nKết thúc chương trình!");
  });

  it("prepends formatted timeLabel on separate line", () => {
    const draft = {
      ...sharedDraft,
      itinerary: {
        morning: makeActivitiesWithTime([
          { time: "5:30", text: "Xuất phát từ trường" },
          { time: "7:00", text: "Tham quan khu du lịch" },
        ]),
        afternoon: makeActivitiesWithTime([
          { text: "Ăn trưa" },
          { time: "14:00", text: "Về trường" },
        ]),
      },
    };
    const data = buildOneDayItineraryPayload(draft);
    expect(data["morning_block"].text).toBe(
      "05 giờ 30:\nXuất phát từ trường\n\n07 giờ 00:\nTham quan khu du lịch",
    );
    expect(data["afternoon_block"].text).toBe(
      "\nĂn trưa\n\n14 giờ 00:\nVề trường\n\n\nKết thúc chương trình!",
    );
  });

  it("only has 5 keys total", () => {
    const draft = {
      ...sharedDraft,
      itinerary: { morning: makeActivities(3), afternoon: makeActivities(2) },
    };
    const data = buildOneDayItineraryPayload(draft);
    expect(Object.keys(data)).toHaveLength(5);
    expect(Object.keys(data).sort()).toEqual([
      "afternoon_block",
      "morning_block",
      "program_label",
      "title",
      "tour_date",
    ]);
  });

  it("does not duplicate end program if AI already added it", () => {
    const draft = {
      ...sharedDraft,
      itinerary: {
        morning: makeActivities(1),
        afternoon: [
          { text: "Về lại đến điểm hen." },
          { text: "Kết thúc chương trình!" },
        ],
      },
    };
    const data = buildOneDayItineraryPayload(draft);
    // Should appear exactly once, not twice
    const matches = data["afternoon_block"].text.match(/Kết thúc chương trình!/g);
    expect(matches).toHaveLength(1);
  });
});

// --------------------------------------------------------------------------
// buildOneDayMenuPayload
// --------------------------------------------------------------------------
describe("buildOneDayMenuPayload", () => {
  it("includes shared fields", () => {
    const draft = {
      ...sharedDraft,
      menu: { morning: [], lunch: [], afternoon: [] },
    };
    const data = buildOneDayMenuPayload(draft);
    assertSharedFields(data);
  });

  it("produces menu_morning_block, menu_lunch_block, menu_afternoon_block fields", () => {
    const draft = {
      ...sharedDraft,
      menu: {
        morning: makeMenuItems(2),
        lunch: makeMenuItems(3),
        afternoon: makeMenuItems(1),
      },
    };
    const data = buildOneDayMenuPayload(draft);
    expect(data["menu_morning_block"]).toBeDefined();
    expect(data["menu_lunch_block"]).toBeDefined();
    expect(data["menu_afternoon_block"]).toBeDefined();
  });

  it("joins menu items with newlines", () => {
    const draft = {
      ...sharedDraft,
      menu: {
        morning: makeMenuItems(2),
        lunch: makeMenuItems(1),
        afternoon: [],
      },
    };
    const data = buildOneDayMenuPayload(draft);
    expect(data["menu_morning_block"].text).toBe("item_1\nitem_2");
    expect(data["menu_lunch_block"].text).toBe("item_1");
    expect(data["menu_afternoon_block"].text).toBe("");
  });
});

// --------------------------------------------------------------------------
// buildTwoDayItineraryPayload
// --------------------------------------------------------------------------
describe("buildTwoDayItineraryPayload", () => {
  it("includes shared fields", () => {
    const draft = {
      ...sharedDraft,
      itinerary: { day1: [], day2: [] },
    };
    const data = buildTwoDayItineraryPayload(draft);
    assertSharedFields(data);
  });

  it("produces day1_block and day2_block fields", () => {
    const draft = {
      ...sharedDraft,
      itinerary: { day1: makeActivities(4), day2: makeActivities(3) },
    };
    const data = buildTwoDayItineraryPayload(draft);
    expect(data["day1_block"]).toBeDefined();
    expect(data["day2_block"]).toBeDefined();
  });

  it("joins activities with double newlines", () => {
    const draft = {
      ...sharedDraft,
      itinerary: { day1: makeActivities(2), day2: makeActivities(3) },
    };
    const data = buildTwoDayItineraryPayload(draft);
    expect(data["day1_block"].text).toBe("\nactivity_1\n\n\nactivity_2");
    expect(data["day2_block"].text).toBe(
      "\nactivity_1\n\n\nactivity_2\n\n\nactivity_3\n\n\nKết thúc chương trình!",
    );
  });

  it("prepends formatted timeLabel on separate line", () => {
    const draft = {
      ...sharedDraft,
      itinerary: {
        day1: makeActivitiesWithTime([
          { time: "6:00", text: "Xuất phát" },
          { text: "Tham quan" },
        ]),
        day2: makeActivitiesWithTime([
          { time: "7:00", text: "Ăn sáng" },
        ]),
      },
    };
    const data = buildTwoDayItineraryPayload(draft);
    expect(data["day1_block"].text).toBe("06 giờ 00:\nXuất phát\n\n\nTham quan");
    expect(data["day2_block"].text).toBe("07 giờ 00:\nĂn sáng\n\n\nKết thúc chương trình!");
  });
});

// --------------------------------------------------------------------------
// buildTwoDayMenuPayload
// --------------------------------------------------------------------------
describe("buildTwoDayMenuPayload", () => {
  it("includes shared fields", () => {
    const draft = {
      ...sharedDraft,
      menu: { day1: [], day2: [] },
    };
    const data = buildTwoDayMenuPayload(draft);
    assertSharedFields(data);
  });

  it("produces menu_day1_block and menu_day2_block fields", () => {
    const draft = {
      ...sharedDraft,
      menu: { day1: makeMenuItems(3), day2: makeMenuItems(2) },
    };
    const data = buildTwoDayMenuPayload(draft);
    expect(data["menu_day1_block"]).toBeDefined();
    expect(data["menu_day2_block"]).toBeDefined();
  });

  it("joins menu items with newlines", () => {
    const draft = {
      ...sharedDraft,
      menu: { day1: makeMenuItems(2), day2: makeMenuItems(1) },
    };
    const data = buildTwoDayMenuPayload(draft);
    expect(data["menu_day1_block"].text).toBe("item_1\nitem_2");
    expect(data["menu_day2_block"].text).toBe("item_1");
  });
});

// ==========================================================================
// Realistic Vietnamese content tests — menu 1 ngày, menu 2 ngày, lịch trình 2 ngày
// ==========================================================================

const realisticShared = {
  programName: "CHƯƠNG TRÌNH HƯỚNG NGHIỆP TÌM HIỂU NGÀNH NGHỀ",
  title: "SÓC TRĂNG – CẦN THƠ",
  clientName: "THPT Cai Nước",
  tourDate: "Ngày 19/03/2026",
  greetingText: "Quý thầy cô và các bạn học sinh",
  pickupLocation: "Trường THPT Cai Nước",
  returnLocation: "Trường THPT Cai Nước",
};

describe("Menu 1 ngày — buildOneDayMenuPayload (realistic)", () => {
  const oneDayMenuDraft = {
    ...realisticShared,
    menu: {
      morning: [
        { text: "Bánh mì thịt nguội" },
        { text: "Sữa tươi / Nước suối" },
      ],
      lunch: [
        { text: "Cơm chiên Dương Châu" },
        { text: "Canh chua cá lóc" },
        { text: "Gà kho gừng" },
        { text: "Rau luộc chấm kho quẹt" },
        { text: "Tráng miệng: Chè đậu xanh" },
      ],
      afternoon: [
        { text: "Bánh tráng trộn" },
        { text: "Nước ngọt / Trà đá" },
      ],
    },
  };

  it("produces all 6 keys: shared + 3 menu blocks", () => {
    const data = buildOneDayMenuPayload(oneDayMenuDraft);
    expect(Object.keys(data).sort()).toEqual([
      "menu_afternoon_block",
      "menu_lunch_block",
      "menu_morning_block",
      "program_label",
      "title",
      "tour_date",
    ]);
  });

  it("formats morning menu with Vietnamese items joined by newlines", () => {
    const data = buildOneDayMenuPayload(oneDayMenuDraft);
    expect(data["menu_morning_block"].text).toBe(
      "Bánh mì thịt nguội\nSữa tươi / Nước suối"
    );
  });

  it("formats lunch menu with full Vietnamese dishes", () => {
    const data = buildOneDayMenuPayload(oneDayMenuDraft);
    expect(data["menu_lunch_block"].text).toContain("Cơm chiên Dương Châu");
    expect(data["menu_lunch_block"].text).toContain("Canh chua cá lóc");
    expect(data["menu_lunch_block"].text).toContain("Tráng miệng: Chè đậu xanh");
    // 5 items joined by \n
    expect(data["menu_lunch_block"].text.split("\n")).toHaveLength(5);
  });

  it("formats afternoon menu items", () => {
    const data = buildOneDayMenuPayload(oneDayMenuDraft);
    expect(data["menu_afternoon_block"].text).toBe(
      "Bánh tráng trộn\nNước ngọt / Trà đá"
    );
  });

  it("preserves shared fields with Vietnamese diacritics", () => {
    const data = buildOneDayMenuPayload(oneDayMenuDraft);
    expect(data["title"].text).toBe("SÓC TRĂNG – CẦN THƠ");
    expect(data["tour_date"].text).toBe("Ngày 19/03/2026");
  });

  it("handles empty menu sections gracefully", () => {
    const emptyMenuDraft = {
      ...realisticShared,
      menu: { morning: [], lunch: [], afternoon: [] },
    };
    const data = buildOneDayMenuPayload(emptyMenuDraft);
    expect(data["menu_morning_block"].text).toBe("");
    expect(data["menu_lunch_block"].text).toBe("");
    expect(data["menu_afternoon_block"].text).toBe("");
  });
});

describe("Menu 2 ngày — buildTwoDayMenuPayload (realistic)", () => {
  const twoDayMenuDraft = {
    ...realisticShared,
    menu: {
      day1: [
        { text: "Bữa sáng: Phở bò" },
        { text: "Bữa trưa: Cơm tấm sườn bì chả" },
        { text: "Bữa chiều: Bánh xèo miền Tây" },
      ],
      day2: [
        { text: "Bữa sáng: Hủ tiếu Nam Vang" },
        { text: "Bữa trưa: Lẩu mắm cá linh" },
        { text: "Bữa chiều: Bánh cống Sóc Trăng" },
      ],
    },
  };

  it("produces all 5 keys: shared + 2 menu day blocks", () => {
    const data = buildTwoDayMenuPayload(twoDayMenuDraft);
    expect(Object.keys(data).sort()).toEqual([
      "menu_day1_block",
      "menu_day2_block",
      "program_label",
      "title",
      "tour_date",
    ]);
  });

  it("formats day 1 menu with Vietnamese dish names", () => {
    const data = buildTwoDayMenuPayload(twoDayMenuDraft);
    expect(data["menu_day1_block"].text).toBe(
      "Bữa sáng: Phở bò\nBữa trưa: Cơm tấm sườn bì chả\nBữa chiều: Bánh xèo miền Tây"
    );
  });

  it("formats day 2 menu with Vietnamese dish names", () => {
    const data = buildTwoDayMenuPayload(twoDayMenuDraft);
    expect(data["menu_day2_block"].text).toBe(
      "Bữa sáng: Hủ tiếu Nam Vang\nBữa trưa: Lẩu mắm cá linh\nBữa chiều: Bánh cống Sóc Trăng"
    );
  });

  it("preserves Vietnamese diacritics in all fields", () => {
    const data = buildTwoDayMenuPayload(twoDayMenuDraft);
    expect(data["menu_day1_block"].text).toContain("Phở");
    expect(data["menu_day2_block"].text).toContain("Hủ tiếu");
    expect(data["menu_day2_block"].text).toContain("Sóc Trăng");
  });

  it("handles day with no menu items", () => {
    const partial = {
      ...realisticShared,
      menu: {
        day1: [{ text: "Bữa sáng: Bánh cuốn" }],
        day2: [],
      },
    };
    const data = buildTwoDayMenuPayload(partial);
    expect(data["menu_day1_block"].text).toBe("Bữa sáng: Bánh cuốn");
    expect(data["menu_day2_block"].text).toBe("");
  });
});

describe("Lịch trình 2 ngày — buildTwoDayItineraryPayload (realistic)", () => {
  const twoDayItineraryDraft = {
    ...realisticShared,
    itinerary: {
      day1: [
        { timeLabel: "5:30", text: "Quý thầy cô và các bạn học sinh tập trung tại Trường THPT Cai Nước" },
        { timeLabel: "5:30 - 6:00", text: "Khởi hành đi Cần Thơ" },
        { timeLabel: "10:00", text: "Tham quan Bến Ninh Kiều" },
        { text: "Sau khi dùng bữa trưa, đoàn tiếp tục tham quan" },
        { timeLabel: "14:00", text: "Tham quan Chợ nổi Cái Răng" },
        { timeLabel: "17:00", text: "Về khách sạn nghỉ ngơi" },
      ],
      day2: [
        { timeLabel: "7:00", text: "Ăn sáng tại khách sạn" },
        { timeLabel: "8:00", text: "Tham quan Khu du lịch Mỹ Khánh" },
        { timeLabel: "11:30", text: "Dùng bữa trưa tại nhà hàng" },
        { timeLabel: "13:30", text: "Khởi hành về Cà Mau" },
        { timeLabel: "17:00", text: "Về trở lại Trường THPT Cai Nước" },
      ],
    },
  };

  it("produces all 5 keys: shared + day1_block + day2_block", () => {
    const data = buildTwoDayItineraryPayload(twoDayItineraryDraft);
    expect(Object.keys(data).sort()).toEqual([
      "day1_block",
      "day2_block",
      "program_label",
      "title",
      "tour_date",
    ]);
  });

  it("formats day 1 activities with timeLabel on separate lines", () => {
    const data = buildTwoDayItineraryPayload(twoDayItineraryDraft);
    const day1 = data["day1_block"].text;
    // First activity: time + text on separate lines
    expect(day1).toContain("05 giờ 30:\nQuý thầy cô và các bạn học sinh tập trung tại Trường THPT Cai Nước");
    // Activity without timeLabel: blank line before text
    expect(day1).toContain("\nSau khi dùng bữa trưa, đoàn tiếp tục tham quan");
    // Afternoon activity
    expect(day1).toContain("14 giờ 00:\nTham quan Chợ nổi Cái Răng");
  });

  it("formats time ranges correctly (e.g. 5:30 - 6:00)", () => {
    const data = buildTwoDayItineraryPayload(twoDayItineraryDraft);
    const day1 = data["day1_block"].text;
    expect(day1).toContain("05 giờ 30 - 06 giờ 00:\nKhởi hành đi Cần Thơ");
  });

  it("appends Kết thúc chương trình! to the last day block", () => {
    const data = buildTwoDayItineraryPayload(twoDayItineraryDraft);
    const day2 = data["day2_block"].text;
    expect(day2).toContain("Kết thúc chương trình!");
    // Appears at the end
    expect(day2.trimEnd().endsWith("Kết thúc chương trình!")).toBe(true);
  });

  it("does NOT append Kết thúc chương trình! to day1_block", () => {
    const data = buildTwoDayItineraryPayload(twoDayItineraryDraft);
    const day1 = data["day1_block"].text;
    expect(day1).not.toContain("Kết thúc chương trình!");
  });

  it("preserves Vietnamese diacritics throughout", () => {
    const data = buildTwoDayItineraryPayload(twoDayItineraryDraft);
    const day1 = data["day1_block"].text;
    const day2 = data["day2_block"].text;
    // Verify diacritics
    expect(day1).toContain("Bến Ninh Kiều");
    expect(day1).toContain("Chợ nổi Cái Răng");
    expect(day2).toContain("Khu du lịch Mỹ Khánh");
    expect(day2).toContain("Cà Mau");
  });

  it("separates activities with double newlines", () => {
    const data = buildTwoDayItineraryPayload(twoDayItineraryDraft);
    const day2 = data["day2_block"].text;
    // Activities separated by \n\n
    expect(day2).toContain("07 giờ 00:\nĂn sáng tại khách sạn\n\n08 giờ 00:\nTham quan Khu du lịch Mỹ Khánh");
  });

  it("handles empty day gracefully", () => {
    const partial = {
      ...realisticShared,
      itinerary: {
        day1: [{ timeLabel: "8:00", text: "Xuất phát" }],
        day2: [],
      },
    };
    const data = buildTwoDayItineraryPayload(partial);
    expect(data["day1_block"].text).toBe("08 giờ 00:\nXuất phát");
    // Empty day still gets end program
    expect(data["day2_block"].text).toContain("Kết thúc chương trình!");
  });
});
