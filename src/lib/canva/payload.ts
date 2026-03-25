import { MAX_SLOTS_PER_SECTION } from "./field-map";

type TextFieldValue = { type: "text"; text: string };
type AutofillData = Record<string, TextFieldValue>;

function textField(value: string): TextFieldValue {
  return { type: "text", text: value };
}

function toFixedSlots(values: string[], size: number): string[] {
  return Array.from({ length: size }, (_, i) => values[i] ?? "");
}

// Shared fields present in all templates
function sharedFields(draft: {
  title?: string;
  clientName?: string;
  tourDate?: string;
  greetingText?: string;
  pickupLocation?: string;
  returnLocation?: string;
}): AutofillData {
  return {
    title: textField(draft.title ?? ""),
    client_name: textField(draft.clientName ?? ""),
    tour_date: textField(draft.tourDate ?? ""),
    greeting_text: textField(draft.greetingText ?? ""),
    pickup_location: textField(draft.pickupLocation ?? ""),
    return_location: textField(draft.returnLocation ?? ""),
  };
}

export function buildOneDayItineraryPayload(draft: any): AutofillData {
  const morning = toFixedSlots(
    (draft.itinerary?.morning ?? []).map(
      (a: any) => a.text ?? a.activity ?? ""
    ),
    MAX_SLOTS_PER_SECTION
  );
  const afternoon = toFixedSlots(
    (draft.itinerary?.afternoon ?? []).map(
      (a: any) => a.text ?? a.activity ?? ""
    ),
    MAX_SLOTS_PER_SECTION
  );
  const data: AutofillData = { ...sharedFields(draft) };
  morning.forEach((v, i) => {
    data[`morning_${i + 1}`] = textField(v);
  });
  afternoon.forEach((v, i) => {
    data[`afternoon_${i + 1}`] = textField(v);
  });
  return data;
}

export function buildOneDayMenuPayload(draft: any): AutofillData {
  const menuMorning = toFixedSlots(
    (draft.menu?.morning ?? []).map((m: any) => m.text ?? m.item ?? ""),
    MAX_SLOTS_PER_SECTION
  );
  const menuLunch = toFixedSlots(
    (draft.menu?.lunch ?? []).map((m: any) => m.text ?? m.item ?? ""),
    MAX_SLOTS_PER_SECTION
  );
  const menuAfternoon = toFixedSlots(
    (draft.menu?.afternoon ?? []).map((m: any) => m.text ?? m.item ?? ""),
    MAX_SLOTS_PER_SECTION
  );
  const data: AutofillData = { ...sharedFields(draft) };
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

export function buildTwoDayItineraryPayload(draft: any): AutofillData {
  const day1 = toFixedSlots(
    (draft.itinerary?.day1 ?? []).map((a: any) => a.text ?? a.activity ?? ""),
    MAX_SLOTS_PER_SECTION
  );
  const day2 = toFixedSlots(
    (draft.itinerary?.day2 ?? []).map((a: any) => a.text ?? a.activity ?? ""),
    MAX_SLOTS_PER_SECTION
  );
  const data: AutofillData = { ...sharedFields(draft) };
  day1.forEach((v, i) => {
    data[`day1_${i + 1}`] = textField(v);
  });
  day2.forEach((v, i) => {
    data[`day2_${i + 1}`] = textField(v);
  });
  return data;
}

export function buildTwoDayMenuPayload(draft: any): AutofillData {
  const menuDay1 = toFixedSlots(
    (draft.menu?.day1 ?? []).map((m: any) => m.text ?? m.item ?? ""),
    MAX_SLOTS_PER_SECTION
  );
  const menuDay2 = toFixedSlots(
    (draft.menu?.day2 ?? []).map((m: any) => m.text ?? m.item ?? ""),
    MAX_SLOTS_PER_SECTION
  );
  const data: AutofillData = { ...sharedFields(draft) };
  menuDay1.forEach((v, i) => {
    data[`menu_day1_${i + 1}`] = textField(v);
  });
  menuDay2.forEach((v, i) => {
    data[`menu_day2_${i + 1}`] = textField(v);
  });
  return data;
}
