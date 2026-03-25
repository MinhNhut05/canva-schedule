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
