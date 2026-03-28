import { MAX_SLOTS_PER_SECTION } from "./field-map";

type TextFieldValue = { type: "text"; text: string };
type AutofillData = Record<string, TextFieldValue>;

interface ActivityItem {
  text?: string;
  activity?: string;
}

interface MenuItem {
  text?: string;
  item?: string;
}

interface DraftBase {
  title?: string;
  clientName?: string;
  tourDate?: string;
  greetingText?: string;
  pickupLocation?: string;
  returnLocation?: string;
}

interface OneDayItineraryDraft extends DraftBase {
  itinerary?: {
    morning?: ActivityItem[];
    afternoon?: ActivityItem[];
  };
}

interface OneDayMenuDraft extends DraftBase {
  menu?: {
    morning?: MenuItem[];
    lunch?: MenuItem[];
    afternoon?: MenuItem[];
  };
}

interface TwoDayItineraryDraft extends DraftBase {
  itinerary?: {
    day1?: ActivityItem[];
    day2?: ActivityItem[];
  };
}

interface TwoDayMenuDraft extends DraftBase {
  menu?: {
    day1?: MenuItem[];
    day2?: MenuItem[];
  };
}

// Callers pass Prisma Json (Record<string, unknown> | null), so we accept
// a broad input and cast internally for type-safe field access.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DraftInput = Record<string, any> | null;

function textField(value: string): TextFieldValue {
  return { type: "text", text: value };
}

function toFixedSlots(values: string[], size: number): string[] {
  return Array.from({ length: size }, (_, i) => values[i] ?? "");
}

// Shared fields present in all templates
function sharedFields(draft: DraftBase): AutofillData {
  return {
    title: textField(draft.title ?? ""),
    client_name: textField(draft.clientName ?? ""),
    tour_date: textField(draft.tourDate ?? ""),
    greeting_text: textField(draft.greetingText ?? ""),
    pickup_location: textField(draft.pickupLocation ?? ""),
    return_location: textField(draft.returnLocation ?? ""),
  };
}

export function buildOneDayItineraryPayload(draft: DraftInput): AutofillData {
  const d = (draft ?? {}) as OneDayItineraryDraft;
  const morning = toFixedSlots(
    (d.itinerary?.morning ?? []).map(
      (a) => a.text ?? a.activity ?? ""
    ),
    MAX_SLOTS_PER_SECTION
  );
  const afternoon = toFixedSlots(
    (d.itinerary?.afternoon ?? []).map(
      (a) => a.text ?? a.activity ?? ""
    ),
    MAX_SLOTS_PER_SECTION
  );
  const data: AutofillData = { ...sharedFields(d) };
  morning.forEach((v, i) => {
    data[`morning_${i + 1}`] = textField(v);
  });
  afternoon.forEach((v, i) => {
    data[`afternoon_${i + 1}`] = textField(v);
  });
  return data;
}

export function buildOneDayMenuPayload(draft: DraftInput): AutofillData {
  const d = (draft ?? {}) as OneDayMenuDraft;
  const menuMorning = toFixedSlots(
    (d.menu?.morning ?? []).map((m) => m.text ?? m.item ?? ""),
    MAX_SLOTS_PER_SECTION
  );
  const menuLunch = toFixedSlots(
    (d.menu?.lunch ?? []).map((m) => m.text ?? m.item ?? ""),
    MAX_SLOTS_PER_SECTION
  );
  const menuAfternoon = toFixedSlots(
    (d.menu?.afternoon ?? []).map((m) => m.text ?? m.item ?? ""),
    MAX_SLOTS_PER_SECTION
  );
  const data: AutofillData = { ...sharedFields(d) };
  menuMorning.forEach((v, i) => {
    data[`menu_morning_${i + 1}`] = textField(v);
  });
  menuLunch.forEach((v, i) => {
    data[`menu_lunch_${i + 1}`] = textField(v);
  });
  menuAfternoon.forEach((v, i) => {
    data[`menu_afternoon_${i + 1}`] = textField(v);
  });
  return data;
}

export function buildTwoDayItineraryPayload(draft: DraftInput): AutofillData {
  const d = (draft ?? {}) as TwoDayItineraryDraft;
  const day1 = toFixedSlots(
    (d.itinerary?.day1 ?? []).map((a) => a.text ?? a.activity ?? ""),
    MAX_SLOTS_PER_SECTION
  );
  const day2 = toFixedSlots(
    (d.itinerary?.day2 ?? []).map((a) => a.text ?? a.activity ?? ""),
    MAX_SLOTS_PER_SECTION
  );
  const data: AutofillData = { ...sharedFields(d) };
  day1.forEach((v, i) => {
    data[`day1_${i + 1}`] = textField(v);
  });
  day2.forEach((v, i) => {
    data[`day2_${i + 1}`] = textField(v);
  });
  return data;
}

export function buildTwoDayMenuPayload(draft: DraftInput): AutofillData {
  const d = (draft ?? {}) as TwoDayMenuDraft;
  const menuDay1 = toFixedSlots(
    (d.menu?.day1 ?? []).map((m) => m.text ?? m.item ?? ""),
    MAX_SLOTS_PER_SECTION
  );
  const menuDay2 = toFixedSlots(
    (d.menu?.day2 ?? []).map((m) => m.text ?? m.item ?? ""),
    MAX_SLOTS_PER_SECTION
  );
  const data: AutofillData = { ...sharedFields(d) };
  menuDay1.forEach((v, i) => {
    data[`menu_day1_${i + 1}`] = textField(v);
  });
  menuDay2.forEach((v, i) => {
    data[`menu_day2_${i + 1}`] = textField(v);
  });
  return data;
}
