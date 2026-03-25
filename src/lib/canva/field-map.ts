// Canonical field-name manifest — user sets up matching fields in Canva templates.
// Each key is the Canva dataset field name; value type is always "text".

export const SHARED_FIELDS = [
  "title",
  "client_name",
  "tour_date",
  "greeting_text",
  "pickup_location",
  "return_location",
] as const;

export const ONE_DAY_ITINERARY_FIELDS = [
  ...SHARED_FIELDS,
  ...Array.from({ length: 7 }, (_, i) => `morning_${i + 1}` as const),
  ...Array.from({ length: 7 }, (_, i) => `afternoon_${i + 1}` as const),
] as const;

export const ONE_DAY_MENU_FIELDS = [
  ...SHARED_FIELDS,
  ...Array.from({ length: 7 }, (_, i) => `menu_morning_${i + 1}` as const),
  ...Array.from({ length: 7 }, (_, i) => `menu_lunch_${i + 1}` as const),
  ...Array.from({ length: 7 }, (_, i) => `menu_afternoon_${i + 1}` as const),
] as const;

export const TWO_DAY_ITINERARY_FIELDS = [
  ...SHARED_FIELDS,
  ...Array.from({ length: 7 }, (_, i) => `day1_${i + 1}` as const),
  ...Array.from({ length: 7 }, (_, i) => `day2_${i + 1}` as const),
] as const;

export const TWO_DAY_MENU_FIELDS = [
  ...SHARED_FIELDS,
  ...Array.from({ length: 7 }, (_, i) => `menu_day1_${i + 1}` as const),
  ...Array.from({ length: 7 }, (_, i) => `menu_day2_${i + 1}` as const),
] as const;

export const MAX_SLOTS_PER_SECTION = 7;
