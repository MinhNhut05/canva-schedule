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
  Button: ({ children, asChild, ...props }: { children?: React.ReactNode; asChild?: boolean; [key: string]: unknown }) => {
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, props as Record<string, unknown>);
    }

    return React.createElement("button", props, children);
  },
}));

vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) =>
    React.createElement("span", props, children),
}));

vi.mock("@/components/ui/card", () => ({
  Card: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) =>
    React.createElement("div", props, children),
  CardHeader: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) =>
    React.createElement("div", props, children),
  CardTitle: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) =>
    React.createElement("h3", props, children),
  CardContent: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) =>
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

  it("shows Mở trong Canva link only after share succeeds", () => {
    const html = renderToStaticMarkup(
      renderResultCard({ shareJob: { status: "SUCCEEDED", lastError: null } }),
    );

    expect(html).toContain("Mở trong Canva");
    expect(html).toContain("https://canva.com/edit/itinerary");
  });

  it("locks Mở trong Canva while share is still pending", () => {
    const html = renderToStaticMarkup(renderResultCard());

    expect(html).toContain("Đang chuẩn bị liên kết…");
    expect(html).not.toContain('href="https://canva.com/edit/itinerary"');
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

  it("shows share success status as anyone-with-link edit", () => {
    const html = renderToStaticMarkup(
      renderResultCard({
        shareJob: {
          status: "SUCCEEDED",
          lastError: null,
        },
      }),
    );

    expect(html).toContain("Đã đặt quyền chỉnh sửa cho bất kỳ ai có liên kết.");
  });

  it("shows warning-only share failure status", () => {
    const html = renderToStaticMarkup(
      renderResultCard({
        shareJob: {
          status: "FAILED",
          lastError: "Không thể chia sẻ Canva tự động.",
        },
      }),
    );

    expect(html).toContain("Thiết kế đã tạo nhưng chưa chia sẻ tự động được");
    expect(html).toContain("Không thể chia sẻ Canva tự động.");
  });

  it("does not report dry-run as a real share", () => {
    const html = renderToStaticMarkup(
      renderResultCard({
        shareJob: {
          status: "DRY_RUN",
          lastError: "Dry-run mode: Canva share was not sent.",
        },
      }),
    );

    expect(html).toContain("Đã mô phỏng chia sẻ");
    expect(html).toContain("chưa đổi quyền Canva thật");
  });
});
