import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { findMany, upsert } = vi.hoisted(() => ({
  findMany: vi.fn(),
  upsert: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    user: { findMany },
    canvaShareJob: { upsert },
  },
}));

import {
  enqueueCanvaShareJob,
  normalizeShareTargetEmails,
  recordCanvaShareEnqueueFailure,
} from "@/lib/canva/share-jobs";

describe("share-jobs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    upsert.mockImplementation((args) => Promise.resolve(args));
  });

  it("normalizes, trims, lowercases, and dedupes emails", () => {
    expect(
      normalizeShareTargetEmails([
        " Minh@Example.com ",
        "minh@example.com",
        "editor@example.com",
        null,
        "",
      ]),
    ).toEqual(["minh@example.com", "editor@example.com"]);
  });

  it("enqueues a pending share job for internal emails", async () => {
    findMany.mockResolvedValueOnce([
      { email: "Admin@SileTravel.local" },
      { email: "editor@siletravel.local" },
    ]);

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
          targetEmails: ["admin@siletravel.local", "editor@siletravel.local"],
          status: "PENDING",
          lastError: null,
        }),
      }),
    );
  });

  it("marks the share job skipped when no internal emails exist", async () => {
    findMany.mockResolvedValueOnce([]);

    await enqueueCanvaShareJob({
      canvaArtifactId: "artifact-1",
      uploadId: "upload-1",
      artifactType: "MENU",
      designId: "design-1",
    });

    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          targetEmails: [],
          status: "SKIPPED",
          lastError: "Không có email nội bộ để chia sẻ Canva.",
          finishedAt: expect.any(Date),
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
