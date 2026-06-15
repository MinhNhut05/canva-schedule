import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const {
  auth,
  findFirst,
  update,
  generateArtifact,
  getArtifactsForUpload,
  resolveArtifactUrls,
  getLatestShareJobSummaries,
  shareJobSummaryKey,
  resolveTemplatePair,
  buildOneDayItineraryPayload,
  buildOneDayMenuPayload,
  buildTwoDayItineraryPayload,
  buildTwoDayMenuPayload,
  buildThreeDayItineraryPayload,
  buildThreeDayMenuPayload,
  buildFourDayItineraryPayload,
  buildFourDayMenuPayload,
  getCanvaGenerationOptions,
  getGlobalCooldown,
  getRemainingCooldownSeconds,
  getDraft,
  getOneDayMenuMergeWarning,
  parseStructuredDraft,
  persistCanvaGenerationOptions,
  runUploadAiExtraction,
  revalidatePath,
} = vi.hoisted(() => ({
  auth: vi.fn(),
  findFirst: vi.fn(),
  update: vi.fn(),
  generateArtifact: vi.fn(),
  getArtifactsForUpload: vi.fn(),
  resolveArtifactUrls: vi.fn(),
  getLatestShareJobSummaries: vi.fn(),
  shareJobSummaryKey: vi.fn((artifactType: string, designId: string) => `${artifactType}:${designId}`),
  resolveTemplatePair: vi.fn(async (duration: "ONE_DAY" | "TWO_DAY" | "THREE_DAY") => ({
    duration,
    itineraryTemplateId: `${duration}-itinerary-template`,
    menuTemplateId: `${duration}-menu-template`,
    displayLabel:
      duration === "ONE_DAY"
        ? "Tour 1 ngày"
        : duration === "TWO_DAY"
          ? "Tour 2 ngày"
          : "Tour 3 ngày",
  })),
  buildOneDayItineraryPayload: vi.fn(() => ({ itinerary: { type: "text", text: "one-day-itinerary" } })),
  buildOneDayMenuPayload: vi.fn(() => ({ menu: { type: "text", text: "one-day-menu" } })),
  buildTwoDayItineraryPayload: vi.fn(() => ({ itinerary: { type: "text", text: "two-day-itinerary" } })),
  buildTwoDayMenuPayload: vi.fn(() => ({ menu: { type: "text", text: "two-day-menu" } })),
  buildThreeDayItineraryPayload: vi.fn(() => ({ itinerary: { type: "text", text: "three-day-itinerary" } })),
  buildThreeDayMenuPayload: vi.fn(() => ({ menu: { type: "text", text: "three-day-menu" } })),
  buildFourDayItineraryPayload: vi.fn(() => ({ itinerary: { type: "text", text: "four-day-itinerary" } })),
  buildFourDayMenuPayload: vi.fn(() => ({ menu: { type: "text", text: "four-day-menu" } })),
  getCanvaGenerationOptions: vi.fn(),
  getGlobalCooldown: vi.fn(),
  getRemainingCooldownSeconds: vi.fn(() => 60),
  getDraft: vi.fn(),
  getOneDayMenuMergeWarning: vi.fn(),
  parseStructuredDraft: vi.fn((value) => ({ success: true, data: value })),
  persistCanvaGenerationOptions: vi.fn(),
  runUploadAiExtraction: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath,
}));

vi.mock("@/lib/auth", () => ({
  auth,
}));

vi.mock("@/lib/db", () => {
  const prisma = {
    upload: {
      findFirst,
      update,
    },
    canvaToken: {
      findFirst: vi.fn().mockResolvedValue(null),
    },
  };
  return { prisma, db: prisma };
});

vi.mock("@/lib/canva/adapter", () => ({
  generateArtifact,
  getArtifactsForUpload,
  resolveArtifactUrls,
}));

vi.mock("@/lib/canva/share-jobs", () => ({
  getLatestShareJobSummaries,
  shareJobSummaryKey,
}));

vi.mock("@/lib/canva/cooldown", () => ({
  getGlobalCooldown,
  getRemainingCooldownSeconds,
}));

vi.mock("@/lib/canva/template-resolver", () => ({
  resolveTemplatePair,
}));

vi.mock("@/lib/canva/payload", () => ({
  buildOneDayItineraryPayload,
  buildOneDayMenuPayload,
  buildTwoDayItineraryPayload,
  buildTwoDayMenuPayload,
  buildThreeDayItineraryPayload,
  buildThreeDayMenuPayload,
  buildFourDayItineraryPayload,
  buildFourDayMenuPayload,
}));

