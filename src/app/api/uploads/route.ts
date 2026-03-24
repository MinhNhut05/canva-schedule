import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { validateFile } from "@/lib/documents/intake";
import type { UploadApiResponse } from "@/lib/documents/types";

export const runtime = "nodejs";

const AUTH_ERROR =
  "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.";
const GENERIC_ERROR = "Có lỗi xảy ra khi xử lý file. Vui lòng thử lại sau.";

export async function POST(request: Request) {
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

    if (!validation.valid || !file) {
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
      },
    });

    // TRANSITIONAL: Plan 02-05 replaces this stub with runExtractionPipeline() output
    return NextResponse.json<UploadApiResponse>(
      {
        success: true,
        data: {
          uploadId: upload.id,
          kind: validation.kind!,
          originalFileName: file.name,
          mime: validation.detectedMime!,
          sizeBytes: file.size,
          rawText: "", // TRANSITIONAL: empty until extraction pipeline
          normalizedText: "", // TRANSITIONAL: empty until extraction pipeline
          warnings: [],
          quality: { score: 0, level: "good", flags: [] }, // TRANSITIONAL
          processingTimeMs: 0,
        },
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json<UploadApiResponse>(
      {
        success: false,
        error: GENERIC_ERROR,
      },
      { status: 500 }
    );
  }
}
