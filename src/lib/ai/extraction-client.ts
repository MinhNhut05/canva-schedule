import "server-only";

import OpenAI from "openai";
import { getAiConfig } from "@/lib/ai/server-client";

const AI_MODEL = "gpt-5.4";
const MAX_RETRIES = 2;

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
      const completion = await client.chat.completions.create({
        model: AI_MODEL,
        messages: [
          { role: "system", content: options.systemPrompt },
          { role: "user", content: options.userContent },
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error("AI không trả về nội dung. Vui lòng thử lại.");
      }

      return {
        content,
        model: completion.model || AI_MODEL,
        attemptCount: attempt,
      };
    } catch (error) {
      lastError = error;

      if (attempt <= MAX_RETRIES && isRetryableError(error)) {
        // Wait before retry: 1s, then 2s
        await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
        continue;
      }

      break;
    }
  }

  // All retries exhausted
  if (lastError instanceof OpenAI.APIError) {
    throw new Error(
      `Không thể kết nối với dịch vụ AI (mã lỗi: ${lastError.status}). Vui lòng thử lại sau.`,
    );
  }

  throw new Error(
    "Có lỗi xảy ra khi trích xuất nội dung bằng AI. Vui lòng thử lại sau.",
  );
}

export { AI_MODEL, MAX_RETRIES };
