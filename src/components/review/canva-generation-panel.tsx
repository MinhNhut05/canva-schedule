"use client";

import React from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";

interface CanvaGenerationPanelProps {
  isGenerating: boolean;
  isRateLimited: boolean;
  cooldownMinutes?: number;
}

function SpinnerIcon() {
  return React.createElement(
    "svg",
    {
      "aria-hidden": true,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 2,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      className: "size-5 animate-spin text-[#3B82F6]",
    },
    React.createElement("path", { d: "M21 12a9 9 0 1 1-6.219-8.56" }),
  );
}

export function CanvaGenerationPanel({
  isGenerating,
  isRateLimited,
  cooldownMinutes,
}: CanvaGenerationPanelProps) {
  if (isRateLimited) {
    return React.createElement(
      Alert,
      { className: "border-destructive/40 bg-destructive/5" },
      React.createElement(
        AlertTitle,
        { className: "text-base font-semibold text-destructive" },
        `Canva đang bận, vui lòng thử lại sau ${cooldownMinutes ?? 1} phút.`,
      ),
      React.createElement(
        AlertDescription,
        { className: "text-base text-destructive/80" },
        `Thời gian chờ còn lại: ${cooldownMinutes ?? 1} phút.`,
      ),
    );
  }

  if (!isGenerating) {
    return null;
  }

  return React.createElement(
    Card,
    { className: "border-[#3B82F6]/20 bg-white" },
    React.createElement(
      CardContent,
      { className: "flex items-start gap-3 p-4" },
      React.createElement(SpinnerIcon),
      React.createElement(
        "div",
        { className: "space-y-1" },
        React.createElement(
          "p",
          { className: "text-base font-semibold text-foreground" },
          "Đang tạo Canva...",
        ),
        React.createElement(
          "p",
          { className: "text-base text-muted-foreground" },
          "Quá trình này thường mất 10–30 giây.",
        ),
      ),
    ),
  );
}
