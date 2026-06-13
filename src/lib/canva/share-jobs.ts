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
  targetCount: number;
  lastError: string | null;
  updatedAt: Date;
}

export function normalizeShareTargetEmails(emails: Array<string | null | undefined>) {
  return Array.from(
    new Set(
      emails
        .map((email) => email?.trim().toLowerCase())
        .filter((email): email is string => Boolean(email)),
    ),
  );
}

export async function getInternalShareTargetEmails() {
  const users = await db.user.findMany({
    where: {
      email: { not: null },
    },
    select: {
      email: true,
    },
  });

  return normalizeShareTargetEmails(users.map((user) => user.email));
}

async function upsertCanvaShareJob(
  input: EnqueueCanvaShareJobInput,
  status: ShareJobStatus,
  targetEmails: string[],
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
      targetEmails,
      status,
      lastError,
      finishedAt: status === "SKIPPED" ? new Date() : null,
    },
    update: {
      editUrl: input.editUrl,
      targetEmails,
      status,
      lastError,
      lockedUntil: null,
      startedAt: null,
      finishedAt: status === "SKIPPED" ? new Date() : null,
    },
  });
}

export async function enqueueCanvaShareJob(input: EnqueueCanvaShareJobInput) {
  const targetEmails = await getInternalShareTargetEmails();
  const status: ShareJobStatus = targetEmails.length > 0 ? "PENDING" : "SKIPPED";
  const lastError = targetEmails.length > 0 ? null : "Không có email nội bộ để chia sẻ Canva.";

  return upsertCanvaShareJob(input, status, targetEmails, lastError);
}

export async function recordCanvaShareEnqueueFailure(
  input: EnqueueCanvaShareJobInput,
  message: string,
) {
  return upsertCanvaShareJob(input, "ENQUEUE_FAILED", [], message);
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
      targetEmails: true,
      lastError: true,
      updatedAt: true,
    },
  });

  const summaries = new Map<string, CanvaShareJobSummary>();

  for (const job of jobs) {
    const key = shareJobSummaryKey(job.artifactType, job.designId);
    if (summaries.has(key)) continue;

    summaries.set(key, {
      id: job.id,
      status: job.status as ShareJobStatus,
      targetCount: job.targetEmails.length,
      lastError: job.lastError,
      updatedAt: job.updatedAt,
    });
  }

  return summaries;
}
