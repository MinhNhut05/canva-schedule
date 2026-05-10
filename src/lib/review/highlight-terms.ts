import type { StructuredDraft } from "@/lib/ai/extraction-schema";

/**
 * Extract important terms from draft that should be bolded in itinerary display.
 * Includes: place names, school/company names, landmarks, and other key nouns.
 */
export function extractImportantTerms(draft: StructuredDraft): string[] {
  const terms: string[] = [];

  // Client name & school name
  if (draft.clientName) terms.push(draft.clientName);
  if (draft.clientType === "SCHOOL" && draft.schoolName) {
    terms.push(draft.schoolName);
  }

  // Extract place names from all activity texts
  const allActivities =
    draft.duration === "ONE_DAY"
      ? [...draft.itinerary.morning, ...draft.itinerary.afternoon]
      : draft.duration === "THREE_DAY"
        ? [...draft.itinerary.day1, ...draft.itinerary.day2, ...draft.itinerary.day3]
        : draft.duration === "FOUR_DAY"
          ? [...draft.itinerary.night1, ...draft.itinerary.day1, ...draft.itinerary.day2, ...draft.itinerary.day3, ...draft.itinerary.day4]
          : [...draft.itinerary.day1, ...draft.itinerary.day2];

  for (const activity of allActivities) {
    const extracted = extractPlaceNames(activity.text);
    terms.push(...extracted);
  }

  // Deduplicate and filter empty
  return [...new Set(terms.filter((t) => t.length > 0))];
}

/**
 * Extract place names and landmarks from Vietnamese tour text.
 *
 * Matches patterns like:
 * - "tham quan Vườn Quốc Gia Mũi Cà Mau"
 * - "Check in Cột mốc Tọa độ Quốc Gia GPS 0001"
 * - "Khởi hành đi Cà Mau"
 * - "Khu du lịch Văn Hóa Phương Nam"
 * - Quoted names: "Mũi tàu Ta đó – Mũi Cà Mau"
 */
function extractPlaceNames(text: string): string[] {
  const places: string[] = [];

  // Pattern: tham quan [Place Name]. or tham quan [Place Name]:
  const visitPattern =
    /tham quan\s+((?:[A-ZÀ-ỹ][a-zà-ỹ]*(?:\s+(?:[A-ZÀ-ỹa-zà-ỹ0-9–\-]+))*)[.:]?)/gi;
  for (const match of text.matchAll(visitPattern)) {
    if (match[1]) places.push(cleanTerm(match[1]));
  }

  // Pattern: Khởi hành đi [Place]
  const departPattern =
    /[Kk]hởi hành đi\s+((?:[A-ZÀ-ỹ][a-zà-ỹ]*(?:\s+[A-ZÀ-ỹa-zà-ỹ]*)*)[.:]?)/g;
  for (const match of text.matchAll(departPattern)) {
    if (match[1]) places.push(cleanTerm(match[1]));
  }

  // Pattern: Check in [Place]
  const checkinPattern =
    /[Cc]heck\s*in\s+((?:[A-ZÀ-ỹ][a-zà-ỹ]*(?:\s+(?:[A-ZÀ-ỹa-zà-ỹ0-9–\-]+))*)[.:]?)/g;
  for (const match of text.matchAll(checkinPattern)) {
    if (match[1]) places.push(cleanTerm(match[1]));
  }

  // Pattern: Khu du lịch/di tích/...[Name]
  const areaPattern =
    /(?:Khu\s+(?:du lịch|di tích|sinh thái|bảo tồn|tưởng niệm)|Vườn\s+Quốc\s+Gia|Công viên|Đền\s+thờ|Tượng\s+Đài|Cột\s+(?:Cờ|mốc))\s+((?:[A-ZÀ-ỹ][a-zà-ỹ]*(?:\s+(?:[A-ZÀ-ỹa-zà-ỹ0-9–\-]+))*)?)/g;
  for (const match of text.matchAll(areaPattern)) {
    // Include the prefix (Khu du lịch...) + name
    places.push(cleanTerm(match[0]));
  }

  // Pattern: Quoted names "..."
  const quotedPattern = /["""]([^"""]+)["""]/g;
  for (const match of text.matchAll(quotedPattern)) {
    if (match[1]) places.push(cleanTerm(match[1]));
  }

  // Pattern: Standalone known landmark prefixes with names
  const landmarkPattern =
    /(?:Cột Cờ|Cột mốc|Tượng Đài|Đền thờ|Pano)\s+((?:[A-ZÀ-ỹ][a-zà-ỹ]*(?:\s+(?:[A-ZÀ-ỹa-zà-ỹ0-9–\-]+))*)?)/g;
  for (const match of text.matchAll(landmarkPattern)) {
    places.push(cleanTerm(match[0]));
  }

  return places;
}

/** Remove trailing punctuation from extracted term */
function cleanTerm(term: string): string {
  return term.replace(/[.:,;!?]+$/, "").trim();
}

/** Section theme variants for itinerary display */
export type SectionTheme = "primary" | "secondary";

export interface SectionColors {
  /** Background class for the section container */
  bg: string;
  /** Time label color */
  timeColor: string;
  /** Normal text color */
  textColor: string;
  /** Bold/important text color (same hue, bold weight) */
  boldColor: string;
  /** Section heading color */
  headingColor: string;
}

/** Color config for morning/day1 (dark background) */
export const PRIMARY_SECTION: SectionColors = {
  bg: "bg-[#1a1f3d]",
  timeColor: "#b4e5ff",
  textColor: "#ffffff",
  boldColor: "#ffffff",
  headingColor: "#b4e5ff",
};

/** Color config for afternoon/day2 (light background) */
export const SECONDARY_SECTION: SectionColors = {
  bg: "bg-[#f0f6ff]",
  timeColor: "#004aad",
  textColor: "#004aad",
  boldColor: "#004aad",
  headingColor: "#004aad",
};

/**
 * Split text into segments, marking which parts match important terms.
 * Used by HighlightedText component for rendering.
 */
export interface TextSegment {
  text: string;
  isHighlighted: boolean;
}

export function splitTextByTerms(
  text: string,
  terms: string[],
): TextSegment[] {
  if (!terms.length || !text) {
    return [{ text, isHighlighted: false }];
  }

  // Sort terms longest-first so longer matches take priority
  const sorted = [...terms].sort((a, b) => b.length - a.length);

  // Escape regex special chars and build pattern
  const escaped = sorted.map((t) =>
    t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
  );
  const pattern = new RegExp(`(${escaped.join("|")})`, "gi");

  const segments: TextSegment[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(pattern)) {
    const matchStart = match.index;
    if (matchStart === undefined) continue;

    // Text before match
    if (matchStart > lastIndex) {
      segments.push({
        text: text.slice(lastIndex, matchStart),
        isHighlighted: false,
      });
    }

    // The match itself
    segments.push({
      text: match[0],
      isHighlighted: true,
    });

    lastIndex = matchStart + match[0].length;
  }

  // Remaining text
  if (lastIndex < text.length) {
    segments.push({
      text: text.slice(lastIndex),
      isHighlighted: false,
    });
  }

  return segments.length > 0 ? segments : [{ text, isHighlighted: false }];
}
