import "server-only";

import OpenAI from "openai";
import { getAiConfig } from "@/lib/ai/server-client";

const AI_MODEL = "ag/gemini-3-flash";
const MAX_RETRIES = 1;
const AI_TIMEOUT_MS = 45_000;

// Errors that should NOT be retried
const NON_RETRYABLE_STATUS_CODES = [400, 401, 403, 404, 422];

export function createExtractionClient(): OpenAI {
  const { baseUrl, apiKey } = getAiConfig();
  return new OpenAI({
    apiKey,
    baseURL: baseUrl,
  });
}

export interface ExtractionCallOptions {
  systemPrompt: string;
  userContent: string;
}

export interface ExtractionCallResult {
  content: string;
  model: string;
  attemptCount: number;
}

function isRetryableError(error: unknown): boolean {
  if (error instanceof Error && error.name === "AbortError") {
    return true; // Timeouts are retryable
  }

  if (error instanceof OpenAI.APIError) {
    if (NON_RETRYABLE_STATUS_CODES.includes(error.status)) return false;
    // Retry on 429 (rate limit), 500, 502, 503, 504
    return true;
  }

  // Network errors are retryable
  if (error instanceof Error && error.message.includes("fetch")) return true;

  return false;
}

export async function callExtractionApi(
  options: ExtractionCallOptions,
): Promise<ExtractionCallResult> {
  const client = createExtractionClient();
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

      try {
        const completion = await client.chat.completions.create({
          model: AI_MODEL,
          messages: [
            { role: "system", content: options.systemPrompt },
            { role: "user", content: options.userContent },
          ],
          response_format: { type: "json_object" },
          temperature: 0.1,
          stream: false,
        }, { signal: controller.signal });

        const content = completion.choices[0]?.message?.content;
        if (!content) {
          throw new Error("AI không trả về nội dung. Vui lòng thử lại.");
        }

        return {
          content,
          model: completion.model || AI_MODEL,
          attemptCount: attempt,
        };
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      lastError = error;

      if (attempt <= MAX_RETRIES && isRetryableError(error)) {
        // Exponential backoff: attempt=1 -> 1000ms, attempt=2 -> 2000ms, attempt=3 -> 4000ms
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
        continue;
      }

      break;
    }
  }

  // All retries exhausted
  if (lastError instanceof Error && lastError.name === "AbortError") {
    throw new Error(
      `AI phản hồi quá chậm (${AI_TIMEOUT_MS / 1000} giây). Vui lòng thử lại sau.`
    );
  }

  if (lastError instanceof OpenAI.APIError) {
    const statusInfo = lastError.status
      ? `mã lỗi: ${lastError.status}`
      : `lỗi: ${lastError.message || "không xác định"}`;
    throw new Error(
      `Không thể kết nối với dịch vụ AI (${statusInfo}). Vui lòng thử lại sau.`,
    );
  }

  const errorMsg = lastError instanceof Error ? lastError.message : "không xác định";
  throw new Error(
    `Có lỗi xảy ra khi trích xuất nội dung bằng AI (${errorMsg}). Vui lòng thử lại sau.`,
  );
}

export { AI_MODEL, MAX_RETRIES, AI_TIMEOUT_MS };
