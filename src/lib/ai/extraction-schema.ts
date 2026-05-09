import { z } from "zod";

// --- Activity schema (shared) ---
export const activitySchema = z.object({
  timeLabel: z.string().nullish(),
  text: z.string().min(1),
  sourceConfidence: z.enum(["high", "medium", "low"]).default("high"),
  needsReview: z.boolean().default(false),
});

export type Activity = z.infer<typeof activitySchema>;

// --- Menu item schema ---
export const menuItemSchema = z.object({
  text: z.string().min(1),
  needsReview: z.boolean().default(false),
});

export type MenuItem = z.infer<typeof menuItemSchema>;

// --- Client type ---
export const clientTypeSchema = z.enum(["SCHOOL", "GROUP"]);
export type ClientType = z.infer<typeof clientTypeSchema>;

// --- Duration ---
export const tourDurationSchema = z.enum(["ONE_DAY", "TWO_DAY", "THREE_DAY"]);
export type TourDuration = z.infer<typeof tourDurationSchema>;

// --- Common fields (shared between 1-day and 2-day) ---
const commonFieldsSchema = z.object({
  programName: z.string().nullish(),
  title: z.string().nullish(),
  clientName: z.string().nullish(),
  clientType: clientTypeSchema.nullish(),
  schoolName: z.string().nullish(),
  tourDate: z.string().nullish(),
  greetingText: z.string().nullish(),
  pickupLocation: z.string().nullish(),
  returnLocation: z.string().nullish(),
  reviewFlags: z.array(z.string()).default([]),
});

// --- One-day tour schema ---
export const oneDaySchema = commonFieldsSchema.extend({
  duration: z.literal("ONE_DAY"),
  itinerary: z.object({
    morning: z.array(activitySchema),
    afternoon: z.array(activitySchema),
  }),
  menu: z.object({
    morning: z.array(menuItemSchema).default([]),
    lunch: z.array(menuItemSchema).default([]),
    afternoon: z.array(menuItemSchema).default([]),
  }),
});

// --- Two-day tour schema ---
export const twoDaySchema = commonFieldsSchema.extend({
  duration: z.literal("TWO_DAY"),
  itinerary: z.object({
    day1: z.array(activitySchema),
    day2: z.array(activitySchema),
  }),
  menu: z.object({
    morning_day1: z.array(menuItemSchema).default([]),
    lunch_day1: z.array(menuItemSchema).default([]),
    afternoon_day1: z.array(menuItemSchema).default([]),
    morning_day2: z.array(menuItemSchema).default([]),
    lunch_day2: z.array(menuItemSchema).default([]),
    afternoon_day2: z.array(menuItemSchema).default([]),
  }),
});

// --- Three-day tour schema ---
export const threeDaySchema = commonFieldsSchema.extend({
  duration: z.literal("THREE_DAY"),
  itinerary: z.object({
    day1: z.array(activitySchema),
    day2: z.array(activitySchema),
    day3: z.array(activitySchema),
  }),
  menu: z.object({
    morning_day1: z.array(menuItemSchema).default([]),
    lunch_day1: z.array(menuItemSchema).default([]),
    afternoon_day1: z.array(menuItemSchema).default([]),
    morning_day2: z.array(menuItemSchema).default([]),
    lunch_day2: z.array(menuItemSchema).default([]),
    afternoon_day2: z.array(menuItemSchema).default([]),
    morning_day3: z.array(menuItemSchema).default([]),
    lunch_day3: z.array(menuItemSchema).default([]),
    afternoon_day3: z.array(menuItemSchema).default([]),
  }),
});

// --- Discriminated union ---
export const structuredDraftSchema = z.discriminatedUnion("duration", [
  oneDaySchema,
  twoDaySchema,
  threeDaySchema,
]);

export type StructuredDraft = z.infer<typeof structuredDraftSchema>;
export type OneDayDraft = z.infer<typeof oneDaySchema>;
export type TwoDayDraft = z.infer<typeof twoDaySchema>;
export type ThreeDayDraft = z.infer<typeof threeDaySchema>;
