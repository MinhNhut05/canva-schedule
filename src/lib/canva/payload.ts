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
    morning_day1?: MenuItem[];
    lunch_day1?: MenuItem[];
    afternoon_day1?: MenuItem[];
    morning_day2?: MenuItem[];
    lunch_day2?: MenuItem[];
    afternoon_day2?: MenuItem[];
  };
}

interface ThreeDayItineraryDraft extends DraftBase {
  itinerary?: {
    day1?: ActivityItem[];
    day2?: ActivityItem[];
    day3?: ActivityItem[];
  };
}

interface ThreeDayMenuDraft extends DraftBase {
  menu?: {
    morning_day1?: MenuItem[];
    lunch_day1?: MenuItem[];
    afternoon_day1?: MenuItem[];
    morning_day2?: MenuItem[];
    lunch_day2?: MenuItem[];
    afternoon_day2?: MenuItem[];
    morning_day3?: MenuItem[];
    lunch_day3?: MenuItem[];
    afternoon_day3?: MenuItem[];
  };
}

interface FourDayItineraryDraft extends DraftBase {
  itinerary?: {
    night1?: ActivityItem[];
    day1?: ActivityItem[];
    day2?: ActivityItem[];
    day3?: ActivityItem[];
    day4?: ActivityItem[];
  };
}

