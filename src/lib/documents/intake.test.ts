import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { validateFile } from "@/lib/documents/intake";
import { MAX_FILE_SIZE_BYTES } from "@/lib/documents/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const fixturesDir = resolve(__dirname, "../../../tests/fixtures/documents");

async function createFixtureFile(fileName: string, mimeType: string) {
  const buffer = await readFile(resolve(fixturesDir, fileName));
  return new File([buffer], fileName, { type: mimeType });
}

describe("validateFile", () => {
  it("trả về lỗi tiếng Việt có dấu khi file là null", async () => {
    const result = await validateFile(null);

    expect(result).toEqual({
      valid: false,
      error: "Vui lòng chọn một file trước khi xử lý.",
    });
    expect(result.error).toContain("Vui lòng chọn");
  });

  it("trả về lỗi tiếng Việt có dấu khi file vượt quá 10MB", async () => {
    const oversizedFile = new File([new Uint8Array([0x25, 0x50, 0x44, 0x46])], "tour.pdf", {
      type: "application/pdf",
    });

    Object.defineProperty(oversizedFile, "size", {
      configurable: true,
      value: MAX_FILE_SIZE_BYTES + 1,
    });

    const result = await validateFile(oversizedFile);

    expect(result.valid).toBe(false);
    expect(result.error).toBe("File vượt quá 10MB. Vui lòng chọn file nhỏ hơn.");
    expect(result.error).toContain("vượt quá");
  });

  it("trả về lỗi cho file .txt", async () => {
    const txtFile = new File(["xin chào"], "tour.txt", { type: "text/plain" });

    const result = await validateFile(txtFile);

    expect(result.valid).toBe(false);
    expect(result.error).toContain("không được hỗ trợ");
  });

  it("trả về lỗi cho file .jpg có magic bytes JPEG", async () => {
    const jpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
    const jpgFile = new File([jpegBytes], "tour.jpg", { type: "image/jpeg" });

    const result = await validateFile(jpgFile);

    expect(result.valid).toBe(false);
    expect(result.error).toContain("không được hỗ trợ");
  });

  it("trả về lỗi cho file .pdf nhưng nội dung nhị phân không phải PDF", async () => {
    const invalidBytes = await readFile(resolve(fixturesDir, "not-a-pdf.bin"));
    const fakePdf = new File([invalidBytes], "fake.pdf", { type: "application/pdf" });

    const result = await validateFile(fakePdf);

    expect(result.valid).toBe(false);
    expect(result.error).toContain("không được hỗ trợ");
  });

  it("chấp nhận fixture PDF thật và trả về kind pdf", async () => {
    const pdfFile = await createFixtureFile("sample-tour-vi.pdf", "application/pdf");

    const result = await validateFile(pdfFile);

    expect(result).toMatchObject({
      valid: true,
      kind: "pdf",
      detectedMime: "application/pdf",
    });
  });

  it("chấp nhận fixture DOCX thật và trả về kind docx", async () => {
    const docxFile = await createFixtureFile(
      "sample-tour-vi.docx",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );

    const result = await validateFile(docxFile);

    expect(result).toMatchObject({
      valid: true,
      kind: "docx",
      detectedMime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
  });
});
