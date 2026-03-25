export const AI_STATUS = {
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  READY_FOR_REVIEW: "READY_FOR_REVIEW",
  FAILED: "FAILED",
} as const;

export type AiStatus = (typeof AI_STATUS)[keyof typeof AI_STATUS];

export const REVIEW_STATUS = {
  PENDING_REVIEW: "PENDING_REVIEW",
  REVIEWED: "REVIEWED",
  APPROVED: "APPROVED",
} as const;

export type ReviewStatus = (typeof REVIEW_STATUS)[keyof typeof REVIEW_STATUS];
