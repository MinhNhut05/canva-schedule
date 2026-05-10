import { describe, it, expect } from "vitest";

import {
  buildOneDayItineraryPayload,
  buildOneDayMenuPayload,
  buildTwoDayItineraryPayload,
  buildTwoDayMenuPayload,
  buildFourDayItineraryPayload,
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
  expect(data["title"]).toEqual({ type: "text", text: "SÓC TRĂNG - CẦN THƠ" });
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
    expect(data["title"]).toEqual({ type: "text", text: "SÓC TRĂNG - CẦN THƠ" });
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

  it("joins activities with single newlines into block", () => {
    const draft = {
      ...sharedDraft,
      itinerary: { morning: makeActivities(3), afternoon: makeActivities(2) },
    };
    const data = buildOneDayItineraryPayload(draft);
    expect(data["morning_block"].text).toBe("activity_1\nactivity_2\nactivity_3");
    expect(data["afternoon_block"].text).toBe("activity_1\nactivity_2\nKết thúc chương trình!");
  });

  it("returns empty morning_block and appends end program to afternoon when no activities", () => {
    const draft = {
      ...sharedDraft,
      itinerary: { morning: [], afternoon: [] },
    };
    const data = buildOneDayItineraryPayload(draft);
    expect(data["morning_block"].text).toBe("");
    expect(data["afternoon_block"].text).toBe("Kết thúc chương trình!");
  });

  it("prepends formatted timeLabel on separate line and zero-pads h-format times", () => {
    const draft = {
      ...sharedDraft,
      itinerary: {
        morning: makeActivitiesWithTime([
          { time: "1h00", text: "Xuất phát từ trường" },
          { time: "3h30", text: "Tham quan khu du lịch" },
        ]),
        afternoon: makeActivitiesWithTime([
          { text: "Ăn trưa" },
          { time: "14:00", text: "Về trường" },
        ]),
      },
    };
    const data = buildOneDayItineraryPayload(draft);
    expect(data["morning_block"].text).toBe(
      "01 giờ 00:\nXuất phát từ trường\n\n03 giờ 30:\nTham quan khu du lịch",
    );
    expect(data["afternoon_block"].text).toBe(
      "Ăn trưa\n\n14 giờ 00:\nĐoàn khởi hành về Trường THPT Cai Nuoc.\nKết thúc chương trình!",
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

  it("preserves bullet sub-items in morning activities", () => {
    const draft = {
      ...sharedDraft,
      pickupLocation: "ACECOOK Vĩnh Long",
      itinerary: {
        morning: [
          {
            timeLabel: "9:15",
            text: "Quý đoàn tham quan trải nghiệm tại Tân Huê Viên:\n• Tham quan xưởng sản xuất.\n• Check-in kiến trúc.\n• Mua sắm đặc sản.",
          },
        ],
        afternoon: [],
      },
    };
    const data = buildOneDayItineraryPayload(draft);
    expect(data["morning_block"].text).toContain(
      "• Tham quan xưởng sản xuất.\n• Check-in kiến trúc.\n• Mua sắm đặc sản.",
    );
  });

  it("substitutes pickup landmark phrases in morning with pickupLocation", () => {
    const draft = {
      ...sharedDraft,
      pickupLocation: "ACECOOK Vĩnh Long",
      itinerary: {
        morning: [
          { timeLabel: "5:00", text: "Xe và HDV có mặt đón Quý đoàn tại điểm hẹn." },
        ],
        afternoon: [],
      },
    };
    const data = buildOneDayItineraryPayload(draft);
    expect(data["morning_block"].text).toContain("tại ACECOOK Vĩnh Long");
    expect(data["morning_block"].text).not.toContain("tại điểm hẹn");
  });

  it("keeps source text for landmark phrases when pickupLocation is empty", () => {
    const draft = {
      ...sharedDraft,
      pickupLocation: undefined,
      returnLocation: undefined,
      itinerary: {
        morning: [
          { timeLabel: "5:00", text: "Xe và HDV có mặt đón Quý đoàn tại điểm hẹn." },
        ],
        afternoon: [],
      },
    };
    const data = buildOneDayItineraryPayload(draft);
    expect(data["morning_block"].text).toContain("tại điểm hẹn");
  });

  it("strips trailing 'kết thúc chương trình' duplicate so ensureEndProgram is canonical", () => {
    const draft = {
      ...sharedDraft,
      returnLocation: "ACECOOK Vĩnh Long",
      itinerary: {
        morning: [],
        afternoon: [
          { timeLabel: "17:00", text: "Sau khi dùng bữa chiều, xe và HDV đưa Quý đoàn về lại điểm đón ban đầu." },
          { timeLabel: "18:00", text: "Về đến điểm hẹn, kết thúc chương trình. Cảm ơn Quý đoàn." },
        ],
      },
    };
    const data = buildOneDayItineraryPayload(draft);
    const matches = data["afternoon_block"].text.match(/Kết thúc chương trình/gi);
    expect(matches).toHaveLength(1);
    expect(data["afternoon_block"].text).toContain("Đoàn khởi hành về ACECOOK Vĩnh Long.");
    expect(data["afternoon_block"].text).not.toContain("Về đến điểm hẹn");
    expect(data["afternoon_block"].text).not.toContain("Cảm ơn Quý đoàn");
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

  it("joins activities with single newlines", () => {
    const draft = {
      ...sharedDraft,
      itinerary: { day1: makeActivities(2), day2: makeActivities(3) },
    };
    const data = buildTwoDayItineraryPayload(draft);
    expect(data["day1_block"].text).toBe("activity_1\nactivity_2");
    expect(data["day2_block"].text).toBe(
      "activity_1\nactivity_2\nactivity_3\nKết thúc chương trình!",
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
    expect(data["day1_block"].text).toBe("06 giờ 00:\nXuất phát\nTham quan");
    expect(data["day2_block"].text).toBe("07 giờ 00:\nĂn sáng\nKết thúc chương trình!");
  });

  it("preserves bullet sub-items in day1 activities", () => {
    const draft = {
      ...sharedDraft,
      pickupLocation: "ACECOOK Vĩnh Long",
      itinerary: {
        day1: [
          {
            timeLabel: "8:00",
            text: "Xe và HDV đưa Đoàn di chuyển tham quan:\n• Bạch Dinh.\n• Tượng đài Chúa Kitô.\n• Bảo tàng Vũ khí cổ Robert Taylor.",
          },
        ],
        day2: [],
      },
    };
    const data = buildTwoDayItineraryPayload(draft);
    expect(data["day1_block"].text).toContain(
      "• Bạch Dinh.\n• Tượng đài Chúa Kitô.\n• Bảo tàng Vũ khí cổ Robert Taylor.",
    );
  });

  it("substitutes pickup landmark phrases in day1 with pickupLocation", () => {
    const draft = {
      ...sharedDraft,
      pickupLocation: "ACECOOK Vĩnh Long",
      itinerary: {
        day1: [
          { timeLabel: "1:30", text: "Xe và HDV SOHA TRAVEL có mặt đón Quý khách tại điểm hẹn." },
        ],
        day2: [],
      },
    };
    const data = buildTwoDayItineraryPayload(draft);
    expect(data["day1_block"].text).toContain("tại ACECOOK Vĩnh Long");
    expect(data["day1_block"].text).not.toContain("tại điểm hẹn");
  });

  it("strips trailing 'kết thúc chương trình' duplicate in day2", () => {
    const draft = {
      ...sharedDraft,
      returnLocation: "ACECOOK Vĩnh Long",
      itinerary: {
        day1: [],
        day2: [
          { timeLabel: "18:30", text: "Đoàn tiếp tục di chuyển về lại điểm đón ban đầu." },
          { timeLabel: "20:00", text: "Về đến điểm hẹn, kết thúc chương trình tham quan." },
        ],
      },
    };
    const data = buildTwoDayItineraryPayload(draft);
    const matches = data["day2_block"].text.match(/Kết thúc chương trình/gi);
    expect(matches).toHaveLength(1);
    expect(data["day2_block"].text).toContain("Đoàn khởi hành về ACECOOK Vĩnh Long.");
    expect(data["day2_block"].text).not.toContain("Về đến điểm hẹn");
  });
});

// --------------------------------------------------------------------------
// buildTwoDayMenuPayload
// --------------------------------------------------------------------------
describe("buildTwoDayMenuPayload", () => {
  it("includes shared fields", () => {
    const draft = {
      ...sharedDraft,
      menu: {
        morning_day1: [],
        lunch_day1: [],
        afternoon_day1: [],
        morning_day2: [],
        lunch_day2: [],
        afternoon_day2: [],
      },
    };
    const data = buildTwoDayMenuPayload(draft);
    assertSharedFields(data);
  });

  it("produces per-meal fields for day1/day2", () => {
    const draft = {
      ...sharedDraft,
      menu: {
        morning_day1: makeMenuItems(1),
        lunch_day1: makeMenuItems(2),
        afternoon_day1: makeMenuItems(1),
        morning_day2: makeMenuItems(2),
        lunch_day2: makeMenuItems(1),
        afternoon_day2: makeMenuItems(1),
      },
    };
    const data = buildTwoDayMenuPayload(draft);
    expect(data["menu_morning_day1_block"]).toBeDefined();
    expect(data["menu_lunch_day1_block"]).toBeDefined();
    expect(data["menu_afternoon_day1_block"]).toBeDefined();
    expect(data["menu_morning_day2_block"]).toBeDefined();
    expect(data["menu_lunch_day2_block"]).toBeDefined();
    expect(data["menu_afternoon_day2_block"]).toBeDefined();
  });

  it("joins menu items with newlines per meal", () => {
    const draft = {
      ...sharedDraft,
      menu: {
        morning_day1: makeMenuItems(2),
        lunch_day1: makeMenuItems(1),
        afternoon_day1: makeMenuItems(1),
        morning_day2: makeMenuItems(1),
        lunch_day2: makeMenuItems(2),
        afternoon_day2: makeMenuItems(1),
      },
    };
    const data = buildTwoDayMenuPayload(draft);
    expect(data["menu_morning_day1_block"].text).toBe("item_1\nitem_2");
    expect(data["menu_lunch_day1_block"].text).toBe("item_1");
    expect(data["menu_afternoon_day1_block"].text).toBe("item_1");
    expect(data["menu_morning_day2_block"].text).toBe("item_1");
    expect(data["menu_lunch_day2_block"].text).toBe("item_1\nitem_2");
    expect(data["menu_afternoon_day2_block"].text).toBe("item_1");
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
    expect(data["title"].text).toBe("SÓC TRĂNG - CẦN THƠ");
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
      morning_day1: [{ text: "Bữa sáng: Phở bò" }],
      lunch_day1: [{ text: "Bữa trưa: Cơm tấm sườn bì chả" }],
      afternoon_day1: [{ text: "Bữa chiều: Bánh xèo miền Tây" }],
      morning_day2: [{ text: "Bữa sáng: Hủ tiếu Nam Vang" }],
      lunch_day2: [{ text: "Bữa trưa: Lẩu mắm cá linh" }],
      afternoon_day2: [{ text: "Bữa chiều: Bánh cống Sóc Trăng" }],
    },
  };

  it("produces all 9 keys: shared + 6 menu meal blocks", () => {
    const data = buildTwoDayMenuPayload(twoDayMenuDraft);
    expect(Object.keys(data).sort()).toEqual([
      "menu_afternoon_day1_block",
      "menu_afternoon_day2_block",
      "menu_lunch_day1_block",
      "menu_lunch_day2_block",
      "menu_morning_day1_block",
      "menu_morning_day2_block",
      "program_label",
      "title",
      "tour_date",
    ]);
  });

  it("formats day 1 meal blocks with Vietnamese dish names", () => {
    const data = buildTwoDayMenuPayload(twoDayMenuDraft);
    expect(data["menu_morning_day1_block"].text).toBe("Bữa sáng: Phở bò");
    expect(data["menu_lunch_day1_block"].text).toBe("Bữa trưa: Cơm tấm sườn bì chả");
    expect(data["menu_afternoon_day1_block"].text).toBe("Bữa chiều: Bánh xèo miền Tây");
  });

  it("formats day 2 meal blocks with Vietnamese dish names", () => {
    const data = buildTwoDayMenuPayload(twoDayMenuDraft);
    expect(data["menu_morning_day2_block"].text).toBe("Bữa sáng: Hủ tiếu Nam Vang");
    expect(data["menu_lunch_day2_block"].text).toBe("Bữa trưa: Lẩu mắm cá linh");
    expect(data["menu_afternoon_day2_block"].text).toBe("Bữa chiều: Bánh cống Sóc Trăng");
  });

  it("preserves Vietnamese diacritics in all meal blocks", () => {
    const data = buildTwoDayMenuPayload(twoDayMenuDraft);
    expect(data["menu_morning_day1_block"].text).toContain("Phở");
    expect(data["menu_morning_day2_block"].text).toContain("Hủ tiếu");
    expect(data["menu_afternoon_day2_block"].text).toContain("Sóc Trăng");
  });

  it("handles missing meals as empty strings", () => {
    const partial = {
      ...realisticShared,
      menu: {
        morning_day1: [{ text: "Bữa sáng: Bánh cuốn" }],
        lunch_day1: [],
        afternoon_day1: [],
        morning_day2: [],
        lunch_day2: [],
        afternoon_day2: [],
      },
    };
    const data = buildTwoDayMenuPayload(partial);
    expect(data["menu_morning_day1_block"].text).toBe("Bữa sáng: Bánh cuốn");
    expect(data["menu_lunch_day1_block"].text).toBe("");
    expect(data["menu_afternoon_day1_block"].text).toBe("");
    expect(data["menu_morning_day2_block"].text).toBe("");
    expect(data["menu_lunch_day2_block"].text).toBe("");
    expect(data["menu_afternoon_day2_block"].text).toBe("");
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
    // RETURN_TRAVEL_PATTERN rewrites "Khởi hành về Cà Mau" → "Đoàn khởi hành về {returnLocation}"
    expect(day2).toContain("Trường THPT Cai Nước");
  });

  it("separates activities with single newlines", () => {
    const data = buildTwoDayItineraryPayload(twoDayItineraryDraft);
    const day2 = data["day2_block"].text;
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


describe("Lịch trình 1 ngày — canonical Phase 7 sample", () => {
  const canonicalOneDayDraft = {
    duration: "ONE_DAY",
    programName: "CHƯƠNG TRÌNH TRẢI NGHIỆM NGOẠI KHÓA",
    title: "LONG TUYỀN 2 - SUỐI TIÊN",
    clientName: "Trường tiểu học Long Tuyền 2",
    tourDate: "18/03/2026",
    greetingText: "Quý thầy cô và các bạn học sinh",
    pickupLocation: "Trường tiểu học Long Tuyền 2",
    returnLocation: "Trường tiểu học Long Tuyền 2",
    itinerary: {
      morning: [
        {
          timeLabel: "6:00",
          text: "Quý thầy cô và các bạn học sinh dùng bữa sáng tại nhà hàng.",
        },
      ],
      afternoon: [
        {
          timeLabel: "13:00",
          text:
            "Quý thầy cô và các bạn học sinh tự do tham quan và vui chơi tại Công viên văn hóa Suối Tiên:\n• Tham quan Giang Sơn Bách Thú.\n• Tham quan thủy cung Suối Tiên.\n• Trải nghiệm các trò chơi: Vũ điệu ong vàng, Chuyến tàu mơ ước, Ngựa phi nước đại, Phi cơ, Lâu đài tuyết, film 9D, Vương quốc cá sấu, Tinh tú thiên hà, Ghế bay, Tàu lượn siêu tốc, Xe điện đụng, Đĩa bay hành tinh lạ.",
        },
        {
          timeLabel: "15:30",
          text: "Khởi hành về lại điểm hẹn.",
        },
      ],
    },
    menu: {
      morning: [{ text: "Bún bò/ Hủ tiếu nam vang, Trà đá" }],
      lunch: [{ text: "Cơm trưa" }, { text: "Canh rau" }],
      afternoon: [{ text: "Nước suối" }],
    },
  };

  it("keeps reviewed program label separate from the short title", () => {
    const data = buildOneDayItineraryPayload(canonicalOneDayDraft);

    expect(data["program_label"].text).toBe(
      "CHƯƠNG TRÌNH TRẢI NGHIỆM NGOẠI KHÓA",
    );
    expect(data["title"].text).toBe("LONG TUYỀN 2 - SUỐI TIÊN");
  });

  it("keeps the compact Suối Tiên block and explicit return destination when merge is off", () => {
    const data = buildOneDayItineraryPayload(canonicalOneDayDraft);

    expect(data["morning_block"].text).toContain(
      "06 giờ 00:\nQuý thầy cô và các bạn học sinh dùng bữa sáng tại nhà hàng.",
    );
    expect(data["morning_block"].text).not.toContain("Món ăn:");
    expect(data["afternoon_block"].text).toContain(
      "13 giờ 00:\nSau khi dùng bữa, Quý thầy cô và các bạn học sinh tự do tham quan và vui chơi tại Công viên văn hóa Suối Tiên:",
    );
    expect(data["afternoon_block"].text).toContain("Giang Sơn Bách Thú.");
    expect(data["afternoon_block"].text).toContain("Thủy cung Suối Tiên.");
    expect(data["afternoon_block"].text).toContain(
      "Các trò chơi tuổi thơ, phổ thông, cảm giác mạnh.",
    );
    expect(data["afternoon_block"].text).toContain(
      "15 giờ 30:\nĐoàn khởi hành về Trường tiểu học Long Tuyền 2.",
    );
    expect(data["afternoon_block"].text).not.toContain("Thực đơn trưa:");
  });

  it("splits merged menu into món ăn and nước uống without blank spacer lines", () => {
    const withoutMerge = buildOneDayItineraryPayload(canonicalOneDayDraft);
    const withMerge = buildOneDayItineraryPayload(canonicalOneDayDraft, {
      mergeMenuIntoItinerary: true,
    });

    expect(withMerge["morning_block"].text).toContain(
      "06 giờ 00:\nQuý thầy cô và các bạn học sinh dùng bữa sáng tại nhà hàng.\nMón ăn: Bún bò/ Hủ tiếu nam vang\nNước uống: Trà đá",
    );
    expect(withMerge["afternoon_block"].text).toContain(
      "Món ăn: Cơm trưa, Canh rau",
    );
    expect(withMerge["afternoon_block"].text).toContain(
      "Nước uống: Nước suối",
    );
    expect(withMerge["afternoon_block"].text.indexOf("Món ăn: Cơm trưa, Canh rau")).toBeLessThan(
      withMerge["afternoon_block"].text.indexOf("15 giờ 30"),
    );
    expect(withMerge["afternoon_block"].text).not.toContain("Thực đơn trưa:");
    // Merged menu lines stay tight (single \n) — no blank line between Món ăn and Nước uống
    expect(withMerge["afternoon_block"].text).toContain(
      "Món ăn: Cơm trưa, Canh rau\nNước uống: Nước suối",
    );
    expect(withMerge["afternoon_block"].text).not.toBe(
      withoutMerge["afternoon_block"].text,
    );
  });

  it("anchors lunch menu to the actual lunch block instead of the later sightseeing block", () => {
    const lunchInMorningDraft = {
      ...canonicalOneDayDraft,
      itinerary: {
        morning: [
          {
            timeLabel: "6:00",
            text: "Quý thầy cô và các bạn học sinh dùng bữa sáng tại nhà hàng.",
          },
          {
            timeLabel: "11h30",
            text: "Quý thầy cô và các bạn học sinh dùng bữa trưa tại nhà hàng.",
          },
        ],
        afternoon: [
          {
            timeLabel: "2h30",
            text:
              "Quý thầy cô và các bạn học sinh tự do tham quan và vui chơi tại Khu du lịch Đại Nam:\n• Tham quan Đại Nam Quốc Tự.\n• Vui chơi tại Cổng biển nhân tạo Đại Nam.\n• Tham quan Vườn Bách Thú.\n• Trải nghiệm các trò chơi cảm giác mạnh.",
          },
          {
            timeLabel: "15:30",
            text: "Khởi hành về lại điểm hẹn.",
          },
        ],
      },
      menu: {
        morning: [{ text: "Bún bò/ Hủ tiếu nam vang, Trà đá" }],
        lunch: [{ text: "Phở bò, Bún bò, Bánh canh, Trà đá" }],
        afternoon: [],
      },
    };

    const withMerge = buildOneDayItineraryPayload(lunchInMorningDraft, {
      mergeMenuIntoItinerary: true,
    });

    expect(withMerge["morning_block"].text).toContain(
      "11 giờ 30:\nQuý thầy cô và các bạn học sinh dùng bữa trưa tại nhà hàng.\nMón ăn: Phở bò, Bún bò, Bánh canh\nNước uống: Trà đá",
    );
    expect(withMerge["afternoon_block"].text).not.toContain(
      "Món ăn: Phở bò, Bún bò, Bánh canh",
    );
    expect(withMerge["afternoon_block"].text).not.toContain("Nước uống: Trà đá");
    expect(withMerge["afternoon_block"].text).toContain(
      "02 giờ 30:\nSau khi dùng bữa, Quý thầy cô và các bạn học sinh tự do tham quan và vui chơi tại Khu du lịch Đại Nam:",
    );
  });
});

describe("buildFourDayItineraryPayload — day3 split", () => {
  function makeDraft(day3Items: { text: string }[]) {
    return {
      title: "ĐỒNG THÁP - NHA TRANG - ĐÀ LẠT",
      tourDate: "24-27/5/2026",
      itinerary: {
        night1: [{ text: "Xe đón Quý đoàn tại điểm hẹn." }],
        day1: [{ text: "Tham quan Bãi Kính." }],
        day2: [{ text: "Làm việc với địa phương." }],
        day3: day3Items,
        day4: [{ text: "Về lại điểm đón." }],
      },
    };
  }

  it("splits 6 day3 activities evenly: day3a=3, day3b=3", () => {
    const draft = makeDraft([
      { text: "A1" }, { text: "A2" }, { text: "A3" },
      { text: "A4" }, { text: "A5" }, { text: "A6" },
    ]);
    const result = buildFourDayItineraryPayload(draft);
    expect(result["day3a_block"].text).toContain("A1");
    expect(result["day3a_block"].text).toContain("A3");
    expect(result["day3a_block"].text).not.toContain("A4");
    expect(result["day3b_block"].text).toContain("A4");
    expect(result["day3b_block"].text).toContain("A6");
    expect(result["day3b_block"].text).not.toContain("A3");
  });

  it("splits 5 day3 activities: day3a=3 (ceil), day3b=2", () => {
    const draft = makeDraft([
      { text: "A1" }, { text: "A2" }, { text: "A3" },
      { text: "A4" }, { text: "A5" },
    ]);
    const result = buildFourDayItineraryPayload(draft);
    expect(result["day3a_block"].text).toContain("A3");
    expect(result["day3a_block"].text).not.toContain("A4");
    expect(result["day3b_block"].text).toContain("A4");
    expect(result["day3b_block"].text).toContain("A5");
  });

  it("splits 1 day3 activity: day3a has it, day3b is empty", () => {
    const draft = makeDraft([{ text: "Solo" }]);
    const result = buildFourDayItineraryPayload(draft);
    expect(result["day3a_block"].text).toContain("Solo");
    expect(result["day3b_block"].text).toBe("");
  });

  it("handles 0 day3 activities: both blocks empty", () => {
    const draft = makeDraft([]);
    const result = buildFourDayItineraryPayload(draft);
    expect(result["day3a_block"].text).toBe("");
    expect(result["day3b_block"].text).toBe("");
  });

  it("appends Kết thúc chương trình! only to day4", () => {
    const draft = makeDraft([{ text: "Hoạt động ngày 3." }]);
    const result = buildFourDayItineraryPayload(draft);
    expect(result["day4_block"].text).toContain("Kết thúc chương trình!");
    expect(result["day3b_block"].text).not.toContain("Kết thúc chương trình!");
    expect(result["night1_block"].text).not.toContain("Kết thúc chương trình!");
  });

  it("populates all 7 blocks (night1, day1-4, day3a, day3b)", () => {
    const draft = makeDraft([{ text: "Ngày 3 hoạt động." }]);
    const result = buildFourDayItineraryPayload(draft);
    expect(result["night1_block"].text).toContain("Xe đón");
    expect(result["day1_block"].text).toContain("Bãi Kính");
    expect(result["day2_block"].text).toContain("địa phương");
    expect(result["day4_block"].text).toContain("điểm đón");
    expect("day3_block" in result).toBe(false);
  });
});
