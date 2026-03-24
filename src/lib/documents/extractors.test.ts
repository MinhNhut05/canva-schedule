import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { extractDocxText } from "@/lib/documents/extract-docx";
import { extractPdfText } from "@/lib/documents/extract-pdf";
import { normalizeText } from "@/lib/documents/normalize";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const fixturesDir = resolve(__dirname, "../../../tests/fixtures/documents");

async function readFixture(name: string) {
  return readFile(resolve(fixturesDir, name));
}

describe("extractPdfText", () => {
  it("trích xuất được tiếng Việt có dấu từ PDF hợp lệ", async () => {
    const pdfBuffer = await readFixture("sample-tour-vi.pdf");
    const result = await extractPdfText(new Uint8Array(pdfBuffer));

    expect(result.pageCount).toBeGreaterThan(0);
    expect(result.textItemCount).toBeGreaterThan(0);
    expect(result.warnings).toEqual([]);
    expect(result.rawText).toContain("CHƯƠNG TRÌNH TOUR");
    expect(result.rawText).toContain("Khởi hành từ TP.HCM");
    expect(result.rawText).toContain("Cơm tấm, phở bò, bánh mì");
  });

  it("giữ nguyên dấu tiếng Việt trong nội dung PDF đã trích xuất", async () => {
    const pdfBuffer = await readFixture("sample-tour-vi.pdf");
    const result = await extractPdfText(new Uint8Array(pdfBuffer));

    expect(result.rawText).toContain("CHƯƠNG TRÌNH TOUR");
    expect(result.rawText).toContain("Dinh Độc Lập");
    expect(result.rawText).toContain("Chợ Bến Thành");
  });


  it("trả về zero text items cho PDF rỗng hoặc scan và có cảnh báo tiếng Việt", async () => {
    const emptyPdfBuffer = await readFixture("empty-no-text.pdf");
    const result = await extractPdfText(new Uint8Array(emptyPdfBuffer));

    expect(result.pageCount).toBeGreaterThan(0);
    expect(result.textItemCount).toBe(0);
    expect(result.rawText.trim()).toBe("");
    expect(result.warnings).toContain(
      "PDF có trang nhưng không có nội dung text. File có thể là ảnh scan.",
    );
  });
});

describe("extractDocxText", () => {
  it("trích xuất được tiếng Việt có dấu từ DOCX hợp lệ", async () => {
    const docxBuffer = await readFixture("sample-tour-vi.docx");
    const result = await extractDocxText(docxBuffer);

    expect(result.lineCount).toBeGreaterThan(0);
    expect(result.rawText).toContain("CHƯƠNG TRÌNH TOUR");
    expect(result.rawText).toContain("Dinh Độc Lập");
    expect(result.rawText).toContain("Chợ Bến Thành");
  });
});

describe("normalizeText", () => {
  it("chuẩn hóa Unicode về NFC", () => {
    const decomposed = "a\u0301nh Đa\u0300 Nă\u0303ng";
    const normalized = normalizeText(decomposed);

    expect(normalized).toBe(normalized.normalize("NFC"));
  });

  it("chuyển CRLF thành LF", () => {
    const normalized = normalizeText("Dòng 1\r\nDòng 2\rDòng 3");

    expect(normalized).toBe("Dòng 1\nDòng 2\nDòng 3");
  });

  it("gom khoảng trắng nhưng vẫn giữ ngắt đoạn", () => {
    const normalized = normalizeText("  Buổi   sáng  \n\n\n  Tham quan   Đà Nẵng  \n  Ăn trưa  ");

    expect(normalized).toBe("Buổi sáng\n\nTham quan Đà Nẵng\nĂn trưa");
  });

  it("giữ nguyên dấu tiếng Việt chính xác, không ASCII-fold sau khi chuẩn hóa", () => {
    const normalized = normalizeText("  Chương   trình tour du lịch Đà Nẵng  ");

    expect(normalized).toBe("Chương trình tour du lịch Đà Nẵng");
    expect(normalized).not.toBe("Chuong trinh tour du lich Da Nang");
  });
});
