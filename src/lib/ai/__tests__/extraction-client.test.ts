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
  AI_MAX_COMPLETION_TOKENS,
  AI_MODEL,
  AI_REASONING_EFFORT,
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
        max_tokens: AI_MAX_COMPLETION_TOKENS,
        response_format: { type: "json_object" },
        ...(AI_REASONING_EFFORT
          ? { reasoning_effort: AI_REASONING_EFFORT }
          : {}),
        ...(AI_MODEL.startsWith("gh/gpt-5") ? {} : { temperature: 0.1 }),
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

  it("preserves provider-prefixed model IDs like cx/gpt-5.4", async () => {
    const previousModel = process.env.AI_MODEL;
    process.env.AI_MODEL = "cx/gpt-5.4";
    vi.resetModules();

    try {
      const reloaded = await import("@/lib/ai/extraction-client");
      expect(reloaded.AI_MODEL).toBe("cx/gpt-5.4");
    } finally {
      if (previousModel === undefined) {
        delete process.env.AI_MODEL;
      } else {
        process.env.AI_MODEL = previousModel;
      }
      vi.resetModules();
    }
  });

  it("defaults to provider-prefixed oc/deepseek-v4-flash-free when AI_MODEL is unset", async () => {
    const previousModel = process.env.AI_MODEL;
    delete process.env.AI_MODEL;
    vi.resetModules();

    try {
      const reloaded = await import("@/lib/ai/extraction-client");
      expect(reloaded.AI_MODEL).toBe("oc/deepseek-v4-flash-free");
    } finally {
      if (previousModel === undefined) {
        delete process.env.AI_MODEL;
      } else {
        process.env.AI_MODEL = previousModel;
      }
      vi.resetModules();
    }
  });
});
