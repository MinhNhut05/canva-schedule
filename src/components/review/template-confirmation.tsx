"use client";

import React from "react";
import { Check, LayoutTemplate, Sparkles } from "lucide-react";
import type { TemplatePair, TourDuration } from "@/lib/canva/template-resolver";

interface TemplateConfirmationProps {
  duration: TourDuration;
  templatePair: TemplatePair;
  onConfirm: () => void;
  disabled: boolean;
}

function getTemplateRows(pair: TemplatePair): { label: string; missing: boolean }[] {
  return [
    { label: `${pair.displayLabel} — Lịch trình`, missing: !pair.itineraryTemplateId },
    { label: `${pair.displayLabel} — Thực đơn`, missing: !pair.menuTemplateId },
  ];
}

export function TemplateConfirmation({
  templatePair,
  onConfirm,
  disabled,
}: TemplateConfirmationProps) {
  const rows = getTemplateRows(templatePair);
  const allMissing = rows.every((row) => row.missing);

  return React.createElement(
    "div",
    { className: "rv-card rv-tpl rv-rv" },
    React.createElement(
      "div",
      { className: "rv-tpl-head" },
      React.createElement(
        "div",
        { className: "rv-tpl-head-row" },
        React.createElement("span", { className: "rv-stage-pill" }, "Giai đoạn 4 · Xác nhận mẫu Canva"),
        React.createElement(
          "span",
          { className: "rv-tchip" },
          React.createElement(Check),
          " Đã duyệt",
        ),
      ),
      React.createElement("h3", { className: "rv-card-title" }, "Xác nhận mẫu Canva"),
      React.createElement(
        "p",
        { className: "rv-card-desc" },
        "Nội dung đã được duyệt. Kiểm tra nhanh cặp mẫu bên dưới rồi bắt đầu tạo liên kết Canva.",
      ),
    ),
    React.createElement(
      "div",
      { className: "rv-tpl-body" },
      React.createElement(
        "div",
        { className: "rv-tpl-rows" },
        ...rows.map((row) =>
          React.createElement(
            "div",
            {
              key: row.label,
              className: row.missing ? "rv-tpl-row missing" : "rv-tpl-row",
            },
            React.createElement(LayoutTemplate),
            row.missing ? `${row.label} (chưa cấu hình mẫu)` : row.label,
          ),
        ),
      ),
      React.createElement(
        "div",
        { className: "rv-actions-end" },
        React.createElement(
          "button",
          {
            type: "button",
            className: "rv-btn green",
            onClick: onConfirm,
            disabled: disabled || allMissing,
          },
          React.createElement(Sparkles),
          " Tạo Canva",
        ),
      ),
    ),
  );
}
