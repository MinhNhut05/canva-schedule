// Canonical field-name manifest — user sets up matching fields in Canva templates.
// Each key is the Canva dataset field name; value type is always "text".
//
// Schema v3 — block-based fields for both itinerary and menu templates.
// Each section produces a single text block containing all activities/items.
// This keeps Canva template setup simple (1 element per section).

export const SHARED_FIELDS = [
  "title",
  "program_label",
  "tour_date",
] as const;

export const ONE_DAY_ITINERARY_FIELDS = [
  ...SHARED_FIELDS,
  "morning_block",
  "afternoon_block",
] as const;

export const ONE_DAY_MENU_FIELDS = [
  ...SHARED_FIELDS,
  "menu_morning_block",
  "menu_lunch_block",
  "menu_afternoon_block",
] as const;

export const TWO_DAY_ITINERARY_FIELDS = [
  ...SHARED_FIELDS,
  "day1_block",
  "day2_block",
] as const;

export const TWO_DAY_MENU_FIELDS = [
  ...SHARED_FIELDS,
  "menu_day1_block",
  "menu_day2_block",
] as const;

/**
 * Resolve which source fields apply for a given tourDuration + artifactType combo.
 * Pure helper — safe to import from both client and server code.
 */
export function getFieldsForTemplate(
  tourDuration: string,
  artifactType: string,
): readonly string[] {
  if (tourDuration === "ONE_DAY" && artifactType === "ITINERARY") return ONE_DAY_ITINERARY_FIELDS;
  if (tourDuration === "ONE_DAY" && artifactType === "MENU") return ONE_DAY_MENU_FIELDS;
  if (tourDuration === "TWO_DAY" && artifactType === "ITINERARY") return TWO_DAY_ITINERARY_FIELDS;
  if (tourDuration === "TWO_DAY" && artifactType === "MENU") return TWO_DAY_MENU_FIELDS;
  return [];
}
