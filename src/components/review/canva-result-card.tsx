"use client";

import React from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ArtifactType = "ITINERARY" | "MENU";
type ArtifactStatus = "SUCCEEDED" | "FAILED" | "PROCESSING";

interface CanvaResultCardProps {
  artifactType: ArtifactType;
  status: ArtifactStatus;
  editUrl?: string;
  viewUrl?: string;
  thumbnailUrl?: string;
  errorMessage?: string;
  onRetry: () => void;
  onRegenerate: () => void;
}

function getArtifactTitle(artifactType: ArtifactType) {
  return artifactType === "ITINERARY" ? "Lịch trình" : "Thực đơn";
}

function getStatusLabel(status: ArtifactStatus) {
  if (status === "SUCCEEDED") return "Thành công";
  if (status === "FAILED") return "Thất bại";
  return "Đang xử lý";
}

export function CanvaResultCard({
  artifactType,
  status,
  editUrl,
  thumbnailUrl,
  errorMessage,
  onRetry,
  onRegenerate,
}: CanvaResultCardProps) {
  const title = getArtifactTitle(artifactType);
  const isSucceeded = status === "SUCCEEDED";
  const isFailed = status === "FAILED";
  const badgeVariant = isFailed
    ? "destructive"
    : isSucceeded
      ? "secondary"
      : "outline";
  const helperText = isSucceeded
    ? "Liên kết Canva đã sẵn sàng."
    : errorMessage || "Không thể tạo Canva lúc này. Hãy thử lại.";

  const handleCopy = async () => {
    if (!editUrl) {
      toast.error("Không có liên kết Canva để sao chép.");
      return;
    }

    await navigator.clipboard.writeText(editUrl);
    toast.success("Đã sao chép liên kết Canva.");
  };

  return React.createElement(
    Card,
    { className: "h-full border bg-white shadow-sm" },
    React.createElement(
      CardHeader,
      {
        className: "flex flex-row items-start justify-between gap-4 p-4",
      },
      React.createElement(
        CardTitle,
        { className: "text-xl font-semibold text-foreground" },
        title,
      ),
      React.createElement(Badge, { variant: badgeVariant }, getStatusLabel(status)),
    ),
    React.createElement(
      CardContent,
      { className: "space-y-4 p-4 pt-0" },
      thumbnailUrl
        ? React.createElement("img", {
            src: thumbnailUrl,
            alt: `Xem trước ${title}`,
            className: "h-40 w-full rounded-lg border object-cover",
          })
        : null,
      React.createElement(
        "p",
        { className: "text-base text-muted-foreground" },
        helperText,
      ),
      React.createElement(
        "div",
        { className: "flex flex-wrap gap-2" },
        editUrl
          ? React.createElement(
              Button,
              {
                asChild: true,
                className:
                  "bg-[#3B82F6] text-white hover:bg-[#3B82F6]/90 focus-visible:ring-[#3B82F6]",
              },
              React.createElement(
                "a",
                { href: editUrl, target: "_blank", rel: "noreferrer" },
                "Mở trong Canva",
              ),
            )
          : null,
        React.createElement(
          Button,
          { variant: "outline", onClick: () => void handleCopy() },
          "Sao chép link",
        ),
        isFailed
          ? React.createElement(
              Button,
              { variant: "destructive", onClick: onRetry },
              "Thử lại",
            )
          : null,
        React.createElement(
          Button,
          { variant: "secondary", onClick: onRegenerate },
          "Tạo lại",
        ),
      ),
    ),
  );
}
