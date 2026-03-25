import "server-only";

import { callExtractionApi } from "./extraction-client";
import { EXTRACTION_SYSTEM_PROMPT } from "./extraction-prompt";
import { structuredDraftSchema, type StructuredDraft } from "./extraction-schema";

export interface ExtractTourResult {
  draft: StructuredDraft;
  model: string;
  attemptCount: number;
}

export async function extractTour(normalizedText: string): Promise<ExtractTourResult> {
  if (!normalizedText || normalizedText.trim().length === 0) {
    throw new Error("Không có văn bản để trích xuất. Vui lòng kiểm tra file tải lên.");
  }

  const result = await callExtractionApi({
    systemPrompt: EXTRACTION_SYSTEM_PROMPT,
    userContent: normalizedText,
  });

  // Parse JSON from AI response
  let rawJson: unknown;
  try {
    rawJson = JSON.parse(result.content);
  } catch {
    throw new Error(
      "AI trả về nội dung không đúng định dạng JSON. Vui lòng thử Trích xuất lại.",
    );
  }

  // Validate against Zod schema (SAFE-02)
  const parsed = structuredDraftSchema.safeParse(rawJson);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .slice(0, 3)
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new Error(
      `Kết quả AI không khớp cấu trúc yêu cầu (${issues}). Vui lòng thử Trích xuất lại.`,
    );
  }

  return {
    draft: parsed.data,
    model: result.model,
    attemptCount: result.attemptCount,
  };
}
