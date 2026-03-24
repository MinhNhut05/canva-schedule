import "server-only";

import { extractDocxText } from "./extract-docx";
import { extractPdfText } from "./extract-pdf";
import { normalizeText } from "./normalize";
import { scoreQuality } from "./quality";
import type { QualityInput } from "./quality";
import type { DocumentKind, ExtractionResult } from "./types";

export async function runExtractionPipeline(
  fileBytes: Uint8Array,
  fileName: string,
  kind: DocumentKind,
  mime: string,
  sizeBytes: number
): Promise<ExtractionResult> {
  const startTime = Date.now();

  let rawText: string;
  let warnings: string[];
  let qualityInput: QualityInput;
  let pageCount: number | undefined;

  if (kind === "pdf") {
    const pdfResult = await extractPdfText(fileBytes);
    rawText = pdfResult.rawText;
    warnings = pdfResult.warnings;
    pageCount = pdfResult.pageCount;

    const normalizedText = normalizeText(rawText);
    qualityInput = {
      text: normalizedText,
      kind: "pdf",
      pageCount: pdfResult.pageCount,
      textItemCount: pdfResult.textItemCount,
    };
  } else {
    const docxResult = await extractDocxText(Buffer.from(fileBytes));
    rawText = docxResult.rawText;
    warnings = docxResult.warnings;

    const normalizedText = normalizeText(rawText);
    qualityInput = {
      text: normalizedText,
      kind: "docx",
      lineCount: docxResult.lineCount,
    };
  }

  const normalizedText = qualityInput.text;
  const quality = scoreQuality(qualityInput);
  const processingTimeMs = Date.now() - startTime;

  return {
    kind,
    originalFileName: fileName,
    mime,
    sizeBytes,
    rawText,
    normalizedText,
    pageCount,
    warnings,
    quality,
    processingTimeMs,
  };
}
