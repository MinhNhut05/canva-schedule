import "server-only";

import { canvaFetch, CanvaRateLimitError } from "./client";

export interface VerifyTemplateResult {
  success: boolean;
  error?: string;
}

/**
 * Verify that a Canva design/template ID exists and is accessible
 * with the current Canva token.
 *
 * Uses GET /designs/{designId} — the same endpoint the app already
 * trusts for reading design URLs during generation.
 */
export async function verifyCanvaTemplate(
  templateId: string,
): Promise<VerifyTemplateResult> {
  if (!templateId || templateId.trim().length === 0) {
    return {
      success: false,
      error: "Template ID không được để trống.",
    };
  }

  try {
    const response = await canvaFetch(`/designs/${templateId.trim()}`);

    if (response.ok) {
      return { success: true };
    }

    if (response.status === 404) {
      return {
        success: false,
        error: "Không tìm thấy mẫu Canva với ID này. Kiểm tra lại Template ID.",
      };
    }

    if (response.status === 403) {
      return {
        success: false,
        error: "Không có quyền truy cập mẫu Canva này. Kiểm tra quyền truy cập Canva.",
      };
    }

    return {
      success: false,
      error: `Canva API trả về lỗi (${response.status}). Thử lại sau.`,
    };
  } catch (error) {
    if (error instanceof CanvaRateLimitError) {
      return {
        success: false,
        error: `Canva API đang giới hạn tốc độ. Thử lại sau ${error.cooldownSeconds} giây.`,
      };
    }

    return {
      success: false,
      error: "Không thể kết nối đến Canva API. Thử lại sau.",
    };
  }
}
