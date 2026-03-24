import "server-only";

import { detectFileSignature } from "@/lib/documents/detect";
import {
  ALLOWED_EXTENSIONS,
  ALLOWED_MIMES,
  MAX_FILE_SIZE_BYTES,
  type FileValidationResult,
} from "@/lib/documents/types";

const ERRORS = {
  unsupportedFormat:
    "Định dạng file không được hỗ trợ. Vui lòng chọn file PDF hoặc DOCX.",
  tooLarge: "File vượt quá 10MB. Vui lòng chọn file nhỏ hơn.",
  missingFile: "Vui lòng chọn một file trước khi xử lý.",
} as const;

function getFileExtension(fileName: string): string | undefined {
  const lastDotIndex = fileName.lastIndexOf(".");

  if (lastDotIndex === -1) {
    return undefined;
  }

  return fileName.slice(lastDotIndex).toLowerCase();
}

export async function validateFile(
  file: File | null | undefined
): Promise<FileValidationResult> {
  if (!file) {
    return {
      valid: false,
      error: ERRORS.missingFile,
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: ERRORS.tooLarge,
    };
  }

  const extension = getFileExtension(file.name);

  if (
    !extension ||
    !ALLOWED_EXTENSIONS.includes(extension as (typeof ALLOWED_EXTENSIONS)[number])
  ) {
    return {
      valid: false,
      error: ERRORS.unsupportedFormat,
    };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const signature = await detectFileSignature(bytes);

  if (!signature) {
    return {
      valid: false,
      error: ERRORS.unsupportedFormat,
    };
  }

  const kind = ALLOWED_MIMES[signature.mime];
  const expectedExtension = `.${signature.ext.toLowerCase()}`;

  if (!kind || expectedExtension !== extension) {
    return {
      valid: false,
      error: ERRORS.unsupportedFormat,
    };
  }

  return {
    valid: true,
    kind,
    detectedMime: signature.mime,
  };
}
