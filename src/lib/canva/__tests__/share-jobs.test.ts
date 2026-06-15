import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { upsert } = vi.hoisted(() => ({
  upsert: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    canvaShareJob: { upsert },
  },
}));

import { enqueueCanvaShareJob, recordCanvaShareEnqueueFailure } from "@/lib/canva/share-jobs";

describe("share-jobs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    upsert.mockImplementation((args) => Promise.resolve(args));
  });

  it("enqueues a pending share job for every generated design", async () => {
    await enqueueCanvaShareJob({
      canvaArtifactId: "artifact-1",
      uploadId: "upload-1",
      artifactType: "ITINERARY",
      designId: "design-1",
      editUrl: "https://canva.com/design/design-1/edit",
    });

    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          targetEmails: [],
          status: "PENDING",
          lastError: null,
        }),
      }),
    );
  });

  it("records enqueue failures as durable warning jobs", async () => {
    await recordCanvaShareEnqueueFailure(
      {
        canvaArtifactId: "artifact-1",
        uploadId: "upload-1",
        artifactType: "ITINERARY",
        designId: "design-1",
        editUrl: "https://canva.com/design/design-1/edit",
      },
      "database unavailable",
    );

    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          targetEmails: [],
          status: "ENQUEUE_FAILED",
          lastError: "database unavailable",
        }),
      }),
    );
  });
});
