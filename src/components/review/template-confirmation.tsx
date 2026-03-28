"use client";

import React from "react";

import type { TemplatePair, TourDuration } from "@/lib/canva/template-resolver";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TemplateConfirmationProps {
  duration: TourDuration;
  templatePair: TemplatePair;
  onConfirm: () => void;
  disabled: boolean;
}

function getTemplateRows(label: string) {
  return [`${label} — Lịch trình`, `${label} — Thực đơn`];
}

export function TemplateConfirmation({
  templatePair,
  onConfirm,
  disabled,
}: TemplateConfirmationProps) {
  const rows = getTemplateRows(templatePair.displayLabel);

  return React.createElement(
    Card,
    {
      className:
        "border border-[#3B82F6]/40 bg-white shadow-sm ring-1 ring-[#3B82F6]/15",
    },
    React.createElement(
      CardHeader,
      { className: "space-y-2 p-4" },
      React.createElement(
        CardTitle,
        { className: "text-xl font-semibold text-foreground" },
        "Xác nhận mẫu Canva",
      ),
      React.createElement(
        "p",
        { className: "text-base text-muted-foreground" },
        "Nội dung đã được duyệt. Hãy xác nhận mẫu Canva rồi bắt đầu tạo liên kết.",
      ),
    ),
    React.createElement(
      CardContent,
      { className: "space-y-4 p-4 pt-0" },
      React.createElement(
        "div",
        {
          className:
            "space-y-3 rounded-xl border border-[#3B82F6]/30 bg-white p-4",
        },
        ...rows.map((row) =>
          React.createElement(
            "div",
            {
              key: row,
              className:
                "rounded-lg border border-[#3B82F6]/20 bg-[#F8FAFC] px-4 py-3 text-base font-medium text-foreground",
            },
            row,
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
            disabled,
            className:
              "bg-[#3B82F6] text-white hover:bg-[#3B82F6]/90 focus-visible:ring-[#3B82F6]",
          },
          "Tạo Canva",
        ),
      ),
    ),
  );
}
