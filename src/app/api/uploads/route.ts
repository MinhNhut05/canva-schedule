import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { validateFile } from "@/lib/documents/intake";
import { runExtractionPipeline } from "@/lib/documents/pipeline";
import { extractTour } from "@/lib/ai/extract-tour";
import { applyRules } from "@/lib/rules/engine";
import { saveDraft, saveAiFailure } from "@/lib/review/draft";
import { AI_STATUS } from "@/lib/review/status";
import type { UploadApiResponse, UploadStatus } from "@/lib/documents/types";

export const runtime = "nodejs";

const AUTH_ERROR =
  "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.";
const GENERIC_ERROR = "Có lỗi xảy ra khi xử lý file. Vui lòng thử lại sau.";
const EXTRACTION_ERROR =
  "Không thể trích xuất nội dung từ file này. Vui lòng thử lại hoặc dùng file nguồn rõ hơn.";

export async function POST(request: Request) {
  let uploadId: string | null = null;

  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json<UploadApiResponse>(
        {
          success: false,
          error: AUTH_ERROR,
        },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const formFile = formData.get("file");
    const file = formFile instanceof File ? formFile : null;
    const validation = await validateFile(file);

    if (!validation.valid || !file || !validation.kind || !validation.detectedMime) {
      return NextResponse.json<UploadApiResponse>(
        {
          success: false,
          error: validation.error,
        },
        { status: 400 }
      );
    }

    const upload = await prisma.upload.create({
      data: {
        userId: session.user.id,
        originalFileName: file.name,
        detectedMime: validation.detectedMime,
        sourceKind: validation.kind,
        sizeBytes: file.size,
        status: "PENDING",
        aiStatus: AI_STATUS.PENDING,
      },
    });

    uploadId = upload.id;

    await prisma.upload.update({
      where: { id: upload.id },
      data: {
        status: "PROCESSING",
        errorMessage: null,
      },
    });

    const fileBytes = new Uint8Array(await file.arrayBuffer());
    const result = await runExtractionPipeline(
      fileBytes,
      file.name,
      validation.kind,
      validation.detectedMime,
      file.size
    );

    const finalStatus: UploadStatus =
      result.quality.level === "good" ? "COMPLETED" : "COMPLETED_WITH_WARNING";

    await prisma.upload.update({
      where: { id: upload.id },
      data: {
        status: finalStatus,
        rawText: result.rawText,
        normalizedText: result.normalizedText,
        qualityScore: result.quality.score,
        qualityLevel: result.quality.level,
        qualityFlags: result.quality.flags,
        warningMessages: result.warnings,
        processingTimeMs: result.processingTimeMs,
        errorMessage: null,
      },
    });

    await prisma.upload.update({
      where: { id: upload.id },
      data: { aiStatus: AI_STATUS.PROCESSING },
    });

    if (result.normalizedText && result.normalizedText.trim().length > 0) {
      try {
        const aiResult = await extractTour(result.normalizedText);
        const ruleResult = applyRules(aiResult.draft);

        await saveDraft(
          upload.id,
          ruleResult.correctedDraft,
          aiResult.model,
          aiResult.attemptCount,
          ruleResult.violations,
        );
      } catch (aiError) {
        const aiMessage =
          aiError instanceof Error
            ? aiError.message
            : "Có lỗi xảy ra khi trích xuất AI.";
        await saveAiFailure(upload.id, aiMessage, 1);
        // AI failure is non-fatal — upload still succeeds, user can re-extract later
      }
    }

    return NextResponse.json<UploadApiResponse>(
      {
        success: true,
        data: {
          uploadId: upload.id,
          ...result,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    if (uploadId) {
      const errorMessage =
        error instanceof Error && error.message.trim().length > 0
          ? error.message
          : EXTRACTION_ERROR;

      await prisma.upload.update({
        where: { id: uploadId },
        data: {
          status: "FAILED",
          errorMessage,
        },
      });
    }

    const message = uploadId ? EXTRACTION_ERROR : GENERIC_ERROR;

    return NextResponse.json<UploadApiResponse>(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
