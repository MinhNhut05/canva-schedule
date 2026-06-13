"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { runUploadAiExtraction } from "@/lib/ai/upload-extraction";
import { auth } from "@/lib/auth";
import {
  generateArtifact,
  getArtifactsForUpload,
  resolveArtifactUrls,
  type ArtifactResult,
} from "@/lib/canva/adapter";
import {
  resolveTemplatePair,
  type ArtifactKind,
  type TourDuration,
} from "@/lib/canva/template-resolver";
import { getGlobalCooldown, getRemainingCooldownSeconds } from "@/lib/canva/cooldown";
import { getLatestShareJobSummaries, shareJobSummaryKey } from "@/lib/canva/share-jobs";
import {
  buildOneDayItineraryPayload,
  buildOneDayMenuPayload,
  buildTwoDayItineraryPayload,
  buildTwoDayMenuPayload,
  buildThreeDayItineraryPayload,
  buildThreeDayMenuPayload,
  buildFourDayItineraryPayload,
  buildFourDayMenuPayload,
} from "@/lib/canva/payload";
import { prisma } from "@/lib/db";
import {
  approveDraft as persistApproval,
  getCanvaGenerationOptions,
  getDraft,
  getOneDayMenuMergeWarning,
  parseStructuredDraft,
  saveCanvaGenerationOptions as persistCanvaGenerationOptions,
  type CanvaGenerationOptions,
} from "@/lib/review/draft";

type GenerateCanvaResponse = {
  success: boolean;
  results: ArtifactResult[];
  error?: string;
  isRateLimited?: boolean;
  cooldownSeconds?: number;
};

const activeCanvaGenerationByUpload = new Map<
  string,
  Promise<GenerateCanvaResponse>
>();

function setByPath(obj: unknown, path: string, value: unknown): unknown {
  const clone = JSON.parse(JSON.stringify(obj));
  const keys = path.split(".");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let current: any = clone;

  for (let index = 0; index < keys.length - 1; index += 1) {
    const key = /^\d+$/.test(keys[index]) ? Number(keys[index]) : keys[index];

    if (current[key] === undefined || current[key] === null) {
      return clone;
    }

    current = current[key];
  }

  const lastKey = keys[keys.length - 1];
  const finalKey = /^\d+$/.test(lastKey) ? Number(lastKey) : lastKey;
  current[finalKey] = value;

  return clone;
}

function isTourDuration(value: string | null | undefined): value is TourDuration {
  return value === "ONE_DAY" || value === "TWO_DAY" || value === "THREE_DAY" || value === "FOUR_DAY";
}

function getArtifactLabel(kind: ArtifactKind) {
  return kind === "ITINERARY" ? "Lịch trình" : "Thực đơn";
}

function buildArtifactPayload(
  duration: TourDuration,
  kind: ArtifactKind,
  draft: Awaited<ReturnType<typeof getDraft>>,
  canvaOptions?: CanvaGenerationOptions,
) {
  if (kind === "ITINERARY") {
    if (duration === "ONE_DAY") return buildOneDayItineraryPayload(draft, canvaOptions);
    if (duration === "THREE_DAY") return buildThreeDayItineraryPayload(draft);
    if (duration === "FOUR_DAY") return buildFourDayItineraryPayload(draft);
    return buildTwoDayItineraryPayload(draft);
  }

  if (duration === "ONE_DAY") return buildOneDayMenuPayload(draft);
  if (duration === "THREE_DAY") return buildThreeDayMenuPayload(draft);
  if (duration === "FOUR_DAY") return buildFourDayMenuPayload(draft);
  return buildTwoDayMenuPayload(draft);
}

async function requireAuth() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  return session.user.id;
}

async function requireSessionUser() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  return {
    id: session.user.id,
    role: session.user.role ?? "member",
  };
}

async function getAuthorizedUpload(uploadId: string) {
  const userId = await requireAuth();

  if (!userId) {
    return { userId: null, upload: null };
  }

  const upload = await prisma.upload.findFirst({
    where: { id: uploadId, userId },
    select: {
      id: true,
      reviewStatus: true,
      tourDuration: true,
    },
  });

  return { userId, upload };
}

