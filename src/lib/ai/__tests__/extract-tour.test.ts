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
  programName: "CHƯƠNG TRÌNH HƯỚNG NGHIỆP TÌM HIỂU NGÀNH NGHỀ",
  title: "SÓC TRĂNG – CẦN THƠ",
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

const PHASE7_ONE_DAY_RESPONSE = JSON.stringify({
  duration: "ONE_DAY",
  programName: "CHƯƠNG TRÌNH TRẢI NGHIỆM NGOẠI KHÓA",
  title: "LONG TUYỀN 2 - SUỐI TIÊN",
  clientType: "SCHOOL",
  schoolName: "Trường tiểu học Long Tuyền 2",
  greetingText: "Quý thầy cô và các bạn học sinh",
  reviewFlags: [],
  itinerary: {
    morning: [
      {
        timeLabel: "6:00",
        text: "Khởi hành đi Khu di tích Bến Nhà Rồng.",
        sourceConfidence: "high",
        needsReview: false,
      },
    ],
    afternoon: [
      {
        timeLabel: "13:00",
        text:
          "Quý thầy cô và các bạn học sinh tự do tham quan và vui chơi tại Công viên văn hóa Suối Tiên:\n• Tham quan các khu chủ đề nổi bật.\n• Trải nghiệm trò chơi phù hợp.\n• Tập trung theo hướng dẫn của đoàn.",
        sourceConfidence: "high",
        needsReview: false,
      },
      {
        timeLabel: "15:30",
        text: "Khởi hành về Trường tiểu học Long Tuyền 2.",
        sourceConfidence: "high",
        needsReview: false,
      },
    ],
  },
  menu: {
    morning: [],
    lunch: [{ text: "Cơm trưa", needsReview: false }],
    afternoon: [],
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
    expect(result.draft.programName).toBe("CHƯƠNG TRÌNH HƯỚNG NGHIỆP TÌM HIỂU NGÀNH NGHỀ");
    expect(result.draft.title).toBe("SÓC TRĂNG – CẦN THƠ");
    expect(result.model).toBe("gpt-5.4");
    expect(result.attemptCount).toBe(1);
  });

  it("sends reusable source-fidelity guidance in the extraction prompt", async () => {
    mockCallApi.mockResolvedValueOnce({
      content: VALID_ONE_DAY_RESPONSE,
      model: "gpt-5.4",
      attemptCount: 1,
    });

    await extractTour("Sample tour text");

    const systemPrompt = mockCallApi.mock.calls[0]?.[0]?.systemPrompt;
    expect(systemPrompt).toContain(
      'Không được rút còn "Khởi hành đi." hoặc "Khởi hành về."',
    );
    expect(systemPrompt).toContain(
      "Áp dụng cho mọi loại tour: ưu tiên giữ wording gần văn bản nguồn",
    );
    expect(systemPrompt).toContain(
      'Không gộp "Món ăn", "Món uống", "Nước uống" thành một dòng nếu nguồn tách riêng.',
    );
    expect(systemPrompt).toContain(
      "hãy dùng tên đơn vị/địa điểm ngắn gọn làm \"pickupLocation\"",
    );
    expect(systemPrompt).toContain(
      "Không rút gọn thành \"bao gồm các hoạt động vô cùng hấp dẫn\" rồi bỏ danh sách hoạt động.",
    );
    expect(systemPrompt).toContain(
      "Không đưa tên nhà hàng hoặc địa điểm ăn uống thành item menu dạng \"Món ăn: Nhà hàng...\".",
    );
    expect(systemPrompt).toContain(
      'Giữ các cụm như "chọn 1 trong các món", "miễn phí", "hơn 200 món ăn chế biến sẵn các loại", "tại hồ", "không giới hạn"',
    );
    expect(systemPrompt).toContain(
      'đặt "sourceConfidence" là "low" hoặc "medium", và bật "needsReview": true.',
    );
  });

  it("preserves canonical one-day program name and destination-rich wording", async () => {
    mockCallApi.mockResolvedValueOnce({
      content: PHASE7_ONE_DAY_RESPONSE,
      model: "gpt-5.4",
      attemptCount: 1,
    });

    const result = await extractTour("Canonical one-day sample");

    expect(result.draft.programName).toBe("CHƯƠNG TRÌNH TRẢI NGHIỆM NGOẠI KHÓA");
    expect(result.draft.title).toBe("LONG TUYỀN 2 - SUỐI TIÊN");

    if (result.draft.duration !== "ONE_DAY") {
      throw new Error("Expected ONE_DAY draft");
    }

    expect(result.draft.itinerary.afternoon[0].text).toContain(
      "Công viên văn hóa Suối Tiên:",
    );
    expect(result.draft.itinerary.afternoon[0].text).not.toContain(
      "Sau khi dùng bữa trưa",
    );
    expect(result.draft.itinerary.afternoon[1].text).toBe(
      "Khởi hành về Trường tiểu học Long Tuyền 2.",
    );
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
    expect(result.draft.programName).toBeUndefined();
    expect(result.draft.title).toBeUndefined();
    expect(result.draft.clientName).toBeUndefined();
    expect(result.draft.schoolName).toBeUndefined();
    expect(result.draft.tourDate).toBeUndefined();
  });
});
