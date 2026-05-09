import "server-only";

import { extractTour } from "@/lib/ai/extract-tour";
import { prisma } from "@/lib/db";
import { saveAiFailure, saveDraft } from "@/lib/review/draft";
import { AI_STATUS } from "@/lib/review/status";
import { applyRules } from "@/lib/rules/engine";

interface UploadExtractionResult {
  success: boolean;
  error?: string;
}

const activeExtractionByUpload = new Map<
  string,
  Promise<UploadExtractionResult>
>();

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Co loi xay ra khi trich xuat AI.";
}

async function persistAiFailure(
  uploadId: string,
  message: string,
): Promise<UploadExtractionResult> {
  await saveAiFailure(uploadId, message, 1);
  return { success: false, error: message };
}

async function extractAndPersistUploadDraft(
  uploadId: string,
  normalizedText: string,
): Promise<UploadExtractionResult> {
  const text = normalizedText.trim();

  if (!text) {
    return persistAiFailure(
      uploadId,
      "Khong co van ban goc de trich xuat AI.",
    );
  }

  await prisma.upload.update({
    where: { id: uploadId },
    data: {
      aiStatus: AI_STATUS.PROCESSING,
      aiErrorMessage: null,
    },
  });

  try {
    const aiResult = await extractTour(text);
    const ruleResult = applyRules(aiResult.draft);

    await saveDraft(
      uploadId,
      ruleResult.correctedDraft,
      aiResult.model,
      aiResult.attemptCount,
      ruleResult.violations,
    );

    return { success: true };
  } catch (error) {
    const message = getErrorMessage(error);

    console.error("[Upload AI extraction] failed", {
      uploadId,
      message,
      error:
        error instanceof Error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
            }
          : error,
    });

    return persistAiFailure(uploadId, message);
  }
}

export function runUploadAiExtraction(
  uploadId: string,
  normalizedText: string,
): Promise<UploadExtractionResult> {
  const activeRequest = activeExtractionByUpload.get(uploadId);

  if (activeRequest) {
    return activeRequest;
  }

  const request = extractAndPersistUploadDraft(uploadId, normalizedText).finally(
    () => {
      if (activeExtractionByUpload.get(uploadId) === request) {
        activeExtractionByUpload.delete(uploadId);
      }
    },
  );

  activeExtractionByUpload.set(uploadId, request);
  return request;
}

export function startUploadAiExtraction(
  uploadId: string,
  normalizedText: string,
): void {
  void runUploadAiExtraction(uploadId, normalizedText).catch((error) => {
    console.error("[Upload AI extraction] unhandled failure", {
      uploadId,
      error:
        error instanceof Error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
            }
          : error,
    });
  });
}
