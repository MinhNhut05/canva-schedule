import "server-only";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  structuredDraftSchema,
  type StructuredDraft,
} from "@/lib/ai/extraction-schema";
import { violationsToReviewFlags } from "@/lib/rules/engine";
import type { RuleViolation } from "@/lib/rules/types";
import { AI_STATUS, REVIEW_STATUS } from "./status";

export interface CanvaGenerationOptions {
  mergeMenuIntoItinerary: boolean;
}

export const DEFAULT_CANVA_GENERATION_OPTIONS: CanvaGenerationOptions = {
  mergeMenuIntoItinerary: false,
};

function normalizeCanvaGenerationOptions(value: unknown): CanvaGenerationOptions {
  if (!value || typeof value !== "object") {
    return { ...DEFAULT_CANVA_GENERATION_OPTIONS };
  }

  const candidate = value as { mergeMenuIntoItinerary?: unknown };

  return {
    mergeMenuIntoItinerary: candidate.mergeMenuIntoItinerary === true,
  };
}

export async function saveDraft(
  uploadId: string,
  draft: StructuredDraft,
  aiModel: string,
  attemptCount: number,
  ruleViolations: RuleViolation[] = [],
) {
  const reviewFlags = collectReviewFlags(draft);
  const ruleFlags = violationsToReviewFlags(ruleViolations);
  const mergedFlags = [...new Set([...reviewFlags, ...ruleFlags])];

  await prisma.upload.update({
    where: { id: uploadId },
    data: {
      structuredDraft: draft as Prisma.InputJsonValue,
      reviewFlags: mergedFlags,
      aiStatus: AI_STATUS.READY_FOR_REVIEW,
      reviewStatus: REVIEW_STATUS.PENDING_REVIEW,
      aiModel,
      aiAttemptCount: attemptCount,
      clientType: draft.clientType ?? null,
      tourDuration: draft.duration,
      aiErrorMessage: null,
    },
  });
}

export async function saveAiFailure(
  uploadId: string,
  errorMessage: string,
  attemptCount: number,
) {
  await prisma.upload.update({
    where: { id: uploadId },
    data: {
      aiStatus: AI_STATUS.FAILED,
      aiErrorMessage: errorMessage,
      aiAttemptCount: attemptCount,
    },
  });
}

export async function getDraft(uploadId: string): Promise<StructuredDraft | null> {
  const upload = await prisma.upload.findUnique({
    where: { id: uploadId },
    select: { structuredDraft: true },
  });

  if (!upload?.structuredDraft) return null;

  const parsed = structuredDraftSchema.safeParse(upload.structuredDraft);
  return parsed.success ? parsed.data : null;
}

export async function getCanvaGenerationOptions(
  uploadId: string,
): Promise<CanvaGenerationOptions> {
  const upload = await prisma.upload.findUnique({
    where: { id: uploadId },
    select: { canvaOptions: true },
  });

  return normalizeCanvaGenerationOptions(upload?.canvaOptions);
}

export async function saveCanvaGenerationOptions(
  uploadId: string,
  input: Partial<CanvaGenerationOptions>,
): Promise<CanvaGenerationOptions> {
  const current = await getCanvaGenerationOptions(uploadId);
  const next: CanvaGenerationOptions = {
    ...current,
    ...input,
    mergeMenuIntoItinerary:
      input.mergeMenuIntoItinerary ?? current.mergeMenuIntoItinerary,
  };

  await prisma.upload.update({
    where: { id: uploadId },
    data: {
      canvaOptions: next as unknown as Prisma.InputJsonValue,
    },
  });

  return next;
}

export function getOneDayMenuMergeWarning(
  draft: StructuredDraft,
  options: CanvaGenerationOptions,
): string | null {
  if (draft.duration !== "ONE_DAY" || !options.mergeMenuIntoItinerary) {
    return null;
  }

  const morningBlock = [
    ...draft.itinerary.morning.map((activity) => activity.text.trim()),
    ...draft.menu.morning.map((item) => item.text.trim()),
  ]
    .filter(Boolean)
    .join("\n");

  const afternoonBlock = [
    ...draft.itinerary.afternoon.map((activity) => activity.text.trim()),
    ...draft.menu.lunch.map((item) => item.text.trim()),
    ...draft.menu.afternoon.map((item) => item.text.trim()),
  ]
    .filter(Boolean)
    .join("\n");

  const totalMenuItems =
    draft.menu.morning.length + draft.menu.lunch.length + draft.menu.afternoon.length;
  const totalMenuChars = [...draft.menu.morning, ...draft.menu.lunch, ...draft.menu.afternoon]
    .map((item) => item.text.trim())
    .filter(Boolean)
    .reduce((sum, value) => sum + value.length, 0);
  const longestBlockLength = Math.max(morningBlock.length, afternoonBlock.length);
  const hasDenseItineraryBlock =
    draft.itinerary.morning.some((activity) => activity.text.includes("\n")) ||
    draft.itinerary.afternoon.some((activity) => activity.text.includes("\n"));

  const likelyOverflow =
    totalMenuItems >= 3 ||
    totalMenuChars >= 120 ||
    longestBlockLength >= 280 ||
    (hasDenseItineraryBlock && totalMenuItems >= 2);

  if (!likelyOverflow) {
    return null;
  }

  return "Đang bật nhập menu vào lịch trình. Nội dung 1 ngày hiện có thể quá dài cho mẫu Canva. Nếu thấy bố cục bị tràn, hãy tắt tùy chọn này hoặc rút gọn câu chữ trước khi tạo.";
}

export async function approveDraft(uploadId: string) {
  await prisma.upload.update({
    where: { id: uploadId },
    data: {
      reviewStatus: REVIEW_STATUS.APPROVED,
      approvedAt: new Date(),
    },
  });
}

function collectReviewFlags(draft: StructuredDraft): string[] {
  const flags: string[] = [];

  if (!draft.title) flags.push("missing_title");
  if (!draft.clientName) flags.push("missing_client_name");
  if (!draft.tourDate) flags.push("missing_tour_date");
  if (!draft.pickupLocation) flags.push("missing_pickup_location");
  if (!draft.returnLocation) flags.push("missing_return_location");
  if (!draft.clientType) flags.push("missing_client_type");
  if (!draft.greetingText) flags.push("missing_greeting");

  if (draft.clientType === "SCHOOL" && !draft.schoolName) {
    flags.push("missing_school_name");
  }

  // Collect field-level review flags
  const activities =
    draft.duration === "ONE_DAY"
      ? [...draft.itinerary.morning, ...draft.itinerary.afternoon]
      : [...draft.itinerary.day1, ...draft.itinerary.day2];

  for (const activity of activities) {
    if (activity.needsReview) {
      flags.push("activity_needs_review");
      break;
    }
  }

  return [...new Set([...flags, ...draft.reviewFlags])];
}
