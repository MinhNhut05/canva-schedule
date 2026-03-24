export type DocumentKind = "pdf" | "docx";

export type UploadStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "COMPLETED_WITH_WARNING"
  | "FAILED";

/** Maps to UI badges: "Tốt", "Cần kiểm tra", "Thấp" */
export type QualityLevel = "good" | "warning" | "poor";

export type QualityFlag =
  | "textTooShort"
  | "containsReplacementChars"
  | "lowVietnameseSignal"
  | "highSymbolNoise"
  | "likelyScannedPdf"
  | "fragmentedDocx";

export interface QualityResult {
  score: number;
  level: QualityLevel;
  flags: QualityFlag[];
}

export interface ExtractionResult {
  kind: DocumentKind;
  originalFileName: string;
  mime: string;
  sizeBytes: number;
  rawText: string;
  normalizedText: string;
  pageCount?: number;
  warnings: string[];
  quality: QualityResult;
  processingTimeMs: number;
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  kind?: DocumentKind;
  detectedMime?: string;
}

export interface UploadApiResponse {
  success: boolean;
  data?: ExtractionResult & { uploadId: string };
  error?: string;
}

export const ALLOWED_MIMES: Record<string, DocumentKind> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};

export const ALLOWED_EXTENSIONS = [".pdf", ".docx"] as const;

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export const MAX_FILE_SIZE_LABEL = "10MB";
