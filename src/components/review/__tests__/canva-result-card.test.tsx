import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, asChild, ...props }: Record<string, unknown>) => {
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, props as Record<string, unknown>);
    }

    return React.createElement("button", props, children);
  },
}));

vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children, ...props }: Record<string, unknown>) =>
    React.createElement("span", props, children),
}));

vi.mock("@/components/ui/card", () => ({
  Card: ({ children, ...props }: Record<string, unknown>) =>
    React.createElement("div", props, children),
  CardHeader: ({ children, ...props }: Record<string, unknown>) =>
    React.createElement("div", props, children),
  CardTitle: ({ children, ...props }: Record<string, unknown>) =>
    React.createElement("h3", props, children),
  CardContent: ({ children, ...props }: Record<string, unknown>) =>
    React.createElement("div", props, children),
}));

import { CanvaResultCard } from "@/components/review/canva-result-card";

function renderResultCard(
  overrides?: Partial<React.ComponentProps<typeof CanvaResultCard>>,
) {
  return React.createElement(CanvaResultCard, {
    artifactType: "ITINERARY",
    status: "SUCCEEDED",
    editUrl: "https://canva.com/edit/itinerary",
    onRetry: () => {},
    onRegenerate: () => {},
    ...overrides,
  });
}

describe("CanvaResultCard", () => {
  it("renders Lịch trình title for ITINERARY", () => {
    const html = renderToStaticMarkup(renderResultCard());

    expect(html).toContain("Lịch trình");
  });

  it("renders Thực đơn title for MENU", () => {
    const html = renderToStaticMarkup(
      renderResultCard({
        artifactType: "MENU",
        editUrl: "https://canva.com/edit/menu",
      }),
    );

    expect(html).toContain("Thực đơn");
  });

  it("shows Mở trong Canva link when editUrl provided", () => {
    const html = renderToStaticMarkup(renderResultCard());

    expect(html).toContain("Mở trong Canva");
    expect(html).toContain("https://canva.com/edit/itinerary");
  });

  it("shows Sao chép link button", () => {
    const html = renderToStaticMarkup(renderResultCard());

    expect(html).toContain("Sao chép link");
  });

  it("shows Thử lại only on FAILED status", () => {
    const html = renderToStaticMarkup(
      renderResultCard({
        artifactType: "MENU",
        status: "FAILED",
        editUrl: undefined,
        errorMessage: "Không thể tạo Canva lúc này. Hãy thử lại.",
      }),
    );

    expect(html).toContain("Thử lại");
  });

  it("does not show Thử lại on SUCCEEDED status", () => {
    const html = renderToStaticMarkup(
      renderResultCard({
        artifactType: "MENU",
        editUrl: "https://canva.com/edit/menu",
      }),
    );

    expect(html).not.toContain("Thử lại");
  });
});
