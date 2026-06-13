import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const {
  upsertArtifact,
  updateArtifact,
  enqueueCanvaShareJob,
  recordCanvaShareEnqueueFailure,
  getFreshDesignUrls,
  createDesignFromTemplate,
  resolveTemplate,
  applyFieldMapping,
} = vi.hoisted(() => ({
  upsertArtifact: vi.fn(),
  updateArtifact: vi.fn(),
  enqueueCanvaShareJob: vi.fn(),
  recordCanvaShareEnqueueFailure: vi.fn(),
  getFreshDesignUrls: vi.fn(),
  createDesignFromTemplate: vi.fn(),
  resolveTemplate: vi.fn(),
  applyFieldMapping: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    canvaArtifact: {
      upsert: upsertArtifact,
      update: updateArtifact,
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/canva/designs", () => ({
  getFreshDesignUrls,
}));

vi.mock("@/lib/canva/jobs", () => ({
  createDesignFromTemplate,
  pollAutofillJob: vi.fn(),
}));

vi.mock("@/lib/canva/share-jobs", () => ({
  enqueueCanvaShareJob,
  recordCanvaShareEnqueueFailure,
}));

vi.mock("@/lib/canva/template-resolver", () => ({
  resolveTemplate,
  applyFieldMapping,
}));

vi.mock("@/lib/canva/cooldown", () => ({
  setGlobalCooldown: vi.fn(),
}));

import { generateArtifact } from "@/lib/canva/adapter";

describe("generateArtifact share enqueue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resolveTemplate.mockResolvedValue({ templateId: "template-1", fieldMapping: {} });
    applyFieldMapping.mockImplementation((data) => data);
    createDesignFromTemplate.mockResolvedValue({ mode: "design", designId: "design-1" });
    getFreshDesignUrls.mockResolvedValue({
      editUrl: "https://canva.com/design/design-1/edit",
      viewUrl: "https://canva.com/design/design-1/view",
      thumbnailUrl: "https://cdn.canva.com/design-1.png",
    });
    upsertArtifact.mockResolvedValue({});
    updateArtifact.mockResolvedValue({ id: "artifact-1" });
  });

  it("keeps generation successful when share job enqueue fails", async () => {
    enqueueCanvaShareJob.mockRejectedValueOnce(new Error("share queue unavailable"));

    await expect(
      generateArtifact({
        uploadId: "upload-1",
        duration: "ONE_DAY",
        kind: "ITINERARY",
        data: { title: { type: "text", text: "Tour" } },
        title: "Generated Canva",
      }),
    ).resolves.toEqual({
      artifactType: "ITINERARY",
      status: "SUCCEEDED",
      designId: "design-1",
      editUrl: "https://canva.com/design/design-1/edit",
      viewUrl: "https://canva.com/design/design-1/view",
      thumbnailUrl: "https://cdn.canva.com/design-1.png",
    });

    const shareJobInput = {
      canvaArtifactId: "artifact-1",
      uploadId: "upload-1",
      artifactType: "ITINERARY",
      designId: "design-1",
      editUrl: "https://canva.com/design/design-1/edit",
    };

    expect(enqueueCanvaShareJob).toHaveBeenCalledWith(shareJobInput);
    expect(recordCanvaShareEnqueueFailure).toHaveBeenCalledWith(
      shareJobInput,
      "share queue unavailable",
    );
  });
});