async function getUploadForRead(uploadId: string) {
  const user = await requireSessionUser();

  if (!user) {
    return { userId: null, upload: null };
  }

  const upload = await prisma.upload.findFirst({
    where: {
      id: uploadId,
      ...(user.role === "admin" ? {} : { userId: user.id }),
    },
    select: {
      id: true,
      reviewStatus: true,
      tourDuration: true,
      userId: true,
    },
  });

  return { userId: user.id, upload };
}

export async function saveDraftField(
  uploadId: string,
  fieldPath: string,
  newValue: string,
): Promise<{ success: boolean; error?: string }> {
  const userId = await requireAuth();

  if (!userId) {
    return { success: false, error: "Phien dang nhap het han." };
  }

  const upload = await prisma.upload.findFirst({
    where: { id: uploadId, userId },
    select: { structuredDraft: true },
  });

  if (!upload?.structuredDraft) {
    return { success: false, error: "Khong tim thay ban nhap." };
  }

  const updated = setByPath(upload.structuredDraft, fieldPath, newValue);
  const parsed = parseStructuredDraft(updated);

  if (!parsed.success) {
    const issue = parsed.error.issues[0];

    return {
      success: false,
      error: `Gia tri khong hop le: ${issue?.path.join(".")}: ${issue?.message}`,
    };
  }

  await prisma.upload.update({
    where: { id: uploadId },
    data: {
      structuredDraft: parsed.data as Prisma.InputJsonValue,
    },
  });

  revalidatePath(`/review/${uploadId}`);
  return { success: true };
}

export async function approveDraft(
  uploadId: string,
): Promise<{ success: boolean; error?: string }> {
  const userId = await requireAuth();

  if (!userId) {
    return { success: false, error: "Phien dang nhap het han." };
  }

  const upload = await prisma.upload.findFirst({
    where: { id: uploadId, userId },
    select: { id: true, structuredDraft: true },
  });

  if (!upload) {
    return { success: false, error: "Khong tim thay tai lieu." };
  }

  if (!upload.structuredDraft) {
    return { success: false, error: "Chua co noi dung de duyet." };
  }

  await persistApproval(uploadId);

  revalidatePath(`/review/${uploadId}`);
  return { success: true };
}

export async function saveCanvaGenerationOptions(
  uploadId: string,
  mergeMenuIntoItinerary: boolean,
): Promise<{
  success: boolean;
  options?: CanvaGenerationOptions;
  warningMessage?: string | null;
  error?: string;
}> {
  const userId = await requireAuth();

  if (!userId) {
    return { success: false, error: "Phiên đăng nhập hết hạn." };
  }

  const upload = await prisma.upload.findFirst({
    where: { id: uploadId, userId },
    select: { id: true, tourDuration: true },
  });

  if (!upload) {
    return { success: false, error: "Không tìm thấy tài liệu." };
  }

  if (upload.tourDuration !== "ONE_DAY") {
    return {
      success: false,
      error: "Tùy chọn này chỉ áp dụng cho tour 1 ngày.",
    };
  }

  const draft = await getDraft(uploadId);

  if (!draft || draft.duration !== "ONE_DAY") {
    return { success: false, error: "Không tìm thấy bản nháp tour 1 ngày." };
  }

  const options = await persistCanvaGenerationOptions(uploadId, {
    mergeMenuIntoItinerary,
  });
  const warningMessage = getOneDayMenuMergeWarning(draft, options);

  revalidatePath(`/review/${uploadId}`);

  return {
    success: true,
    options,
    warningMessage,
  };
}

export async function generateCanva(uploadId: string): Promise<GenerateCanvaResponse> {
  const { userId, upload } = await getAuthorizedUpload(uploadId);

  if (!userId) {
    return {
      success: false,
      results: [],
      error: "Phiên đăng nhập hết hạn.",
    };
  }

  if (!upload) {
    return {
      success: false,
      results: [],
      error: "Không tìm thấy tài liệu.",
    };
  }

  if (upload.reviewStatus !== "APPROVED") {
    return {
      success: false,
      results: [],
      error: "Nội dung chưa được duyệt.",
    };
  }

  const activeRequest = activeCanvaGenerationByUpload.get(uploadId);

  if (activeRequest) {
    return activeRequest;
  }

  const request = runGenerateCanva(uploadId);
  activeCanvaGenerationByUpload.set(uploadId, request);

  const cleanup = () => {
    if (activeCanvaGenerationByUpload.get(uploadId) === request) {
      activeCanvaGenerationByUpload.delete(uploadId);
    }
  };

  void request.then(cleanup, cleanup);

  return request;
}

