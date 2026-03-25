import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

// Mock the extraction client to avoid real API calls
vi.mock("../extraction-client", () => ({
  callExtractionApi: vi.fn(),
  AI_MODEL: "gpt-5.4",
}));

// Must import after mock setup
import { extractTour } from "../extract-tour";
import { callExtractionApi } from "../extraction-client";

const mockCallApi = vi.mocked(callExtractionApi);

const VALID_ONE_DAY_RESPONSE = JSON.stringify({
  duration: "ONE_DAY",
  title: "Tour Vũng Tàu",
  clientType: "SCHOOL",
  schoolName: "THPT Trần Đại Nghĩa",
  greetingText: "Quý thầy cô và các bạn học sinh",
  reviewFlags: [],
  itinerary: {
    morning: [{ text: "Khởi hành", sourceConfidence: "high", needsReview: false }],
    afternoon: [{ text: "Về trường", sourceConfidence: "high", needsReview: false }],
  },
  menu: {
    morning: [{ text: "Bánh mì", needsReview: false }],
    lunch: [{ text: "Cơm", needsReview: false }],
    afternoon: [{ text: "Nước", needsReview: false }],
  },
});

describe("extractTour", () => {
  beforeEach(() => {
    mockCallApi.mockReset();
  });

  it("returns parsed StructuredDraft for valid AI response", async () => {
    mockCallApi.mockResolvedValueOnce({
      content: VALID_ONE_DAY_RESPONSE,
      model: "gpt-5.4",
      attemptCount: 1,
    });

    const result = await extractTour("Sample tour text");
    expect(result.draft.duration).toBe("ONE_DAY");
    expect(result.model).toBe("gpt-5.4");
    expect(result.attemptCount).toBe(1);
  });

  it("throws on empty input text", async () => {
    await expect(extractTour("")).rejects.toThrow(
      "Không có văn bản để trích xuất",
    );
  });

  it("throws on whitespace-only input text", async () => {
    await expect(extractTour("   ")).rejects.toThrow(
      "Không có văn bản để trích xuất",
    );
  });

  it("throws when AI returns invalid JSON", async () => {
    mockCallApi.mockResolvedValueOnce({
      content: "This is not JSON",
      model: "gpt-5.4",
      attemptCount: 1,
    });

    await expect(extractTour("Sample text")).rejects.toThrow(
      "không đúng định dạng JSON",
    );
  });

  it("throws when AI returns JSON that fails schema validation (SAFE-02)", async () => {
    mockCallApi.mockResolvedValueOnce({
      content: JSON.stringify({ duration: "THREE_DAY", itinerary: {} }),
      model: "gpt-5.4",
      attemptCount: 1,
    });

    await expect(extractTour("Sample text")).rejects.toThrow(
      "không khớp cấu trúc yêu cầu",
    );
  });

  it("preserves needsReview flags from AI response (AI-05)", async () => {
    const responseWithFlags = JSON.stringify({
      duration: "ONE_DAY",
      reviewFlags: ["uncertain_date"],
      itinerary: {
        morning: [{ text: "Khởi hành", sourceConfidence: "low", needsReview: true }],
        afternoon: [{ text: "Về", sourceConfidence: "high", needsReview: false }],
      },
      menu: { morning: [], lunch: [], afternoon: [] },
    });

    mockCallApi.mockResolvedValueOnce({
      content: responseWithFlags,
      model: "gpt-5.4",
      attemptCount: 1,
    });

    const result = await extractTour("Sample text");
    expect(result.draft.duration).toBe("ONE_DAY");

    if (result.draft.duration !== "ONE_DAY") {
      throw new Error("Expected ONE_DAY draft");
    }

    expect(result.draft.itinerary.morning[0].needsReview).toBe(true);
    expect(result.draft.itinerary.morning[0].sourceConfidence).toBe("low");
    expect(result.draft.reviewFlags).toContain("uncertain_date");
  });

  it("leaves optional fields blank when AI omits them (AI-05)", async () => {
    const minimalResponse = JSON.stringify({
      duration: "ONE_DAY",
      itinerary: {
        morning: [{ text: "Khởi hành", sourceConfidence: "high" }],
        afternoon: [{ text: "Về", sourceConfidence: "high" }],
      },
      menu: { morning: [], lunch: [], afternoon: [] },
    });

    mockCallApi.mockResolvedValueOnce({
      content: minimalResponse,
      model: "gpt-5.4",
      attemptCount: 1,
    });

    const result = await extractTour("Sample text");
    expect(result.draft.title).toBeUndefined();
    expect(result.draft.clientName).toBeUndefined();
    expect(result.draft.schoolName).toBeUndefined();
    expect(result.draft.tourDate).toBeUndefined();
  });
});
