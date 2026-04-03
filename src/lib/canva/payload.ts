type TextFieldValue = { type: "text"; text: string };
type AutofillData = Record<string, TextFieldValue>;

interface ActivityItem {
  text?: string;
  activity?: string;
  timeLabel?: string;
}

interface MenuItem {
  text?: string;
  item?: string;
}

interface DraftBase {
  programName?: string;
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

/** Join a list of menu items with single newlines. */
function joinMenuBlock(items: string[]): string {
  return items.filter((s) => s.trim() !== "").join("\n");
}

/**
 * Convert a time string like "5:30" → "05 giờ 30" or "13:00" → "13 giờ 00".
 * Non-numeric labels like "Tối" are kept as-is.
 */
function formatTime(raw: string): string {
  const match = raw.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (match) {
    const hh = match[1].padStart(2, "0");
    const mm = match[2];
    return `${hh} giờ ${mm}`;
  }
  return raw.trim();
}

/**
 * Format timeLabel for Canva output, handling ranges like "7:30 - 8:00".
 * Returns formatted label with trailing ":"
 */
function formatTimeLabel(timeLabel: string): string {
  // Handle range format: "7:30 - 8:00"
  const parts = timeLabel.split(/\s*-\s*/);
  if (parts.length === 2 && /\d/.test(parts[0]) && /\d/.test(parts[1])) {
    return `${formatTime(parts[0])} - ${formatTime(parts[1])}:`;
  }
  return `${formatTime(timeLabel)}:`;
}

const END_PROGRAM_TEXT = "Kết thúc chương trình!";

/**
 * Ensure the last activity in a block is "Kết thúc chương trình!".
 * If AI extraction already added it, this is a no-op.
 */
function ensureEndProgram(items: ActivityItem[]): ActivityItem[] {
  const last = items[items.length - 1];
  const lastText = last?.text ?? last?.activity ?? "";
  if (lastText.trim() === END_PROGRAM_TEXT) return items;
  return [...items, { text: END_PROGRAM_TEXT }];
}

// Shared fields present in all templates
const DEFAULT_PROGRAM_LABEL = "CHƯƠNG TRÌNH THAM QUAN";

function resolveProgramLabel(programName?: string): string {
  const trimmed = programName?.trim();
  return trimmed ? trimmed : DEFAULT_PROGRAM_LABEL;
}

function sharedFields(draft: DraftBase): AutofillData {
  return {
    title: textField(draft.title ?? ""),
    program_label: textField(resolveProgramLabel(draft.programName)),
    tour_date: textField(draft.tourDate ?? ""),
  };
}

/**
 * Format an activity into a display line.
 * - With timeLabel: "05 giờ 30:\nXuất phát từ trường"
 * - Without timeLabel: "\nXuất phát từ trường"
 */
function formatActivity(item: ActivityItem): string {
  const text = item.text ?? item.activity ?? "";
  if (item.timeLabel) {
    return `${formatTimeLabel(item.timeLabel)}\n${text}`;
  }
  return `\n${text}`;
}

/**
 * Join a list of activity items into a single text block.
 * Activities are separated by double newlines.
 * Empty list produces empty string.
 */
function joinActivityBlock(items: ActivityItem[]): string {
  if (items.length === 0) return "";
  return items.map(formatActivity).join("\n\n");
}

export function buildOneDayItineraryPayload(draft: DraftInput): AutofillData {
  const d = (draft ?? {}) as OneDayItineraryDraft;
  const morningItems = d.itinerary?.morning ?? [];
  const afternoonWithEnd = ensureEndProgram(d.itinerary?.afternoon ?? []);

  return {
    ...sharedFields(d),
    morning_block: textField(joinActivityBlock(morningItems)),
    afternoon_block: textField(joinActivityBlock(afternoonWithEnd)),
  };
}

export function buildOneDayMenuPayload(draft: DraftInput): AutofillData {
  const d = (draft ?? {}) as OneDayMenuDraft;
  const morningItems = (d.menu?.morning ?? []).map(
    (m) => m.text ?? m.item ?? "",
  );
  const lunchItems = (d.menu?.lunch ?? []).map(
    (m) => m.text ?? m.item ?? "",
  );
  const afternoonItems = (d.menu?.afternoon ?? []).map(
    (m) => m.text ?? m.item ?? "",
  );
  return {
    ...sharedFields(d),
    menu_morning_block: textField(joinMenuBlock(morningItems)),
    menu_lunch_block: textField(joinMenuBlock(lunchItems)),
    menu_afternoon_block: textField(joinMenuBlock(afternoonItems)),
  };
}

export function buildTwoDayItineraryPayload(draft: DraftInput): AutofillData {
  const d = (draft ?? {}) as TwoDayItineraryDraft;
  const day1Items = d.itinerary?.day1 ?? [];
  const day2WithEnd = ensureEndProgram(d.itinerary?.day2 ?? []);

  return {
    ...sharedFields(d),
    day1_block: textField(joinActivityBlock(day1Items)),
    day2_block: textField(joinActivityBlock(day2WithEnd)),
  };
}

export function buildTwoDayMenuPayload(draft: DraftInput): AutofillData {
  const d = (draft ?? {}) as TwoDayMenuDraft;
  const day1Items = (d.menu?.day1 ?? []).map(
    (m) => m.text ?? m.item ?? "",
  );
  const day2Items = (d.menu?.day2 ?? []).map(
    (m) => m.text ?? m.item ?? "",
  );
  return {
    ...sharedFields(d),
    menu_day1_block: textField(joinMenuBlock(day1Items)),
    menu_day2_block: textField(joinMenuBlock(day2Items)),
  };
}
