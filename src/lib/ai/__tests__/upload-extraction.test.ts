import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const {
  applyRules,
  extractTour,
  saveAiFailure,
  saveDraft,
  uploadUpdate,
} = vi.hoisted(() => ({
  applyRules: vi.fn(),
  extractTour: vi.fn(),
  saveAiFailure: vi.fn(),
  saveDraft: vi.fn(),
  uploadUpdate: vi.fn(),
}));

vi.mock("@/lib/ai/extract-tour", () => ({
  extractTour,
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    upload: {
      update: uploadUpdate,
    },
  },
}));

vi.mock("@/lib/review/draft", () => ({
  saveAiFailure,
  saveDraft,
}));

vi.mock("@/lib/review/status", () => ({
  AI_STATUS: {
    PROCESSING: "PROCESSING",
  },
}));

vi.mock("@/lib/rules/engine", () => ({
  applyRules,
}));

import { runUploadAiExtraction } from "@/lib/ai/upload-extraction";

const draft = {
  duration: "ONE_DAY",
  reviewFlags: [],
  itinerary: {
    morning: [{ text: "Khoi hanh", sourceConfidence: "high", needsReview: false }],
    afternoon: [{ text: "Ve diem don", sourceConfidence: "high", needsReview: false }],
  },
  menu: {
    morning: [],
    lunch: [],
    afternoon: [],
  },
};

describe("runUploadAiExtraction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    uploadUpdate.mockResolvedValue({});
    saveAiFailure.mockResolvedValue(undefined);
    saveDraft.mockResolvedValue(undefined);
    applyRules.mockReturnValue({
      correctedDraft: draft,
      violations: [],
      autoFixCount: 0,
      needsReviewCount: 0,
    });
  });

  it("persists a rules-checked draft for extracted upload text", async () => {
    extractTour.mockResolvedValue({
      draft,
      model: "oc/deepseek-v4-flash-free",
      attemptCount: 2,
    });

    await expect(
      runUploadAiExtraction("upload-success", "  Noi dung tour  "),
    ).resolves.toEqual({ success: true });

    expect(uploadUpdate).toHaveBeenCalledWith({
      where: { id: "upload-success" },
      data: {
        aiStatus: "PROCESSING",
        aiErrorMessage: null,
      },
    });
    expect(extractTour).toHaveBeenCalledWith("Noi dung tour");
    expect(applyRules).toHaveBeenCalledWith(draft);
    expect(saveDraft).toHaveBeenCalledWith(
      "upload-success",
      draft,
      "oc/deepseek-v4-flash-free",
      2,
      [],
    );
    expect(saveAiFailure).not.toHaveBeenCalled();
  });

  it("marks AI extraction failed when upload text is blank", async () => {
    await expect(runUploadAiExtraction("upload-empty", "   ")).resolves.toEqual({
      success: false,
      error: "Khong co van ban goc de trich xuat AI.",
    });

    expect(uploadUpdate).not.toHaveBeenCalled();
    expect(extractTour).not.toHaveBeenCalled();
    expect(saveAiFailure).toHaveBeenCalledWith(
      "upload-empty",
      "Khong co van ban goc de trich xuat AI.",
      1,
    );
  });

  it("stores the AI error when extraction fails", async () => {
    extractTour.mockRejectedValue(new Error("Request was aborted."));

    await expect(
      runUploadAiExtraction("upload-failed", "Noi dung tour"),
    ).resolves.toEqual({
      success: false,
      error: "Request was aborted.",
    });

    expect(saveDraft).not.toHaveBeenCalled();
    expect(saveAiFailure).toHaveBeenCalledWith(
      "upload-failed",
      "Request was aborted.",
      1,
    );
  });
});
