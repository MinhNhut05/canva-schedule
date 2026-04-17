import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const {
  mockCreate,
  mockOpenAIConstructor,
  MockOpenAIAPIError,
  mockGetAiConfig,
} = vi.hoisted(() => {
  const mockCreate = vi.fn();
  const mockOpenAIConstructor = vi.fn();

  class MockOpenAIAPIError extends Error {
    status?: number;

    constructor(message: string, status?: number) {
      super(message);
      this.name = "APIError";
      this.status = status;
    }
  }

  return {
    mockCreate,
    mockOpenAIConstructor,
    MockOpenAIAPIError,
    mockGetAiConfig: vi.fn(() => ({
      baseUrl: "https://ramclouds.me/v1",
      apiKey: "test-key",
    })),
  };
});

vi.mock("openai", () => {
  class OpenAIMock {
    static APIError = MockOpenAIAPIError;

    chat = {
      completions: {
        create: mockCreate,
      },
    };

    constructor(config: { apiKey: string; baseURL: string }) {
      mockOpenAIConstructor(config);
    }
  }

  return {
    default: OpenAIMock,
  };
});

vi.mock("@/lib/ai/server-client", () => ({
  getAiConfig: mockGetAiConfig,
}));

import {
  AI_MODEL,
  AI_TIMEOUT_MS,
  callExtractionApi,
  createExtractionClient,
} from "@/lib/ai/extraction-client";

describe("extraction-client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates an OpenAI-compatible client using configured base URL", () => {
    createExtractionClient();

    expect(mockGetAiConfig).toHaveBeenCalled();
    expect(mockOpenAIConstructor).toHaveBeenCalledWith({
      apiKey: "test-key",
      baseURL: "https://ramclouds.me/v1",
    });
  });

  it("calls chat.completions with json_object response format", async () => {
    mockCreate.mockResolvedValueOnce({
      model: AI_MODEL,
      choices: [
        {
          message: {
            content: "{\"ok\":true}",
          },
        },
      ],
    });

    await expect(
      callExtractionApi({
        systemPrompt: "system prompt",
        userContent: "user content",
      }),
    ).resolves.toEqual({
      content: "{\"ok\":true}",
      model: AI_MODEL,
      attemptCount: 1,
    });

    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(mockCreate).toHaveBeenCalledWith(
      {
        model: AI_MODEL,
        messages: [
          { role: "system", content: "system prompt" },
          { role: "user", content: "user content" },
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
      },
      { signal: expect.any(AbortSignal) },
    );
  });

  it("surfaces non-retryable API errors like 406 immediately", async () => {
    mockCreate.mockRejectedValueOnce(
      new MockOpenAIAPIError("Not acceptable", 406),
    );

    await expect(
      callExtractionApi({
        systemPrompt: "system prompt",
        userContent: "user content",
      }),
    ).rejects.toThrow("Không thể kết nối với dịch vụ AI (mã lỗi: 406)");

    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  it("returns timeout errors with the configured timeout window", async () => {
    const abortError = new Error("aborted");
    abortError.name = "AbortError";

    mockCreate.mockRejectedValue(
      abortError,
    );

    await expect(
      callExtractionApi({
        systemPrompt: "system prompt",
        userContent: "user content",
      }),
    ).rejects.toThrow(
      `AI phản hồi quá chậm (${AI_TIMEOUT_MS / 1000} giây). Vui lòng thử lại sau.`,
    );
  });
});
