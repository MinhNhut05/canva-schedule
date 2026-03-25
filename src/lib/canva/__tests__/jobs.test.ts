import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { canvaFetch } = vi.hoisted(() => ({
  canvaFetch: vi.fn(),
}));

vi.mock("@/lib/canva/client", () => ({
  canvaFetch,
}));

import {
  POLL_DELAYS_MS,
  createAutofillJob,
  pollAutofillJob,
} from "@/lib/canva/jobs";

describe("createAutofillJob", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends correct body with brand_template_id, data, and title", async () => {
    canvaFetch.mockResolvedValue(
      new Response(JSON.stringify({ job: { id: "job-123" } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const data = {
      title: { type: "text" as const, text: "Tour 1 ngày" },
    };

    await expect(
      createAutofillJob("template-123", data, "Generated title")
    ).resolves.toBe("job-123");

    expect(canvaFetch).toHaveBeenCalledWith("/autofills", {
      method: "POST",
      body: JSON.stringify({
        brand_template_id: "template-123",
        title: "Generated title",
        data,
      }),
    });
  });
});

describe("pollAutofillJob", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  it("returns designId and URLs on success status", async () => {
    canvaFetch.mockImplementation(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            job: {
              status: "success",
              result: {
                design: {
                  id: "design-123",
                  urls: {
                    edit_url: "https://canva.com/edit/design-123",
                    view_url: "https://canva.com/view/design-123",
                  },
                  thumbnail: {
                    url: "https://cdn.canva.com/thumb/design-123.png",
                  },
                },
              },
            },
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        )
      )
    );

    const resultPromise = pollAutofillJob("job-123");
    await vi.advanceTimersByTimeAsync(POLL_DELAYS_MS[0]);

    await expect(resultPromise).resolves.toEqual({
      designId: "design-123",
      editUrl: "https://canva.com/edit/design-123",
      viewUrl: "https://canva.com/view/design-123",
      thumbnailUrl: "https://cdn.canva.com/thumb/design-123.png",
    });
  });

  it("throws on failed status with the error message", async () => {
    canvaFetch.mockImplementation(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            job: {
              status: "failed",
              error: { message: "Template field mismatch" },
            },
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        )
      )
    );

    const resultPromise = pollAutofillJob("job-123");
    const expectation = expect(resultPromise).rejects.toThrow(
      "Template field mismatch"
    );
    await vi.advanceTimersByTimeAsync(POLL_DELAYS_MS[0]);

    await expectation;
  });

  it("throws timeout after max poll attempts on perpetual in_progress", async () => {
    canvaFetch.mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify({ job: { status: "in_progress" } }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
    );

    const resultPromise = pollAutofillJob("job-123");
    const expectation = expect(resultPromise).rejects.toThrow(
      "Canva generation timed out after polling"
    );

    for (const delayMs of POLL_DELAYS_MS) {
      await vi.advanceTimersByTimeAsync(delayMs);
    }

    await expectation;
    expect(canvaFetch).toHaveBeenCalledTimes(POLL_DELAYS_MS.length);
  });
});