interface FourDayMenuDraft extends DraftBase {
  menu?: {
    morning_day1?: MenuItem[];
    lunch_day1?: MenuItem[];
    afternoon_day1?: MenuItem[];
    morning_day2?: MenuItem[];
    lunch_day2?: MenuItem[];
    afternoon_day2?: MenuItem[];
    morning_day3?: MenuItem[];
    lunch_day3?: MenuItem[];
    afternoon_day3?: MenuItem[];
    morning_day4?: MenuItem[];
    lunch_day4?: MenuItem[];
    afternoon_day4?: MenuItem[];
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

function normalizeTitle(value: string | undefined): string {
  return (value ?? "").replace(/–/g, "-").replace(/\s+/g, " ").trim();
}

function sharedFields(draft: DraftBase): AutofillData {
  return {
    title: textField(normalizeTitle(draft.title)),
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
 * Join activities into a single text block.
 * Time-labeled activities get a blank line before them (except the first non-empty entry).
 * Activities without a timeLabel (e.g. merged menu lines, "Kết thúc chương trình!") stay
 * tight against the previous entry with a single newline.
 */
function joinActivityBlock(items: ActivityItem[]): string {
  if (items.length === 0) return "";

  const entries = items
    .map((item) => ({
      text: formatActivity(item),
      hasTime: Boolean(item.timeLabel?.trim()),
    }))
    .filter((entry) => entry.text !== "");

  if (entries.length === 0) return "";

  let result = entries[0].text;
  for (let i = 1; i < entries.length; i += 1) {
    const separator = entries[i].hasTime ? "\n\n" : "\n";
    result += separator + entries[i].text;
  }
  return result;
}

const MORNING_MEAL_PATTERN = /(ăn sáng|dùng bữa sáng|điểm tâm)/i;
const MORNING_TRAVEL_PATTERN = /(khởi hành|xuất phát|di chuyển)/i;
const LUNCH_MEAL_PATTERN =
  /(ăn trưa|dùng bữa trưa|dùng cơm trưa|nghỉ trưa|cơm trưa)/i;
const AFTERNOON_SNACK_PATTERN = /(ăn nhẹ|ăn xế|ăn chiều|giải lao)/i;
const RETURN_TRAVEL_PATTERN = /(khởi hành về|trở về|về trường|về lại|quay về)/i;
const END_PROGRAM_DUPLICATE_PATTERN = /kết thúc chương trình/i;

const PICKUP_LANDMARK_REPLACEMENTS: { pattern: RegExp; format: (loc: string) => string }[] = [
  { pattern: /tại điểm (?:hẹn|đón)(?: ban đầu)?/gi, format: (loc) => `tại ${loc}` },
  { pattern: /đến điểm (?:hẹn|đón)(?: ban đầu)?/gi, format: (loc) => `đến ${loc}` },
  { pattern: /về (?:lại |đến )?điểm (?:hẹn|đón)(?: ban đầu)?/gi, format: (loc) => `về ${loc}` },
  { pattern: /điểm đón ban đầu/gi, format: (loc) => loc },
];

function substituteLandmark(text: string, location: string | undefined): string {
  const trimmed = location?.trim();
  if (!trimmed) return text;
  let out = text;
  for (const { pattern, format } of PICKUP_LANDMARK_REPLACEMENTS) {
    out = out.replace(pattern, format(trimmed));
  }
  return out;
}
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

  if (!FREE_PLAY_HEADER_PATTERN.test(header)) {
    // Non-free-play: preserve bullet markers verbatim, only normalize whitespace within each line.
    const preservedDetails = lines
      .slice(1)
      .map((line) => normalizeWhitespace(line))
      .filter((line) => line !== "");
    return [header, ...preservedDetails].join("\n");
  }

  const details = lines
    .slice(1)
    .map((line) => normalizeWhitespace(line.replace(/^[•+\-]\s*/, "")))
    .filter((line) => line !== "");

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
  const pickupDestination = draft.pickupLocation?.trim();
  const hasLunchMenu = (draft.menu?.lunch?.length ?? 0) > 0;

  return items.map((item, index) => {
    const currentText = getActivityText(item).trim();

    if (!currentText) {
      return item;
    }

    if (/^(Món ăn|Nước uống):/i.test(currentText)) {
      return setActivityText(item, currentText);
    }

    if (section === "afternoon" && END_PROGRAM_DUPLICATE_PATTERN.test(currentText)) {
      return setActivityText(item, "");
    }

    if (
      section === "afternoon" &&
      returnDestination &&
      RETURN_TRAVEL_PATTERN.test(currentText)
    ) {
      return setActivityText(item, `Đoàn khởi hành về ${returnDestination}.`);
    }

    if (section === "afternoon") {
      const compacted = compactFreePlayActivityText(currentText, {
        greetingText: draft.greetingText,
        addAfterMealPrefix: index === 0 && hasLunchMenu,
      });
      return setActivityText(item, substituteLandmark(compacted, returnDestination));
    }

    const compacted = compactFreePlayActivityText(currentText, {
      greetingText: draft.greetingText,
    });
    return setActivityText(item, substituteLandmark(compacted, pickupDestination));
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

function normalizeTwoDaySectionItems(
  items: ActivityItem[],
  draft: TwoDayItineraryDraft,
  section: "day1" | "day2",
): ActivityItem[] {
  const returnDestination = draft.returnLocation?.trim() || draft.pickupLocation?.trim();
  const pickupDestination = draft.pickupLocation?.trim();

  return items.map((item) => {
    const currentText = getActivityText(item).trim();

    if (!currentText) {
      return item;
    }

    if (/^(Món ăn|Nước uống):/i.test(currentText)) {
      return setActivityText(item, currentText);
    }

    if (section === "day2" && END_PROGRAM_DUPLICATE_PATTERN.test(currentText)) {
      return setActivityText(item, "");
    }

    if (
      section === "day2" &&
      returnDestination &&
      RETURN_TRAVEL_PATTERN.test(currentText)
    ) {
      return setActivityText(item, `Đoàn khởi hành về ${returnDestination}.`);
    }

    const compacted = compactFreePlayActivityText(currentText, {
      greetingText: draft.greetingText,
    });
    const location = section === "day2" ? returnDestination : pickupDestination;
    return setActivityText(item, substituteLandmark(compacted, location));
  });
}

export function buildTwoDayItineraryPayload(draft: DraftInput): AutofillData {
  const d = (draft ?? {}) as TwoDayItineraryDraft;
  const day1Items = normalizeTwoDaySectionItems(d.itinerary?.day1 ?? [], d, "day1");
  const day2Items = normalizeTwoDaySectionItems(d.itinerary?.day2 ?? [], d, "day2");
  const day2WithEnd = ensureEndProgram(day2Items);

  return {
    ...sharedFields(d),
    day1_block: textField(joinActivityBlock(day1Items)),
    day2_block: textField(joinActivityBlock(day2WithEnd)),
  };
}

export function buildTwoDayMenuPayload(draft: DraftInput): AutofillData {
  const d = (draft ?? {}) as TwoDayMenuDraft;
  const morningDay1Items = (d.menu?.morning_day1 ?? []).map(
    (m) => m.text ?? m.item ?? "",
  );
  const lunchDay1Items = (d.menu?.lunch_day1 ?? []).map(
    (m) => m.text ?? m.item ?? "",
  );
  const afternoonDay1Items = (d.menu?.afternoon_day1 ?? []).map(
    (m) => m.text ?? m.item ?? "",
  );
  const morningDay2Items = (d.menu?.morning_day2 ?? []).map(
    (m) => m.text ?? m.item ?? "",
  );
  const lunchDay2Items = (d.menu?.lunch_day2 ?? []).map(
    (m) => m.text ?? m.item ?? "",
  );
  const afternoonDay2Items = (d.menu?.afternoon_day2 ?? []).map(
    (m) => m.text ?? m.item ?? "",
  );

  return {
    ...sharedFields(d),
    menu_morning_day1_block: textField(joinMenuBlock(morningDay1Items)),
    menu_lunch_day1_block: textField(joinMenuBlock(lunchDay1Items)),
    menu_afternoon_day1_block: textField(joinMenuBlock(afternoonDay1Items)),
    menu_morning_day2_block: textField(joinMenuBlock(morningDay2Items)),
    menu_lunch_day2_block: textField(joinMenuBlock(lunchDay2Items)),
    menu_afternoon_day2_block: textField(joinMenuBlock(afternoonDay2Items)),
  };
}

export function buildThreeDayItineraryPayload(draft: DraftInput): AutofillData {
  const d = (draft ?? {}) as ThreeDayItineraryDraft;
  const day1Items = d.itinerary?.day1 ?? [];
  const day2Items = d.itinerary?.day2 ?? [];
  const day3WithEnd = ensureEndProgram(d.itinerary?.day3 ?? []);

  return {
    ...sharedFields(d),
    day1_block: textField(joinActivityBlock(day1Items)),
    day2_block: textField(joinActivityBlock(day2Items)),
    day3_block: textField(joinActivityBlock(day3WithEnd)),
  };
}

export function buildThreeDayMenuPayload(draft: DraftInput): AutofillData {
  const d = (draft ?? {}) as ThreeDayMenuDraft;
  const morningDay1Items = (d.menu?.morning_day1 ?? []).map((m) => m.text ?? m.item ?? "");
  const lunchDay1Items = (d.menu?.lunch_day1 ?? []).map((m) => m.text ?? m.item ?? "");
  const afternoonDay1Items = (d.menu?.afternoon_day1 ?? []).map((m) => m.text ?? m.item ?? "");
  const morningDay2Items = (d.menu?.morning_day2 ?? []).map((m) => m.text ?? m.item ?? "");
  const lunchDay2Items = (d.menu?.lunch_day2 ?? []).map((m) => m.text ?? m.item ?? "");
  const afternoonDay2Items = (d.menu?.afternoon_day2 ?? []).map((m) => m.text ?? m.item ?? "");
  const morningDay3Items = (d.menu?.morning_day3 ?? []).map((m) => m.text ?? m.item ?? "");
  const lunchDay3Items = (d.menu?.lunch_day3 ?? []).map((m) => m.text ?? m.item ?? "");
  const afternoonDay3Items = (d.menu?.afternoon_day3 ?? []).map((m) => m.text ?? m.item ?? "");

  return {
    ...sharedFields(d),
    menu_morning_day1_block: textField(joinMenuBlock(morningDay1Items)),
    menu_lunch_day1_block: textField(joinMenuBlock(lunchDay1Items)),
    menu_afternoon_day1_block: textField(joinMenuBlock(afternoonDay1Items)),
    menu_morning_day2_block: textField(joinMenuBlock(morningDay2Items)),
    menu_lunch_day2_block: textField(joinMenuBlock(lunchDay2Items)),
    menu_afternoon_day2_block: textField(joinMenuBlock(afternoonDay2Items)),
    menu_morning_day3_block: textField(joinMenuBlock(morningDay3Items)),
    menu_lunch_day3_block: textField(joinMenuBlock(lunchDay3Items)),
    menu_afternoon_day3_block: textField(joinMenuBlock(afternoonDay3Items)),
  };
}

export function buildFourDayItineraryPayload(draft: DraftInput): AutofillData {
  const d = (draft ?? {}) as FourDayItineraryDraft;
  const night1Items = d.itinerary?.night1 ?? [];
  const day1Items = d.itinerary?.day1 ?? [];
  const day2Items = d.itinerary?.day2 ?? [];
  const day3Items = d.itinerary?.day3 ?? [];
  const day4WithEnd = ensureEndProgram(d.itinerary?.day4 ?? []);

  // Day 3 is split across two Canva columns — split at midpoint
  const splitAt = Math.ceil(day3Items.length / 2);
  const day3aItems = day3Items.slice(0, splitAt);
  const day3bItems = day3Items.slice(splitAt);

  return {
    ...sharedFields(d),
    night1_block: textField(joinActivityBlock(night1Items)),
    day1_block: textField(joinActivityBlock(day1Items)),
    day2_block: textField(joinActivityBlock(day2Items)),
    day3a_block: textField(joinActivityBlock(day3aItems)),
    day3b_block: textField(joinActivityBlock(day3bItems)),
    day4_block: textField(joinActivityBlock(day4WithEnd)),
  };
}

export function buildFourDayMenuPayload(draft: DraftInput): AutofillData {
  const d = (draft ?? {}) as FourDayMenuDraft;
  const morningDay1Items = (d.menu?.morning_day1 ?? []).map((m) => m.text ?? m.item ?? "");
  const lunchDay1Items = (d.menu?.lunch_day1 ?? []).map((m) => m.text ?? m.item ?? "");
  const afternoonDay1Items = (d.menu?.afternoon_day1 ?? []).map((m) => m.text ?? m.item ?? "");
  const morningDay2Items = (d.menu?.morning_day2 ?? []).map((m) => m.text ?? m.item ?? "");
  const lunchDay2Items = (d.menu?.lunch_day2 ?? []).map((m) => m.text ?? m.item ?? "");
  const afternoonDay2Items = (d.menu?.afternoon_day2 ?? []).map((m) => m.text ?? m.item ?? "");
  const morningDay3Items = (d.menu?.morning_day3 ?? []).map((m) => m.text ?? m.item ?? "");
  const lunchDay3Items = (d.menu?.lunch_day3 ?? []).map((m) => m.text ?? m.item ?? "");
  const afternoonDay3Items = (d.menu?.afternoon_day3 ?? []).map((m) => m.text ?? m.item ?? "");
  const morningDay4Items = (d.menu?.morning_day4 ?? []).map((m) => m.text ?? m.item ?? "");
  const lunchDay4Items = (d.menu?.lunch_day4 ?? []).map((m) => m.text ?? m.item ?? "");
  const afternoonDay4Items = (d.menu?.afternoon_day4 ?? []).map((m) => m.text ?? m.item ?? "");

  return {
    ...sharedFields(d),
    menu_morning_day1_block: textField(joinMenuBlock(morningDay1Items)),
    menu_lunch_day1_block: textField(joinMenuBlock(lunchDay1Items)),
    menu_afternoon_day1_block: textField(joinMenuBlock(afternoonDay1Items)),
    menu_morning_day2_block: textField(joinMenuBlock(morningDay2Items)),
    menu_lunch_day2_block: textField(joinMenuBlock(lunchDay2Items)),
    menu_afternoon_day2_block: textField(joinMenuBlock(afternoonDay2Items)),
    menu_morning_day3_block: textField(joinMenuBlock(morningDay3Items)),
    menu_lunch_day3_block: textField(joinMenuBlock(lunchDay3Items)),
    menu_afternoon_day3_block: textField(joinMenuBlock(afternoonDay3Items)),
    menu_morning_day4_block: textField(joinMenuBlock(morningDay4Items)),
    menu_lunch_day4_block: textField(joinMenuBlock(lunchDay4Items)),
    menu_afternoon_day4_block: textField(joinMenuBlock(afternoonDay4Items)),
  };
}
