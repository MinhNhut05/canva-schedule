import "server-only";

import { db } from "@/lib/db";

import { CanvaRateLimitError } from "./client";
import { getFreshDesignUrls, type DesignUrls } from "./designs";
import {
  createDesignFromTemplate,
  pollAutofillJob,
  type CreateDesignResult,
} from "./jobs";
import {
  resolveTemplateId,
  type ArtifactKind,
  type TourDuration,
} from "./template-resolver";

export interface GenerateArtifactInput {
  uploadId: string;
  duration: TourDuration;
  kind: ArtifactKind;
  data: Record<string, { type: "text"; text: string }>;
  title: string;
}

export interface ArtifactResult {
  artifactType: ArtifactKind;
  status: "SUCCEEDED" | "FAILED";
  designId?: string;
  editUrl?: string;
  viewUrl?: string;
  thumbnailUrl?: string;
  errorMessage?: string;
  isRateLimited?: boolean;
  cooldownSeconds?: number;
}

function artifactWhere(input: GenerateArtifactInput) {
  return {
    uploadId_artifactType: {
      uploadId: input.uploadId,
      artifactType: input.kind,
    },
  };
}

async function persistSuccess(
  input: GenerateArtifactInput,
  result: { designId: string }
): Promise<ArtifactResult> {
  const urls = await getFreshDesignUrls(result.designId);

  await db.canvaArtifact.update({
    where: artifactWhere(input),
    data: {
      status: "SUCCEEDED",
      designId: result.designId,
      errorMessage: null,
    },
  });

  return {
    artifactType: input.kind,
    status: "SUCCEEDED",
    designId: result.designId,
    editUrl: urls.editUrl,
    viewUrl: urls.viewUrl,
    thumbnailUrl: urls.thumbnailUrl,
  };
}

export async function generateArtifact(
  input: GenerateArtifactInput
): Promise<ArtifactResult> {
  const templateId = resolveTemplateId(input.duration, input.kind);

  await db.canvaArtifact.upsert({
    where: artifactWhere(input),
    create: {
      uploadId: input.uploadId,
      artifactType: input.kind,
      status: "PROCESSING",
      templateId,
    },
    update: {
      status: "PROCESSING",
      templateId,
      jobId: null,
      designId: null,
      errorMessage: null,
    },
  });

  try {
    const creationResult: CreateDesignResult = await createDesignFromTemplate(
      templateId,
      input.data,
      input.title
    );

    if (creationResult.mode === "design") {
      return persistSuccess(input, { designId: creationResult.designId });
    }

    await db.canvaArtifact.update({
      where: artifactWhere(input),
      data: {
        jobId: creationResult.jobId,
      },
    });

    const result = await pollAutofillJob(creationResult.jobId);
    return persistSuccess(input, result);
  } catch (error) {
    if (error instanceof CanvaRateLimitError) {
      await db.canvaArtifact.update({
        where: artifactWhere(input),
        data: {
          status: "FAILED",
          errorMessage: "RATE_LIMITED",
        },
      });

      return {
        artifactType: input.kind,
        status: "FAILED",
        errorMessage: "RATE_LIMITED",
        isRateLimited: true,
        cooldownSeconds: error.cooldownSeconds,
      };
    }

    const errorMessage =
      error instanceof Error ? error.message : "Unknown Canva generation error";

    await db.canvaArtifact.update({
      where: artifactWhere(input),
      data: {
        status: "FAILED",
        errorMessage,
      },
    });

    return {
      artifactType: input.kind,
      status: "FAILED",
      errorMessage,
    };
  }
}

export async function resolveArtifactUrls(designId: string): Promise<DesignUrls> {
  return getFreshDesignUrls(designId);
}

export async function getArtifactsForUpload(uploadId: string) {
  return db.canvaArtifact.findMany({
    where: { uploadId },
    orderBy: { artifactType: "asc" },
  });
}
