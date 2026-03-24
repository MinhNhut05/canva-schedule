import { describe, expect, it } from "vitest";
import { scoreQuality, type QualityInput } from "./quality";

const GOOD_VIETNAMESE_TEXT = Array.from(
  { length: 12 },
  () =>
    "Chương trình du lịch Đà Nẵng khởi hành từ Thành phố Hồ Chí Minh với lịch trình rõ ràng, bữa ăn đầy đủ và hướng dẫn viên hỗ trợ xuyên suốt hành trình."
).join(" ");

const ASCII_ONLY_TEXT = Array.from(
  { length: 8 },
  () => "Tour program starts in Ho Chi Minh City with lunch, museum visit, and evening transfer."
).join(" ");

const SYMBOL_HEAVY_TEXT = Array.from(
  { length: 30 },
  () => "du lịch!!!@@@###"
).join(" ");

function score(text: string, overrides: Partial<QualityInput> = {}) {
  return scoreQuality({
    text,
    kind: "pdf",
    pageCount: 1,
    textItemCount: 20,
    lineCount: 10,
    ...overrides,
  });
}

describe("scoreQuality", () => {
  it("trả về mức good cho văn bản tiếng Việt đầy đủ và có dấu", () => {
    const result = score(GOOD_VIETNAMESE_TEXT, {
      kind: "pdf",
      pageCount: 4,
      textItemCount: 120,
      lineCount: 24,
    });

    expect(GOOD_VIETNAMESE_TEXT.length).toBeGreaterThan(500);
    expect(result).toEqual({
      score: 100,
      level: "good",
      flags: [],
    });
  });

  it("gắn cờ textTooShort cho văn bản quá ngắn", () => {
    const result = score("Lịch trình đi Cần Thơ sáng nay.", {
      kind: "pdf",
      pageCount: 1,
      textItemCount: 12,
      lineCount: 1,
    });

    expect(result.flags).toEqual(["textTooShort"]);
    expect(result.score).toBe(75);
    expect(result.level).toBe("good");
  });

  it("gắn cờ containsReplacementChars cho văn bản bị lỗi ký tự thay thế", () => {
    const garbledText = `${GOOD_VIETNAMESE_TEXT} ������`;
    const result = score(garbledText, {
      kind: "pdf",
      pageCount: 3,
      textItemCount: 90,
      lineCount: 18,
    });

    expect(result.flags).toContain("containsReplacementChars");
    expect(result.flags).not.toContain("highSymbolNoise");
    expect(result.level).toBe("good");
  });

  it("gắn cờ lowVietnameseSignal cho văn bản ASCII-only", () => {
    const result = score(ASCII_ONLY_TEXT, {
      kind: "pdf",
      pageCount: 2,
      textItemCount: 60,
      lineCount: 12,
    });

    expect(result.flags).toEqual(["lowVietnameseSignal"]);
    expect(result.score).toBe(80);
    expect(result.level).toBe("good");
  });

  it("gắn cờ highSymbolNoise khi tỷ lệ ký hiệu vượt ngưỡng", () => {
    const result = score(SYMBOL_HEAVY_TEXT, {
      kind: "pdf",
      pageCount: 2,
      textItemCount: 70,
      lineCount: 20,
    });

    expect(result.flags).toEqual(["highSymbolNoise"]);
    expect(result.score).toBe(85);
    expect(result.level).toBe("good");
  });

  it("gắn cờ likelyScannedPdf khi PDF nhiều trang nhưng không có text item", () => {
    const result = score("", {
      kind: "pdf",
      pageCount: 5,
      textItemCount: 0,
      lineCount: 0,
    });

    expect(result.flags).toEqual([
      "textTooShort",
      "lowVietnameseSignal",
      "likelyScannedPdf",
    ]);
    expect(result.score).toBe(25);
    expect(result.level).toBe("poor");
  });

  it("gắn cờ fragmentedDocx khi DOCX có số ký tự trung bình mỗi dòng quá thấp", () => {
    const fragmentedDocxText = Array.from({ length: 12 }, () => "Đi chợ về").join("\n");
    const result = score(fragmentedDocxText, {
      kind: "docx",
      pageCount: 2,
      textItemCount: 0,
      lineCount: 12,
    });

    expect(result.flags).toEqual(["textTooShort", "fragmentedDocx"]);
    expect(result.score).toBe(55);
    expect(result.level).toBe("warning");
  });

  it("không gắn cờ likelyScannedPdf cho DOCX dù có pageCount và textItemCount", () => {
    const result = score(GOOD_VIETNAMESE_TEXT, {
      kind: "docx",
      pageCount: 5,
      textItemCount: 0,
      lineCount: 20,
    });

    expect(result.flags).not.toContain("likelyScannedPdf");
    expect(result.flags).toEqual([]);
    expect(result.level).toBe("good");
  });

  it("không gắn cờ fragmentedDocx cho PDF dù có lineCount", () => {
    const result = score(GOOD_VIETNAMESE_TEXT, {
      kind: "pdf",
      pageCount: 5,
      textItemCount: 80,
      lineCount: 60,
    });

    expect(result.flags).not.toContain("fragmentedDocx");
    expect(result.flags).toEqual([]);
    expect(result.level).toBe("good");
  });
});
