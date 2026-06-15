import "server-only";

import { db } from "@/lib/db";

import type { ArtifactKind } from "./template-resolver";

type ShareJobStatus = "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED" | "SKIPPED" | "ENQUEUE_FAILED" | "DRY_RUN";

interface EnqueueCanvaShareJobInput {
  canvaArtifactId: string;
  uploadId: string;
  artifactType: ArtifactKind;
  designId: string;
  editUrl?: string;
}

export interface CanvaShareJobSummary {
  id: string;
  status: ShareJobStatus;
  lastError: string | null;
  updatedAt: Date;
  /** Canonical public edit URL captured by the bot once sharing SUCCEEDED. */
  editUrl?: string | null;
}

async function upsertCanvaShareJob(
  input: EnqueueCanvaShareJobInput,
  status: ShareJobStatus,
  lastError: string | null,
) {
  return db.canvaShareJob.upsert({
    where: {
      canvaArtifactId_designId: {
        canvaArtifactId: input.canvaArtifactId,
        designId: input.designId,
      },
    },
    create: {
      canvaArtifactId: input.canvaArtifactId,
      uploadId: input.uploadId,
      artifactType: input.artifactType,
      designId: input.designId,
      editUrl: input.editUrl,
      targetEmails: [],
      status,
      lastError,
      finishedAt: null,
    },
    update: {
      editUrl: input.editUrl,
      status,
      lastError,
      lockedUntil: null,
      startedAt: null,
      finishedAt: null,
    },
  });
}

export async function enqueueCanvaShareJob(input: EnqueueCanvaShareJobInput) {
  // Sharing is done by setting the design link to "anyone with the link" (edit),
  // not by inviting internal users per email, so every successfully generated
  // design gets a pending share job for the worker to pick up.
  return upsertCanvaShareJob(input, "PENDING", null);
}

export async function recordCanvaShareEnqueueFailure(
  input: EnqueueCanvaShareJobInput,
  message: string,
) {
  return upsertCanvaShareJob(input, "ENQUEUE_FAILED", message);
}

export function shareJobSummaryKey(artifactType: string, designId: string) {
  return `${artifactType}:${designId}`;
}

export async function getLatestShareJobSummaries(uploadId: string) {
  const jobs = await db.canvaShareJob.findMany({
    where: { uploadId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      artifactType: true,
      designId: true,
      status: true,
      lastError: true,
      updatedAt: true,
      editUrl: true,
    },
  });

  const summaries = new Map<string, CanvaShareJobSummary>();

  for (const job of jobs) {
    const key = shareJobSummaryKey(job.artifactType, job.designId);
    if (summaries.has(key)) continue;

    summaries.set(key, {
      id: job.id,
      status: job.status as ShareJobStatus,
      lastError: job.lastError,
      updatedAt: job.updatedAt,
      editUrl: job.editUrl,
    });
  }

  return summaries;
}
