type TextFieldValue = { type: "text"; text: string };
type AutofillData = Record<string, TextFieldValue>;

export interface OneDayItineraryPayloadOptions {
  mergeMenuIntoItinerary?: boolean;
}

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
  menu?: {
    morning?: MenuItem[];
    lunch?: MenuItem[];
    afternoon?: MenuItem[];
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

function joinInlineMenuItems(items: string[]): string {
  return items
    .map((item) => item.replace(/\s+/g, " ").trim())
    .filter((item) => item !== "")
    .join(", ");
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function stripTrailingPunctuation(value: string): string {
  return value.replace(/[\s,.;:!?-]+$/g, "").trim();
}

function ensureSentence(value: string): string {
  const trimmed = stripTrailingPunctuation(value);
  return trimmed ? `${trimmed}.` : "";
}

function ensureHeading(value: string): string {
  const trimmed = stripTrailingPunctuation(value);
  return trimmed ? `${trimmed}:` : "";
}

function dedupeLines(items: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of items) {
    const normalized = normalizeWhitespace(item);

    if (!normalized) {
      continue;
    }

    const key = normalized.toLowerCase();

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(normalized);
  }

  return result;
}

function capitalizeFirstCharacter(value: string): string {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function getActivityText(item: ActivityItem): string {
  return item.text ?? item.activity ?? "";
}

function setActivityText(item: ActivityItem, text: string): ActivityItem {
  return {
    ...item,
    text,
  };
}

/**
 * Convert a time string like "5:30" → "05 giờ 30" or "13:00" → "13 giờ 00".
 * Non-numeric labels like "Tối" are kept as-is.
 */
function formatTime(raw: string): string {
  const trimmed = raw.trim();
  const match = trimmed.match(/^(\d{1,2})(?::|[hH])(\d{1,2})$/);

  if (match) {
    const hh = match[1].padStart(2, "0");
    const mm = match[2].padStart(2, "0");
    return `${hh} giờ ${mm}`;
  }

  return trimmed;
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
 * - Without timeLabel: "Xuất phát từ trường"
 */
function formatActivity(item: ActivityItem): string {
  const text = getActivityText(item).trim();
  if (item.timeLabel) {
    return `${formatTimeLabel(item.timeLabel)}\n${text}`;
  }
  return text;
}

/**
 * Join a list of activity items into a single text block.
 * Activities are separated by a single newline to keep Canva blocks compact.
 * Empty list produces empty string.
 */
function joinActivityBlock(items: ActivityItem[]): string {
  if (items.length === 0) return "";
  return items
    .map(formatActivity)
    .filter((item) => item !== "")
    .join("\n");
}

const MORNING_MEAL_PATTERN = /(ăn sáng|dùng bữa sáng|điểm tâm)/i;
const MORNING_TRAVEL_PATTERN = /(khởi hành|xuất phát|di chuyển)/i;
const LUNCH_MEAL_PATTERN =
  /(ăn trưa|dùng bữa trưa|dùng cơm trưa|nghỉ trưa|cơm trưa)/i;
const AFTERNOON_SNACK_PATTERN = /(ăn nhẹ|ăn xế|ăn chiều|giải lao)/i;
const RETURN_TRAVEL_PATTERN = /(khởi hành về|trở về|về trường|về lại|quay về)/i;
const MENU_FOOD_LABEL_PATTERN = /^món ăn\s*:\s*(.+)$/i;
const MENU_DRINK_LABEL_PATTERN = /^(?:món uống|nước uống|thức uống)\s*:\s*(.+)$/i;
const DRINK_KEYWORD_PATTERN =
  /(trà|nước suối|nước ngọt|nước ép|nước mía|nước chanh|nước cam|sữa|cà phê|cafe|coffee|pepsi|coca|sprite|7up|fanta|lavie|trà sữa|sinh tố|juice|matcha|yaourt uống)/i;
const GAME_DETAIL_PATTERN =
  /(trò chơi|ghế bay|tàu lượn|xe điện đụng|đĩa bay|vòng xoay|thuyền rồng|đu dây|kỳ lân cung|18 cửa địa ngục|vũ điệu ong vàng|chuyến tàu mơ ước|ngựa phi nước đại|phi cơ|lâu đài tuyết|film 9d|vương quốc cá sấu|tinh tú thiên hà)/i;
const FREE_PLAY_HEADER_PATTERN =
  /(tự do.*(?:tham quan|vui chơi)|vui chơi tại|tham quan tại)/i;

function matchesPattern(item: ActivityItem, pattern: RegExp): boolean {
  const text = getActivityText(item);
  return pattern.test(text);
}

function insertSupplementalLines(
  items: ActivityItem[],
  lines: ActivityItem[],
  options: { afterPattern?: RegExp; beforePattern?: RegExp } = {},
): ActivityItem[] {
  if (lines.length === 0) return items;

  const afterPattern = options.afterPattern;
  if (afterPattern) {
    const afterIndex = items.findIndex((item) => matchesPattern(item, afterPattern));

    if (afterIndex >= 0) {
      return [
        ...items.slice(0, afterIndex + 1),
        ...lines,
        ...items.slice(afterIndex + 1),
      ];
    }
  }

  const beforePattern = options.beforePattern;
  if (beforePattern) {
    const beforeIndex = items.findIndex((item) => matchesPattern(item, beforePattern));

    if (beforeIndex >= 0) {
      return [...items.slice(0, beforeIndex), ...lines, ...items.slice(beforeIndex)];
    }
  }

  return [...items, ...lines];
}

function splitMenuSegments(value: string): string[] {
  return value
    .split(/\n|;/)
    .flatMap((segment) => segment.split(/\s*,\s*/))
    .map((segment) => normalizeWhitespace(segment))
    .filter((segment) => segment !== "" && segment !== "-");
}

function classifyMenuItems(items: MenuItem[]): { foods: string[]; drinks: string[] } {
  const foods: string[] = [];
  const drinks: string[] = [];

  const pushSegments = (segments: string[], target: "foods" | "drinks") => {
    if (target === "foods") {
      foods.push(...segments);
      return;
    }

    drinks.push(...segments);
  };

  for (const item of items) {
    const rawValue = normalizeWhitespace(item.text ?? item.item ?? "");

    if (!rawValue) {
      continue;
    }

    const foodMatch = rawValue.match(MENU_FOOD_LABEL_PATTERN);
    if (foodMatch?.[1]) {
      pushSegments(splitMenuSegments(foodMatch[1]), "foods");
      continue;
    }

    const drinkMatch = rawValue.match(MENU_DRINK_LABEL_PATTERN);
    if (drinkMatch?.[1]) {
      pushSegments(splitMenuSegments(drinkMatch[1]), "drinks");
      continue;
    }

    for (const segment of splitMenuSegments(rawValue)) {
      if (DRINK_KEYWORD_PATTERN.test(segment)) {
        drinks.push(segment);
      } else {
        foods.push(segment);
      }
    }
  }

  return {
    foods: dedupeLines(foods),
    drinks: dedupeLines(drinks),
  };
}

function buildMergedMenuLines(items: MenuItem[]): ActivityItem[] {
  const { foods, drinks } = classifyMenuItems(items);
  const lines: ActivityItem[] = [];

  const foodsText = joinInlineMenuItems(foods);
  if (foodsText) {
    lines.push({ text: `Món ăn: ${foodsText}` });
  }

  const drinksText = joinInlineMenuItems(drinks);
  if (drinksText) {
    lines.push({ text: `Nước uống: ${drinksText}` });
  }

  return lines;
}

function replaceGreetingPrefix(text: string, greetingText?: string): string {
  const greeting = greetingText?.trim();

  if (!greeting) {
    return text;
  }

  return text.replace(/^(?:Quý đoàn|Quý khách|Đoàn khách|Đoàn)\b/i, greeting);
}

function compactFreePlayActivityText(
  text: string,
  options: { greetingText?: string; addAfterMealPrefix?: boolean } = {},
): string {
  const lines = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line !== "");

  if (lines.length <= 1) {
    return replaceGreetingPrefix(normalizeWhitespace(text), options.greetingText);
  }

  let header = replaceGreetingPrefix(normalizeWhitespace(lines[0]), options.greetingText);
  const details = lines
    .slice(1)
    .map((line) => normalizeWhitespace(line.replace(/^[•+\-]\s*/, "")))
    .filter((line) => line !== "");

  if (!FREE_PLAY_HEADER_PATTERN.test(header)) {
    return [header, ...details].join("\n");
  }

  if (/tự do vui chơi tại/i.test(header) && !/tự do tham quan và vui chơi tại/i.test(header)) {
    header = header.replace(/tự do vui chơi tại/i, "tự do tham quan và vui chơi tại");
  }

  if (options.addAfterMealPrefix && !/^Sau khi dùng bữa/i.test(header)) {
    header = `Sau khi dùng bữa, ${header}`;
  }

  const compactDetails: string[] = [];
  let hasGameDetails = false;

  for (const detail of details) {
    if (/tập trung|theo hướng dẫn/i.test(detail)) {
      continue;
    }

    if (GAME_DETAIL_PATTERN.test(detail)) {
      hasGameDetails = true;
      continue;
    }

    let nextDetail = detail.replace(
      /^(?:tham quan|trải nghiệm|khám phá|ghé thăm|thử thách lòng can đảm với)\s+/i,
      "",
    );

    if (/^các khu chủ đề nổi bật\.?$/i.test(nextDetail)) {
      continue;
    }

    nextDetail = ensureSentence(capitalizeFirstCharacter(nextDetail));

    if (nextDetail) {
      compactDetails.push(nextDetail);
    }
  }

  if (hasGameDetails) {
    compactDetails.push("Các trò chơi tuổi thơ, phổ thông, cảm giác mạnh.");
  }

  const dedupedDetails = dedupeLines(compactDetails);

  if (dedupedDetails.length === 0) {
    return header;
  }

  return [ensureHeading(header), ...dedupedDetails].join("\n");
}

function normalizeOneDaySectionItems(
  items: ActivityItem[],
  draft: OneDayItineraryDraft,
  section: "morning" | "afternoon",
): ActivityItem[] {
  const returnDestination = draft.returnLocation?.trim() || draft.pickupLocation?.trim();
  const hasLunchMenu = (draft.menu?.lunch?.length ?? 0) > 0;

  return items.map((item, index) => {
    const currentText = getActivityText(item).trim();

    if (!currentText) {
      return item;
    }

    if (/^(Món ăn|Nước uống):/i.test(currentText)) {
      return setActivityText(item, currentText);
    }

    if (
      section === "afternoon" &&
      returnDestination &&
      RETURN_TRAVEL_PATTERN.test(currentText)
    ) {
      return setActivityText(item, `Đoàn khởi hành về ${returnDestination}.`);
    }

    if (section === "afternoon") {
      return setActivityText(
        item,
        compactFreePlayActivityText(currentText, {
          greetingText: draft.greetingText,
          addAfterMealPrefix: index === 0 && hasLunchMenu,
        }),
      );
    }

    return setActivityText(
      item,
      replaceGreetingPrefix(normalizeWhitespace(currentText), draft.greetingText),
    );
  });
}

function mergeOneDayMenuIntoItinerary(
  draft: OneDayItineraryDraft,
  options?: OneDayItineraryPayloadOptions,
): { morningItems: ActivityItem[]; afternoonItems: ActivityItem[] } {
  const morningItems = [...(draft.itinerary?.morning ?? [])];
  const afternoonItems = [...(draft.itinerary?.afternoon ?? [])];

  if (!options?.mergeMenuIntoItinerary) {
    return { morningItems, afternoonItems };
  }

  const morningMenuLines = buildMergedMenuLines(draft.menu?.morning ?? []);
  const lunchMenuLines = buildMergedMenuLines(draft.menu?.lunch ?? []);
  const afternoonMenuLines = buildMergedMenuLines(draft.menu?.afternoon ?? []);

  const mergedMorningItems = insertSupplementalLines(morningItems, morningMenuLines, {
    afterPattern: MORNING_MEAL_PATTERN,
    beforePattern: MORNING_TRAVEL_PATTERN,
  });

  const lunchBelongsToMorning = mergedMorningItems.some((item) =>
    matchesPattern(item, LUNCH_MEAL_PATTERN),
  );

  const withLunchMorning = lunchBelongsToMorning
    ? insertSupplementalLines(mergedMorningItems, lunchMenuLines, {
        afterPattern: LUNCH_MEAL_PATTERN,
        beforePattern: RETURN_TRAVEL_PATTERN,
      })
    : mergedMorningItems;

  const withLunch = lunchBelongsToMorning
    ? afternoonItems
    : insertSupplementalLines(afternoonItems, lunchMenuLines, {
        afterPattern: LUNCH_MEAL_PATTERN,
        beforePattern: RETURN_TRAVEL_PATTERN,
      });

  const mergedAfternoonItems = insertSupplementalLines(withLunch, afternoonMenuLines, {
    afterPattern: AFTERNOON_SNACK_PATTERN,
    beforePattern: RETURN_TRAVEL_PATTERN,
  });

  return {
    morningItems: withLunchMorning,
    afternoonItems: mergedAfternoonItems,
  };
}

export function buildOneDayItineraryPayload(
  draft: DraftInput,
  options?: OneDayItineraryPayloadOptions,
): AutofillData {
  const d = (draft ?? {}) as OneDayItineraryDraft;
  const { morningItems, afternoonItems } = mergeOneDayMenuIntoItinerary(d, options);
  const normalizedMorningItems = normalizeOneDaySectionItems(morningItems, d, "morning");
  const normalizedAfternoonItems = normalizeOneDaySectionItems(
    afternoonItems,
    d,
    "afternoon",
  );
  const afternoonWithEnd = ensureEndProgram(normalizedAfternoonItems);

  return {
    ...sharedFields(d),
    morning_block: textField(joinActivityBlock(normalizedMorningItems)),
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
