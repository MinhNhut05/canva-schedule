import type { QualityFlag, QualityLevel, QualityResult } from "./types";

export interface QualityInput {
  text: string;
  kind: "pdf" | "docx";
  pageCount?: number;
  textItemCount?: number;
  lineCount?: number;
}

const QUALITY_THRESHOLDS = {
  minTextLength: 200,
  maxReplacementChars: 5,
  minVietnameseRatio: 0.03,
  maxSymbolRatio: 0.3,
  minTextItemsPerPage: 2,
  minAvgCharsPerLine: 15,
} as const;

const SCORE_DEDUCTIONS: Record<QualityFlag, number> = {
  textTooShort: 25,
  containsReplacementChars: 15,
  lowVietnameseSignal: 20,
  highSymbolNoise: 15,
  likelyScannedPdf: 30,
  fragmentedDocx: 20,
};

const VIETNAMESE_DIACRITIC_CHARACTERS =
  "àáảãạằắẳẵặầấẩẫậèéẻẽẹềếểễệìíỉĩịòóỏõọồốổỗộờớởỡợùúủũụừứửữựỳýỷỹỵăâêôơưđ" +
  "ÀÁẢÃẠẰẮẲẴẶẦẤẨẪẬÈÉẺẼẸỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌỒỐỔỖỘỜỚỞỠỢÙÚỦŨỤỪỨỬỮỰỲÝỶỸỴĂÂÊÔƠƯĐ";

const VIETNAMESE_DIACRITIC_REGEX = new RegExp(
  `[${VIETNAMESE_DIACRITIC_CHARACTERS}]`,
  "g"
);
const LETTER_REGEX = /\p{L}/gu;
const SYMBOL_REGEX = /[^\p{L}\p{N}\s]/gu;
const REPLACEMENT_CHAR_REGEX = /\uFFFD/gu;

function countReplacementChars(text: string): number {
  return text.match(REPLACEMENT_CHAR_REGEX)?.length ?? 0;
}

function calcVietnameseRatio(text: string): number {
  const totalLetters = text.match(LETTER_REGEX)?.length ?? 0;

  if (totalLetters === 0) {
    return 0;
  }

  const vietnameseDiacritics = text.match(VIETNAMESE_DIACRITIC_REGEX)?.length ?? 0;
  return vietnameseDiacritics / totalLetters;
}

function calcSymbolRatio(text: string): number {
  const nonSpaceChars = text.replace(/\s/g, "").length;

  if (nonSpaceChars === 0) {
    return 0;
  }

  const symbolCount = text.match(SYMBOL_REGEX)?.length ?? 0;
  return symbolCount / nonSpaceChars;
}

function checkScannedPdf(
  kind: QualityInput["kind"],
  pageCount?: number,
  textItemCount?: number
): boolean {
  if (kind !== "pdf" || !pageCount || textItemCount === undefined) {
    return false;
  }

  return textItemCount / pageCount < QUALITY_THRESHOLDS.minTextItemsPerPage;
}

function checkFragmentedDocx(
  text: string,
  kind: QualityInput["kind"],
  lineCount?: number
): boolean {
  if (kind !== "docx" || !lineCount) {
    return false;
  }

  return text.length / lineCount < QUALITY_THRESHOLDS.minAvgCharsPerLine;
}

function classifyQualityLevel(score: number): QualityLevel {
  if (score >= 70) {
    return "good";
  }

  if (score >= 40) {
    return "warning";
  }

  return "poor";
}

export function scoreQuality(input: QualityInput): QualityResult {
  const { text, kind, pageCount, textItemCount, lineCount } = input;
  const flags: QualityFlag[] = [];

  const replacementCharCount = countReplacementChars(text);
  const vietnameseRatio = calcVietnameseRatio(text);
  const symbolRatio = calcSymbolRatio(text);

  if (text.length < QUALITY_THRESHOLDS.minTextLength) {
    flags.push("textTooShort");
  }

  if (replacementCharCount > QUALITY_THRESHOLDS.maxReplacementChars) {
    flags.push("containsReplacementChars");
  }

  if (vietnameseRatio < QUALITY_THRESHOLDS.minVietnameseRatio) {
    flags.push("lowVietnameseSignal");
  }

  if (symbolRatio > QUALITY_THRESHOLDS.maxSymbolRatio) {
    flags.push("highSymbolNoise");
  }

  if (kind === "pdf" && checkScannedPdf(kind, pageCount, textItemCount)) {
    flags.push("likelyScannedPdf");
  }

  if (kind === "docx" && checkFragmentedDocx(text, kind, lineCount)) {
    flags.push("fragmentedDocx");
  }

  const score = Math.max(
    0,
    flags.reduce(
      (currentScore, flag) => currentScore - SCORE_DEDUCTIONS[flag],
      100
    )
  );

  return {
    score,
    level: classifyQualityLevel(score),
    flags,
  };
}
