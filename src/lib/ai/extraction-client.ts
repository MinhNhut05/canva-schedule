import "server-only";

import OpenAI from "openai";

import { getAiConfig } from "@/lib/ai/server-client";

function normalizeModelName(model: string): string {
  return model.trim();
}

function parsePositiveInteger(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const AI_MODEL = normalizeModelName(process.env.AI_MODEL?.trim() || "cx/gpt-5.4");
const MAX_RETRIES = 1;
const AI_TIMEOUT_MS = 240_000;
const AI_MAX_COMPLETION_TOKENS = parsePositiveInteger(
  process.env.AI_MAX_COMPLETION_TOKENS,
  4096,
);

const NON_RETRYABLE_STATUS_CODES = [400, 401, 403, 404, 406, 422];

function maskApiKey(apiKey: string): string {
  if (!apiKey) {
    return "(missing)";
  }

  if (apiKey.length <= 8) {
    return `${apiKey.slice(0, 2)}***`;
  }

  return `${apiKey.slice(0, 6)}***${apiKey.slice(-4)}`;
}

function logExtractionApiError(
  phase: "retry" | "final",
  attempt: number,
  error: unknown,
): void {
  const { baseUrl, apiKey } = getAiConfig();
  const details =
    error instanceof OpenAI.APIError
      ? {
          status: error.status,
          message: error.message,
          requestId:
            "request_id" in error && typeof error.request_id === "string"
              ? error.request_id
              : undefined,
        }
      : {
          status: undefined,
          message: error instanceof Error ? error.message : String(error),
          requestId: undefined,
        };

  console.error("[AI extraction] upstream error", {
    phase,
    attempt,
    model: AI_MODEL,
    baseUrl,
    apiKey: maskApiKey(apiKey),
    ...details,
  });
}

export function createExtractionClient(): OpenAI {
  const { baseUrl, apiKey } = getAiConfig();

  return new OpenAI({
    apiKey,
    baseURL: baseUrl,
  });
}

function isRetryableError(error: unknown): boolean {
  if (error instanceof Error && error.name === "AbortError") {
    return true;
  }

  if (error instanceof OpenAI.APIError) {
    if (error.status && NON_RETRYABLE_STATUS_CODES.includes(error.status)) {
      return false;
    }

    return true;
  }

  if (error instanceof Error && error.message.includes("fetch")) {
    return true;
  }

  return false;
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

export async function callExtractionApi(
  options: ExtractionCallOptions,
): Promise<ExtractionCallResult> {
  const client = createExtractionClient();
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt += 1) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

      try {
        const completion = await client.chat.completions.create(
          {
            model: AI_MODEL,
            messages: [
              { role: "system", content: options.systemPrompt },
              { role: "user", content: options.userContent },
            ],
            max_tokens: AI_MAX_COMPLETION_TOKENS,
            response_format: { type: "json_object" },
            temperature: 0.1,
          },
          { signal: controller.signal },
        );

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
        logExtractionApiError("retry", attempt, error);
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, attempt - 1) * 1000),
        );
        continue;
      }

      logExtractionApiError("final", attempt, error);
      break;
    }
  }

  if (lastError instanceof Error && lastError.name === "AbortError") {
    throw new Error(
      `AI phản hồi quá chậm (${AI_TIMEOUT_MS / 1000} giây). Vui lòng thử lại sau.`,
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

export { AI_MAX_COMPLETION_TOKENS, AI_MODEL, AI_TIMEOUT_MS, MAX_RETRIES };