vi.mock("@/lib/review/draft", () => ({
  getCanvaGenerationOptions,
  getDraft,
  getOneDayMenuMergeWarning,
  parseStructuredDraft,
  approveDraft: vi.fn(),
  saveCanvaGenerationOptions: persistCanvaGenerationOptions,
  saveDraft: vi.fn(),
}));

vi.mock("@/lib/ai/upload-extraction", () => ({
  runUploadAiExtraction,
}));

vi.mock("@/lib/review/status", () => ({
  AI_STATUS: {
    PROCESSING: "PROCESSING",
    FAILED: "FAILED",
  },
}));

import {
  generateCanva,
  loadCanvaArtifacts,
  retryCanvaArtifact,
  saveCanvaGenerationOptions,
} from "@/app/(app)/review/[id]/actions";

const approvedOneDayUpload = {
  id: "upload-1",
  reviewStatus: "APPROVED",
  tourDuration: "ONE_DAY",
};

const oneDayDraft = {
  duration: "ONE_DAY",
  title: "Tour sample",
  clientName: "THCS An Thanh Tay",
  itinerary: { morning: [], afternoon: [] },
  menu: { morning: [], lunch: [], afternoon: [] },
};

const approvedThreeDayUpload = {
  id: "upload-1",
  reviewStatus: "APPROVED",
  tourDuration: "THREE_DAY",
};

const threeDayDraft = {
  duration: "THREE_DAY",
  title: "Tour sample",
  clientName: "THCS An Thanh Tay",
  itinerary: { day1: [], day2: [], day3: [] },
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
};