async function runGenerateCanva(uploadId: string): Promise<GenerateCanvaResponse> {
  const { userId, upload } = await getAuthorizedUpload(uploadId);

  if (!userId) {
    return {
      success: false,
      results: [],
      error: "Phiên đăng nhập hết hạn.",
    };
  }

  if (!upload) {
    return {
      success: false,
      results: [],
      error: "Không tìm thấy tài liệu.",
    };
  }

  if (upload.reviewStatus !== "APPROVED") {
    return {
      success: false,
      results: [],
      error: "Nội dung chưa được duyệt.",
    };
  }

  try {
    const draft = await getDraft(uploadId);

    if (!draft) {
      return {
        success: false,
        results: [],
        error: "Không tìm thấy bản nháp.",
      };
    }

    if (!isTourDuration(upload.tourDuration)) {
      return {
        success: false,
        results: [],
        error: "Loại tour không hợp lệ.",
      };
    }

    // Check global cooldown (D-10)
    const cooldownUntil = await getGlobalCooldown();
    if (cooldownUntil) {
      const remaining = getRemainingCooldownSeconds(cooldownUntil);
      return {
        success: false,
        results: [],
        error: "Canva dang trong thoi gian cho. Vui long doi.",
        isRateLimited: true,
        cooldownSeconds: remaining,
      };
    }

    const oneDayCanvaOptions =
      upload.tourDuration === "ONE_DAY"
        ? await getCanvaGenerationOptions(uploadId)
        : undefined;

    const pair = await resolveTemplatePair(upload.tourDuration);
    const itineraryPayload = buildArtifactPayload(
      upload.tourDuration,
      "ITINERARY",
      draft,
      oneDayCanvaOptions,
    );
    const menuPayload = buildArtifactPayload(upload.tourDuration, "MENU", draft);

    const [itineraryResult, menuResult] = await Promise.allSettled([
      generateArtifact({
        uploadId,
        duration: upload.tourDuration,
        kind: "ITINERARY",
        data: itineraryPayload,
        title: `SileTravel - ${pair.displayLabel} - Lịch trình`,
      }),
      generateArtifact({
        uploadId,
        duration: upload.tourDuration,
        kind: "MENU",
        data: menuPayload,
        title: `SileTravel - ${pair.displayLabel} - Thực đơn`,
      }),
    ]);

    const results: ArtifactResult[] = [
      itineraryResult.status === "fulfilled"
        ? itineraryResult.value
        : {
            artifactType: "ITINERARY",
            status: "FAILED",
            errorMessage:
              itineraryResult.reason instanceof Error
                ? itineraryResult.reason.message
                : "Lỗi không xác định",
          },
      menuResult.status === "fulfilled"
        ? menuResult.value
        : {
            artifactType: "MENU",
            status: "FAILED",
            errorMessage:
              menuResult.reason instanceof Error
                ? menuResult.reason.message
                : "Lỗi không xác định",
          },
    ];

    const rateLimited = results.find((result) => result.isRateLimited);

    revalidatePath(`/review/${uploadId}`);

    return {
      success: results.some((result) => result.status === "SUCCEEDED"),
      results,
      isRateLimited: Boolean(rateLimited),
      cooldownSeconds: rateLimited?.cooldownSeconds,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Có lỗi xảy ra khi tạo Canva.";

    console.error("[Review generateCanva] failed", {
      uploadId,
      userId,
      reviewStatus: upload.reviewStatus,
      tourDuration: upload.tourDuration,
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

    return {
      success: false,
      results: [],
      error: message,
    };
  }
}

export async function retryCanvaArtifact(
  uploadId: string,
  kind: ArtifactKind,
): Promise<ArtifactResult> {
  const { userId, upload } = await getAuthorizedUpload(uploadId);

  if (!userId) {
    return {
      artifactType: kind,
      status: "FAILED",
      errorMessage: "Phiên đăng nhập hết hạn.",
    };
  }

  if (!upload || upload.reviewStatus !== "APPROVED") {
    return {
      artifactType: kind,
      status: "FAILED",
      errorMessage: "Nội dung chưa được duyệt.",
    };
  }

  const draft = await getDraft(uploadId);

  if (!draft) {
    return {
      artifactType: kind,
      status: "FAILED",
      errorMessage: "Không tìm thấy bản nháp.",
    };
  }

  if (!isTourDuration(upload.tourDuration)) {
    return {
      artifactType: kind,
      status: "FAILED",
      errorMessage: "Loại tour không hợp lệ.",
    };
  }

  // Check global cooldown (D-10)
  const cooldownUntil = await getGlobalCooldown();
  if (cooldownUntil) {
    return {
      artifactType: kind,
      status: "FAILED",
      errorMessage: "Canva dang trong thoi gian cho.",
      isRateLimited: true,
      cooldownSeconds: getRemainingCooldownSeconds(cooldownUntil),
    };
  }

  const oneDayCanvaOptions =
    upload.tourDuration === "ONE_DAY" && kind === "ITINERARY"
      ? await getCanvaGenerationOptions(uploadId)
      : undefined;

  const pair = await resolveTemplatePair(upload.tourDuration);
  const payload = buildArtifactPayload(
    upload.tourDuration,
    kind,
    draft,
    oneDayCanvaOptions,
  );

  const result = await generateArtifact({
    uploadId,
    duration: upload.tourDuration,
    kind,
    data: payload,
    title: `SileTravel - ${pair.displayLabel} - ${getArtifactLabel(kind)}`,
  });

  revalidatePath(`/review/${uploadId}`);
  return result;
}

export async function loadCanvaArtifacts(uploadId: string) {
  const { userId, upload } = await getUploadForRead(uploadId);

  if (!userId || !upload) {
    return [];
  }

  const [artifacts, shareJobs] = await Promise.all([
    getArtifactsForUpload(uploadId),
    getLatestShareJobSummaries(uploadId),
  ]);

  return Promise.all(
    artifacts.map(async (artifact) => {
      if (artifact.status === "SUCCEEDED" && artifact.designId) {
        try {
          const urls = await resolveArtifactUrls(artifact.designId);

          return {
            ...artifact,
            editUrl: urls.editUrl,
            viewUrl: urls.viewUrl,
            thumbnailUrl: urls.thumbnailUrl,
            shareJob: shareJobs.get(shareJobSummaryKey(artifact.artifactType, artifact.designId)) ?? null,
          };
        } catch {
          return {
            ...artifact,
            editUrl: "",
            viewUrl: "",
            thumbnailUrl: undefined,
            shareJob: shareJobs.get(shareJobSummaryKey(artifact.artifactType, artifact.designId)) ?? null,
          };
        }
      }

      return {
        ...artifact,
        editUrl: "",
        viewUrl: "",
        thumbnailUrl: undefined,
        shareJob: null,
      };
    }),
  );
}

export async function reExtractDraft(
  uploadId: string,
): Promise<{ success: boolean; error?: string }> {
  const userId = await requireAuth();

  if (!userId) {
    return { success: false, error: "Phien dang nhap het han." };
  }

  const upload = await prisma.upload.findFirst({
    where: { id: uploadId, userId },
    select: { id: true, normalizedText: true },
  });

  if (!upload?.normalizedText) {
    return {
      success: false,
      error: "Khong co van ban goc de trich xuat lai.",
    };
  }

  try {
    const result = await runUploadAiExtraction(uploadId, upload.normalizedText);
    revalidatePath(`/review/${uploadId}`);

    if (!result.success) {
      return { success: false, error: result.error };
    }

    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Co loi xay ra khi trich xuat lai.";

    console.error("[Review reExtractDraft] failed", {
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

    revalidatePath(`/review/${uploadId}`);
    return { success: false, error: message };
  }
}
