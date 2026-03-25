import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { TemplateConfirmation } from "@/components/review/template-confirmation";

function renderTemplateConfirmation(
  overrides?: Partial<React.ComponentProps<typeof TemplateConfirmation>>,
) {
  return React.createElement(TemplateConfirmation, {
    duration: "ONE_DAY",
    templatePair: {
      duration: "ONE_DAY",
      itineraryTemplateId: "tpl-1",
      menuTemplateId: "tpl-2",
      displayLabel: "Tour 1 ngày",
    },
    onConfirm: () => {},
    disabled: false,
    ...overrides,
  });
}

function getConfirmButtonProps(
  element: React.ReactElement,
): React.ComponentProps<"button"> {
  const typedElement = element as React.ReactElement<{ children: React.ReactNode }>;
  const rootChildren = React.Children.toArray(typedElement.props.children);
  const cardContent = rootChildren[1] as React.ReactElement<{ children: React.ReactNode }>;
  const contentChildren = React.Children.toArray(cardContent.props.children);
  const buttonWrapper = contentChildren[1] as React.ReactElement<{ children: React.ReactNode }>;
  const buttonElement = buttonWrapper.props.children as React.ReactElement;

  return buttonElement.props as React.ComponentProps<"button">;
}

describe("TemplateConfirmation", () => {
  it("renders correct pair labels for ONE_DAY", () => {
    const html = renderToStaticMarkup(renderTemplateConfirmation());

    expect(html).toContain("Xác nhận mẫu Canva");
    expect(html).toContain("Tour 1 ngày — Lịch trình");
    expect(html).toContain("Tour 1 ngày — Thực đơn");
  });

  it("renders correct pair labels for TWO_DAY", () => {
    const html = renderToStaticMarkup(
      renderTemplateConfirmation({
        duration: "TWO_DAY",
        templatePair: {
          duration: "TWO_DAY",
          itineraryTemplateId: "tpl-3",
          menuTemplateId: "tpl-4",
          displayLabel: "Tour 2 ngày",
        },
      }),
    );

    expect(html).toContain("Tour 2 ngày — Lịch trình");
    expect(html).toContain("Tour 2 ngày — Thực đơn");
  });

  it("shows Lịch trình and Thực đơn in the pair", () => {
    const html = renderToStaticMarkup(renderTemplateConfirmation());

    expect(html).toContain("Lịch trình");
    expect(html).toContain("Thực đơn");
  });

  it("calls onConfirm when Tạo Canva clicked", () => {
    const onConfirm = vi.fn();
    const element = TemplateConfirmation({
      duration: "ONE_DAY",
      templatePair: {
        duration: "ONE_DAY",
        itineraryTemplateId: "tpl-1",
        menuTemplateId: "tpl-2",
        displayLabel: "Tour 1 ngày",
      },
      onConfirm,
      disabled: false,
    });

    const buttonProps = getConfirmButtonProps(element);
    buttonProps.onClick?.({} as React.MouseEvent<HTMLButtonElement>);

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("button disabled when disabled=true", () => {
    const element = TemplateConfirmation({
      duration: "ONE_DAY",
      templatePair: {
        duration: "ONE_DAY",
        itineraryTemplateId: "tpl-1",
        menuTemplateId: "tpl-2",
        displayLabel: "Tour 1 ngày",
      },
      onConfirm: () => {},
      disabled: true,
    });

    const buttonProps = getConfirmButtonProps(element);
    expect(buttonProps.disabled).toBe(true);
  });
});
