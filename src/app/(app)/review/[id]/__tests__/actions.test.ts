import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const {
  auth,
  findFirst,
  update,
  generateArtifact,
  getArtifactsForUpload,
  resolveArtifactUrls,
  resolveTemplatePair,
  buildOneDayItineraryPayload,
  buildOneDayMenuPayload,
  buildTwoDayItineraryPayload,
  buildTwoDayMenuPayload,
  getDraft,
  revalidatePath,
} = vi.hoisted(() => ({
  auth: vi.fn(),
  findFirst: vi.fn(),
  update: vi.fn(),
  generateArtifact: vi.fn(),
  getArtifactsForUpload: vi.fn(),
  resolveArtifactUrls: vi.fn(),
  resolveTemplatePair: vi.fn((duration: "ONE_DAY" | "TWO_DAY") => ({
    duration,
    itineraryTemplateId: `${duration}-itinerary-template`,
    menuTemplateId: `${duration}-menu-template`,
    displayLabel: duration === "ONE_DAY" ? "Tour 1 ngày" : "Tour 2 ngày",
  })),
  buildOneDayItineraryPayload: vi.fn(() => ({ itinerary: { type: "text", text: "one-day-itinerary" } })),
  buildOneDayMenuPayload: vi.fn(() => ({ menu: { type: "text", text: "one-day-menu" } })),
  buildTwoDayItineraryPayload: vi.fn(() => ({ itinerary: { type: "text", text: "two-day-itinerary" } })),
  buildTwoDayMenuPayload: vi.fn(() => ({ menu: { type: "text", text: "two-day-menu" } })),
  getDraft: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath,
}));

vi.mock("@/lib/auth", () => ({
  auth,
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    upload: {
      findFirst,
      update,
    },
  },
}));

vi.mock("@/lib/canva/adapter", () => ({
  generateArtifact,
  getArtifactsForUpload,
  resolveArtifactUrls,
}));

vi.mock("@/lib/canva/template-resolver", () => ({
  resolveTemplatePair,
}));

vi.mock("@/lib/canva/payload", () => ({
  buildOneDayItineraryPayload,
  buildOneDayMenuPayload,
  buildTwoDayItineraryPayload,
  buildTwoDayMenuPayload,
}));

vi.mock("@/lib/review/draft", () => ({
  getDraft,
  approveDraft: vi.fn(),
  saveDraft: vi.fn(),
}));

vi.mock("@/lib/ai/extract-tour", () => ({
  extractTour: vi.fn(),
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

describe("review actions canva flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.mockResolvedValue({ user: { id: "user-1" } });
    getDraft.mockResolvedValue(oneDayDraft);
    findFirst.mockResolvedValue(approvedOneDayUpload);
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

    expect(buildOneDayItineraryPayload).toHaveBeenCalledWith(oneDayDraft);
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
      },
    ]);

    expect(resolveArtifactUrls).toHaveBeenCalledTimes(1);
    expect(resolveArtifactUrls).toHaveBeenCalledWith("design-1");
  });
});