describe("review actions canva flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.mockResolvedValue({ user: { id: "user-1" } });
    getCanvaGenerationOptions.mockResolvedValue({ mergeMenuIntoItinerary: false });
    getDraft.mockResolvedValue(oneDayDraft);
    getOneDayMenuMergeWarning.mockReturnValue(null);
    persistCanvaGenerationOptions.mockResolvedValue({ mergeMenuIntoItinerary: false });
    getLatestShareJobSummaries.mockResolvedValue(new Map());
    getGlobalCooldown.mockResolvedValue(null);
    getRemainingCooldownSeconds.mockReturnValue(60);
    findFirst.mockResolvedValue(approvedOneDayUpload);
  });

  it("saveCanvaGenerationOptions persists the per-upload choice and returns warning state", async () => {
    findFirst.mockResolvedValueOnce({
      id: "upload-1",
      tourDuration: "ONE_DAY",
    });
    persistCanvaGenerationOptions.mockResolvedValueOnce({
      mergeMenuIntoItinerary: true,
    });
    getOneDayMenuMergeWarning.mockReturnValueOnce(
      "Đang bật nhập menu vào lịch trình.",
    );

    await expect(saveCanvaGenerationOptions("upload-1", true)).resolves.toEqual({
      success: true,
      options: { mergeMenuIntoItinerary: true },
      warningMessage: "Đang bật nhập menu vào lịch trình.",
    });

    expect(persistCanvaGenerationOptions).toHaveBeenCalledWith("upload-1", {
      mergeMenuIntoItinerary: true,
    });
    expect(getOneDayMenuMergeWarning).toHaveBeenCalledWith(oneDayDraft, {
      mergeMenuIntoItinerary: true,
    });
    expect(revalidatePath).toHaveBeenCalledWith("/review/upload-1");
  });

  it("generateCanva returns error if upload is not APPROVED", async () => {
    findFirst.mockResolvedValueOnce({
      id: "upload-1",
      reviewStatus: "PENDING_REVIEW",
      tourDuration: "ONE_DAY",
    });

    await expect(generateCanva("upload-1")).resolves.toEqual({
      success: false,
      results: [],
      error: "Nội dung chưa được duyệt.",
    });
    expect(generateArtifact).not.toHaveBeenCalled();
  });

  it("generateCanva calls both payload builders and generates in parallel", async () => {
    const itineraryResult = {
      artifactType: "ITINERARY",
      status: "SUCCEEDED",
      designId: "design-itinerary",
      editUrl: "https://canva.com/edit/itinerary",
    };
    const menuResult = {
      artifactType: "MENU",
      status: "SUCCEEDED",
      designId: "design-menu",
      editUrl: "https://canva.com/edit/menu",
    };

    generateArtifact
      .mockResolvedValueOnce(itineraryResult)
      .mockResolvedValueOnce(menuResult);

    const result = await generateCanva("upload-1");

    expect(getCanvaGenerationOptions).toHaveBeenCalledWith("upload-1");
    expect(buildOneDayItineraryPayload).toHaveBeenCalledWith(oneDayDraft, {
      mergeMenuIntoItinerary: false,
    });
    expect(buildOneDayMenuPayload).toHaveBeenCalledWith(oneDayDraft);
    expect(resolveTemplatePair).toHaveBeenCalledWith("ONE_DAY");
    expect(generateArtifact).toHaveBeenCalledTimes(2);
    expect(generateArtifact).toHaveBeenNthCalledWith(1, {
      uploadId: "upload-1",
      duration: "ONE_DAY",
      kind: "ITINERARY",
      data: { itinerary: { type: "text", text: "one-day-itinerary" } },
      title: "SileTravel - Tour 1 ngày - Lịch trình",
    });
    expect(generateArtifact).toHaveBeenNthCalledWith(2, {
      uploadId: "upload-1",
      duration: "ONE_DAY",
      kind: "MENU",
      data: { menu: { type: "text", text: "one-day-menu" } },
      title: "SileTravel - Tour 1 ngày - Thực đơn",
    });
    expect(result).toEqual({
      success: true,
      results: [itineraryResult, menuResult],
      isRateLimited: false,
      cooldownSeconds: undefined,
    });
  });

  it("generateCanva uses three-day payload builders", async () => {
    findFirst
      .mockResolvedValueOnce(approvedThreeDayUpload)
      .mockResolvedValueOnce(approvedThreeDayUpload);
    getDraft.mockResolvedValueOnce(threeDayDraft);
    generateArtifact
      .mockResolvedValueOnce({
        artifactType: "ITINERARY",
        status: "SUCCEEDED",
        designId: "design-itinerary",
      })
      .mockResolvedValueOnce({
        artifactType: "MENU",
        status: "SUCCEEDED",
        designId: "design-menu",
      });

    const result = await generateCanva("upload-1");

    expect(buildThreeDayItineraryPayload).toHaveBeenCalledWith(threeDayDraft);
    expect(buildThreeDayMenuPayload).toHaveBeenCalledWith(threeDayDraft);
    expect(resolveTemplatePair).toHaveBeenCalledWith("THREE_DAY");
    expect(generateArtifact).toHaveBeenNthCalledWith(1, {
      uploadId: "upload-1",
      duration: "THREE_DAY",
      kind: "ITINERARY",
      data: { itinerary: { type: "text", text: "three-day-itinerary" } },
      title: "SileTravel - Tour 3 ngày - Lịch trình",
    });
    expect(generateArtifact).toHaveBeenNthCalledWith(2, {
      uploadId: "upload-1",
      duration: "THREE_DAY",
      kind: "MENU",
      data: { menu: { type: "text", text: "three-day-menu" } },
      title: "SileTravel - Tour 3 ngày - Thực đơn",
    });
    expect(result.success).toBe(true);
  });

  it("deduplicates concurrent generateCanva calls for the same upload", async () => {
    let resolveItinerary:
      | ((value: {
          artifactType: "ITINERARY";
          status: "SUCCEEDED";
          designId: string;
        }) => void)
      | undefined;
    let resolveMenu:
      | ((value: {
          artifactType: "MENU";
          status: "SUCCEEDED";
          designId: string;
        }) => void)
      | undefined;

    generateArtifact
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveItinerary = resolve as typeof resolveItinerary;
          })
      )
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveMenu = resolve as typeof resolveMenu;
          })
      );

    const firstRequest = generateCanva("upload-1");
    const secondRequest = generateCanva("upload-1");

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(generateArtifact).toHaveBeenCalledTimes(2);

    resolveItinerary?.({
      artifactType: "ITINERARY",
      status: "SUCCEEDED",
      designId: "design-itinerary",
    });
    resolveMenu?.({
      artifactType: "MENU",
      status: "SUCCEEDED",
      designId: "design-menu",
    });

    const [firstResult, secondResult] = await Promise.all([
      firstRequest,
      secondRequest,
    ]);

    expect(firstResult).toEqual(secondResult);
    expect(generateArtifact).toHaveBeenCalledTimes(2);
  });

  it("generateCanva handles partial success when one artifact fails", async () => {
    generateArtifact
      .mockResolvedValueOnce({
        artifactType: "ITINERARY",
        status: "SUCCEEDED",
        designId: "design-itinerary",
      })
      .mockRejectedValueOnce(new Error("Menu failed"));

    const result = await generateCanva("upload-1");

    expect(result.success).toBe(true);
    expect(result.results).toEqual([
      {
        artifactType: "ITINERARY",
        status: "SUCCEEDED",
        designId: "design-itinerary",
      },
      {
        artifactType: "MENU",
        status: "FAILED",
        errorMessage: "Menu failed",
      },
    ]);
  });

  it("retryCanvaArtifact retries single artifact only", async () => {
    generateArtifact.mockResolvedValue({
      artifactType: "MENU",
      status: "SUCCEEDED",
      designId: "design-menu",
    });

    await expect(retryCanvaArtifact("upload-1", "MENU")).resolves.toEqual({
      artifactType: "MENU",
      status: "SUCCEEDED",
      designId: "design-menu",
    });

    expect(buildOneDayMenuPayload).toHaveBeenCalledWith(oneDayDraft);
    expect(buildOneDayItineraryPayload).not.toHaveBeenCalled();
    expect(generateArtifact).toHaveBeenCalledTimes(1);
    expect(generateArtifact).toHaveBeenCalledWith({
      uploadId: "upload-1",
      duration: "ONE_DAY",
      kind: "MENU",
      data: { menu: { type: "text", text: "one-day-menu" } },
      title: "SileTravel - Tour 1 ngày - Thực đơn",
    });
  });

  it("retryCanvaArtifact reuses saved merge options for one-day itinerary payloads", async () => {
    getCanvaGenerationOptions.mockResolvedValueOnce({
      mergeMenuIntoItinerary: true,
    });
    generateArtifact.mockResolvedValue({
      artifactType: "ITINERARY",
      status: "SUCCEEDED",
      designId: "design-itinerary",
    });

    await expect(retryCanvaArtifact("upload-1", "ITINERARY")).resolves.toEqual({
      artifactType: "ITINERARY",
      status: "SUCCEEDED",
      designId: "design-itinerary",
    });

    expect(getCanvaGenerationOptions).toHaveBeenCalledWith("upload-1");
    expect(buildOneDayItineraryPayload).toHaveBeenCalledWith(oneDayDraft, {
      mergeMenuIntoItinerary: true,
    });
    expect(buildOneDayMenuPayload).not.toHaveBeenCalled();
    expect(generateArtifact).toHaveBeenCalledWith({
      uploadId: "upload-1",
      duration: "ONE_DAY",
      kind: "ITINERARY",
      data: { itinerary: { type: "text", text: "one-day-itinerary" } },
      title: "SileTravel - Tour 1 ngày - Lịch trình",
    });
  });

  it("loadCanvaArtifacts resolves fresh URLs for succeeded artifacts", async () => {
    getArtifactsForUpload.mockResolvedValue([
      {
        id: "artifact-1",
        uploadId: "upload-1",
        artifactType: "ITINERARY",
        status: "SUCCEEDED",
        designId: "design-1",
      },
      {
        id: "artifact-2",
        uploadId: "upload-1",
        artifactType: "MENU",
        status: "FAILED",
        designId: null,
      },
    ]);
    resolveArtifactUrls.mockResolvedValue({
      editUrl: "https://canva.com/edit/design-1",
      viewUrl: "https://canva.com/view/design-1",
      thumbnailUrl: "https://cdn.canva.com/design-1.png",
    });
    getLatestShareJobSummaries.mockResolvedValue(
      new Map([
        [
          "ITINERARY:design-1",
          {
            id: "share-job-1",
            status: "PENDING",
            lastError: null,
            updatedAt: new Date("2026-06-01T00:00:00.000Z"),
          },
        ],
      ]),
    );

    await expect(loadCanvaArtifacts("upload-1")).resolves.toEqual([
      {
        id: "artifact-1",
        uploadId: "upload-1",
        artifactType: "ITINERARY",
        status: "SUCCEEDED",
        designId: "design-1",
        editUrl: "https://canva.com/edit/design-1",
        viewUrl: "https://canva.com/view/design-1",
        thumbnailUrl: "https://cdn.canva.com/design-1.png",
        shareJob: {
          id: "share-job-1",
          status: "PENDING",
          lastError: null,
          updatedAt: new Date("2026-06-01T00:00:00.000Z"),
        },
      },
      {
        id: "artifact-2",
        uploadId: "upload-1",
        artifactType: "MENU",
        status: "FAILED",
        designId: null,
        editUrl: "",
        viewUrl: "",
        thumbnailUrl: undefined,
        shareJob: null,
      },
    ]);

    expect(resolveArtifactUrls).toHaveBeenCalledTimes(1);
    expect(resolveArtifactUrls).toHaveBeenCalledWith("design-1");
  });
});
