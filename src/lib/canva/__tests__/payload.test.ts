import { describe, it, expect } from "vitest";

import {
  buildOneDayItineraryPayload,
  buildOneDayMenuPayload,
  buildTwoDayItineraryPayload,
  buildTwoDayMenuPayload,
} from "@/lib/canva/payload";
import { MAX_SLOTS_PER_SECTION } from "@/lib/canva/field-map";

// Helper to build a mock activity list
function makeActivities(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    text: `activity_${i + 1}`,
  }));
}

function makeMenuItems(count: number) {
  return Array.from({ length: count }, (_, i) => ({ text: `item_${i + 1}` }));
}

const sharedDraft = {
  title: "Tour THPT Cai Nuoc",
  clientName: "THPT Cai Nuoc",
  tourDate: "2026-03-25",
  greetingText: "Quý thầy cô và các bạn học sinh",
  pickupLocation: "Trường THPT Cai Nuoc",
  returnLocation: "Trường THPT Cai Nuoc",
};

function assertSharedFields(data: Record<string, { type: string; text: string }>) {
  expect(data["title"]).toEqual({ type: "text", text: "Tour THPT Cai Nuoc" });
  expect(data["client_name"]).toEqual({ type: "text", text: "THPT Cai Nuoc" });
  expect(data["tour_date"]).toEqual({ type: "text", text: "2026-03-25" });
  expect(data["greeting_text"]).toEqual({
    type: "text",
    text: "Quý thầy cô và các bạn học sinh",
  });
  expect(data["pickup_location"]).toEqual({
    type: "text",
    text: "Trường THPT Cai Nuoc",
  });
  expect(data["return_location"]).toEqual({
    type: "text",
    text: "Trường THPT Cai Nuoc",
  });
}

// --------------------------------------------------------------------------
// buildOneDayItineraryPayload
// --------------------------------------------------------------------------
describe("buildOneDayItineraryPayload", () => {
  it("includes shared fields", () => {
    const draft = {
      ...sharedDraft,
      itinerary: { morning: [], afternoon: [] },
    };
    const data = buildOneDayItineraryPayload(draft);
    assertSharedFields(data);
  });

  it("produces morning_1..morning_7 fields", () => {
    const draft = {
      ...sharedDraft,
      itinerary: { morning: makeActivities(3), afternoon: [] },
    };
    const data = buildOneDayItineraryPayload(draft);
    for (let i = 1; i <= MAX_SLOTS_PER_SECTION; i++) {
      expect(data[`morning_${i}`]).toBeDefined();
      expect(data[`morning_${i}`].type).toBe("text");
    }
  });

  it("produces afternoon_1..afternoon_7 fields", () => {
    const draft = {
      ...sharedDraft,
      itinerary: { morning: [], afternoon: makeActivities(3) },
    };
    const data = buildOneDayItineraryPayload(draft);
    for (let i = 1; i <= MAX_SLOTS_PER_SECTION; i++) {
      expect(data[`afternoon_${i}`]).toBeDefined();
      expect(data[`afternoon_${i}`].type).toBe("text");
    }
  });

  it("pads with empty string when activities < 7", () => {
    const draft = {
      ...sharedDraft,
      itinerary: { morning: makeActivities(2), afternoon: [] },
    };
    const data = buildOneDayItineraryPayload(draft);
    expect(data["morning_1"].text).toBe("activity_1");
    expect(data["morning_2"].text).toBe("activity_2");
    expect(data["morning_3"].text).toBe("");
    expect(data["morning_7"].text).toBe("");
  });

  it("truncates to 7 when activities > 7", () => {
    const draft = {
      ...sharedDraft,
      itinerary: { morning: makeActivities(10), afternoon: [] },
    };
    const data = buildOneDayItineraryPayload(draft);
    expect(data["morning_7"].text).toBe("activity_7");
    expect(data["morning_8"]).toBeUndefined();
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

  it("produces menu_morning_1..7, menu_lunch_1..7, menu_afternoon_1..7 fields", () => {
    const draft = {
      ...sharedDraft,
      menu: {
        morning: makeMenuItems(2),
        lunch: makeMenuItems(3),
        afternoon: makeMenuItems(1),
      },
    };
    const data = buildOneDayMenuPayload(draft);
    for (let i = 1; i <= MAX_SLOTS_PER_SECTION; i++) {
      expect(data[`menu_morning_${i}`]).toBeDefined();
      expect(data[`menu_lunch_${i}`]).toBeDefined();
      expect(data[`menu_afternoon_${i}`]).toBeDefined();
    }
  });

  it("pads lunch with empty strings when items < 7", () => {
    const draft = {
      ...sharedDraft,
      menu: { morning: [], lunch: makeMenuItems(1), afternoon: [] },
    };
    const data = buildOneDayMenuPayload(draft);
    expect(data["menu_lunch_1"].text).toBe("item_1");
    expect(data["menu_lunch_2"].text).toBe("");
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

  it("produces day1_1..day1_7 and day2_1..day2_7 fields", () => {
    const draft = {
      ...sharedDraft,
      itinerary: { day1: makeActivities(4), day2: makeActivities(3) },
    };
    const data = buildTwoDayItineraryPayload(draft);
    for (let i = 1; i <= MAX_SLOTS_PER_SECTION; i++) {
      expect(data[`day1_${i}`]).toBeDefined();
      expect(data[`day2_${i}`]).toBeDefined();
    }
  });

  it("pads with empty string when activities < 7", () => {
    const draft = {
      ...sharedDraft,
      itinerary: { day1: makeActivities(2), day2: [] },
    };
    const data = buildTwoDayItineraryPayload(draft);
    expect(data["day1_1"].text).toBe("activity_1");
    expect(data["day1_3"].text).toBe("");
    expect(data["day2_1"].text).toBe("");
  });

  it("truncates to 7 when activities > 7", () => {
    const draft = {
      ...sharedDraft,
      itinerary: { day1: makeActivities(10), day2: [] },
    };
    const data = buildTwoDayItineraryPayload(draft);
    expect(data["day1_7"].text).toBe("activity_7");
    expect(data["day1_8"]).toBeUndefined();
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

  it("produces menu_day1_1..7 and menu_day2_1..7 fields", () => {
    const draft = {
      ...sharedDraft,
      menu: { day1: makeMenuItems(3), day2: makeMenuItems(2) },
    };
    const data = buildTwoDayMenuPayload(draft);
    for (let i = 1; i <= MAX_SLOTS_PER_SECTION; i++) {
      expect(data[`menu_day1_${i}`]).toBeDefined();
      expect(data[`menu_day2_${i}`]).toBeDefined();
    }
  });

  it("pads with empty string when items < 7", () => {
    const draft = {
      ...sharedDraft,
      menu: { day1: makeMenuItems(1), day2: [] },
    };
    const data = buildTwoDayMenuPayload(draft);
    expect(data["menu_day1_1"].text).toBe("item_1");
    expect(data["menu_day1_2"].text).toBe("");
    expect(data["menu_day2_1"].text).toBe("");
  });

  it("truncates to 7 when items > 7", () => {
    const draft = {
      ...sharedDraft,
      menu: { day1: makeMenuItems(10), day2: [] },
    };
    const data = buildTwoDayMenuPayload(draft);
    expect(data["menu_day1_7"].text).toBe("item_7");
    expect(data["menu_day1_8"]).toBeUndefined();
  });
});
