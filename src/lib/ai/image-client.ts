import "server-only";

import OpenAI from "openai";
import type { ImageGenerateParams } from "openai/resources/images";

import { getAiConfig } from "@/lib/ai/server-client";

export const IMAGE_MODEL = process.env.AI_IMAGE_MODEL?.trim() || "cx/gpt-5.5-image";
export const IMAGE_TIMEOUT_MS = 240_000;
export const IMAGE_MAX_RETRIES = 1;

export const IMAGE_SIZES = [
  "auto",
  "1024x1024",
  "1024x1536",
  "1536x1024",
] as const;

export type ImageSize = (typeof IMAGE_SIZES)[number];

const NON_RETRYABLE_STATUS_CODES = [400, 401, 403, 404, 406, 422];

function createImageClient() {
  const { baseUrl, apiKey } = getAiConfig();

  return new OpenAI({
    apiKey,
    baseURL: baseUrl,
  });
}

function isRetryableError(error: unknown) {
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

async function urlToBytes(url: string) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Không thể tải ảnh do AI trả về.");
  }

  const contentType = response.headers.get("content-type") || "image/png";
  return {
    bytes: new Uint8Array(await response.arrayBuffer()),
    contentType,
  };
}

function b64ToBytes(value: string) {
  return new Uint8Array(Buffer.from(value, "base64"));
}

export interface GenerateImagesOptions {
  prompt: string;
  size: ImageSize;
  n: number;
  userId: string;
}

export interface GeneratedImage {
  bytes: Uint8Array;
  contentType: string;
}

export async function generateImages({ prompt, size, n, userId }: GenerateImagesOptions): Promise<GeneratedImage[]> {
  const client = createImageClient();
  let lastError: unknown;

  for (let attempt = 1; attempt <= IMAGE_MAX_RETRIES + 1; attempt += 1) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), IMAGE_TIMEOUT_MS);

      try {
        const request: ImageGenerateParams = {
          model: IMAGE_MODEL,
          prompt,
          n,
          size,
          output_format: "png",
          user: userId,
        };

        const response = await client.images.generate(request, {
          signal: controller.signal,
        });

        const images = response.data ?? [];

        if (images.length === 0) {
          throw new Error("AI không trả về ảnh. Vui lòng thử lại.");
        }

        return Promise.all(
          images.map((image) => {
            if (image.b64_json) {
              return Promise.resolve({
                bytes: b64ToBytes(image.b64_json),
                contentType: "image/png",
              });
            }

            if (image.url) {
              return urlToBytes(image.url);
            }

            throw new Error("AI trả về định dạng ảnh không hỗ trợ.");
          }),
        );
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      lastError = error;

      if (attempt <= IMAGE_MAX_RETRIES && isRetryableError(error)) {
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
        continue;
      }

      break;
    }
  }

  if (lastError instanceof Error && lastError.name === "AbortError") {
    throw new Error(`AI tạo ảnh phản hồi quá chậm (${IMAGE_TIMEOUT_MS / 1000} giây). Vui lòng thử lại sau.`);
  }

  if (lastError instanceof OpenAI.APIError) {
    const statusInfo = lastError.status ? `mã lỗi: ${lastError.status}` : `lỗi: ${lastError.message || "không xác định"}`;
    throw new Error(`Không thể tạo ảnh bằng AI (${statusInfo}). Vui lòng thử lại sau.`);
  }

  const errorMsg = lastError instanceof Error ? lastError.message : "không xác định";
  throw new Error(`Có lỗi xảy ra khi tạo ảnh bằng AI (${errorMsg}). Vui lòng thử lại sau.`);
}
