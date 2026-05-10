"use client";

import React from "react";
import type { TemplatePair, TourDuration } from "@/lib/canva/template-resolver";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
  const allMissing = rows.every((r) => r.missing);

  return React.createElement(
    Card,
    { className: "surface-panel-glass border-semantic-light overflow-hidden shadow-semantic-light" },
    React.createElement(
      CardHeader,
      { className: "space-y-3 border-b border-semantic-light bg-surface-panel-cool/60 p-5" },
      React.createElement(
        Badge,
        { variant: "outline", className: "w-fit border-primary/15 bg-primary/5 text-primary" },
        "Giai đoạn 4 · Xác nhận mẫu Canva",
      ),
      React.createElement(
        "div",
        { className: "space-y-2" },
        React.createElement(
          CardTitle,
          { className: "text-[1.35rem] leading-tight text-foreground" },
          "Xác nhận mẫu Canva",
        ),
        React.createElement(
          "p",
          { className: "text-base leading-7 text-muted-foreground" },
          "Nội dung đã được duyệt. Kiểm tra nhanh cặp mẫu bên dưới rồi bắt đầu tạo liên kết Canva.",
        ),
      ),
    ),
    React.createElement(
      CardContent,
      { className: "space-y-5 p-5" },
      React.createElement(
        "div",
        { className: "surface-panel-cool space-y-3 rounded-[24px] border border-semantic-light p-4" },
        ...rows.map((row) =>
          React.createElement(
            "div",
            {
              key: row.label,
              className: row.missing
                ? "rounded-[18px] border border-dashed border-muted-foreground/30 px-4 py-3 text-base font-medium text-muted-foreground/60"
                : "surface-panel-glass rounded-[18px] border border-primary/20 px-4 py-3 text-base font-medium text-foreground",
            },
            row.missing ? `${row.label} (chưa cấu hình mẫu)` : row.label,
          ),
        ),
      ),
      React.createElement(
        "div",
        { className: "flex justify-end" },
        React.createElement(
          Button,
          {
            onClick: onConfirm,
            disabled: disabled || allMissing,
            className: "glow-accent focus-ring-premium transition-premium hover-lift-subtle",
          },
          "Tạo Canva",
        ),
      ),
    ),
  );
}
