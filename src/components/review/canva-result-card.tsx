"use client";

import React from "react";
import {
  AlertTriangle,
  Check,
  Copy,
  ExternalLink,
  Loader2,
  RefreshCw,
  Users,
} from "lucide-react";
import { toast } from "sonner";

type ArtifactType = "ITINERARY" | "MENU";
type ArtifactStatus = "SUCCEEDED" | "FAILED" | "PROCESSING";
type CanvaShareJobStatus = "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED" | "SKIPPED" | "ENQUEUE_FAILED" | "DRY_RUN";

interface CanvaShareJobSummary {
  status: CanvaShareJobStatus;
  lastError: string | null;
}

interface CanvaResultCardProps {
  artifactType: ArtifactType;
  status: ArtifactStatus;
  editUrl?: string;
  viewUrl?: string;
  thumbnailUrl?: string;
  errorMessage?: string;
  shareJob?: CanvaShareJobSummary | null;
  onRetry: () => void;
  onRegenerate: () => void;
  disableRetry?: boolean;
  disableRegenerate?: boolean;
  disableCopy?: boolean;
  showRegenerate?: boolean;
}

function getArtifactTitle(artifactType: ArtifactType) {
  return artifactType === "ITINERARY" ? "Lịch trình" : "Thực đơn";
}

function getStatusLabel(status: ArtifactStatus) {
  if (status === "SUCCEEDED") return "Thành công";
  if (status === "FAILED") return "Thất bại";
  return "Đang xử lý";
}

function getShareStatusText(shareJob?: CanvaShareJobSummary | null) {
  if (!shareJob) return "Đang chờ xếp hàng chia sẻ Canva.";
  if (shareJob.status === "SUCCEEDED") {
    return "Đã đặt quyền chỉnh sửa cho bất kỳ ai có liên kết.";
  }
  if (shareJob.status === "PENDING" || shareJob.status === "RUNNING") {
    return "Đang đặt quyền chỉnh sửa cho bất kỳ ai có liên kết…";
  }
  if (shareJob.status === "DRY_RUN") {
    return "Đã mô phỏng chia sẻ; chưa đổi quyền Canva thật.";
  }
  if (shareJob.status === "SKIPPED") {
    return shareJob.lastError ?? "Đã bỏ qua chia sẻ Canva.";
  }

  return `Thiết kế đã tạo nhưng chưa chia sẻ tự động được: ${shareJob.lastError ?? "vui lòng đặt quyền 'bất kỳ ai có liên kết' thủ công trong Canva."}`;
}

function getShareTone(shareJob?: CanvaShareJobSummary | null) {
  if (shareJob?.status === "SUCCEEDED") return "ok";
  if (
    shareJob?.status === "FAILED" ||
    shareJob?.status === "SKIPPED" ||
    shareJob?.status === "ENQUEUE_FAILED" ||
    shareJob?.status === "DRY_RUN"
  ) {
    return "warn";
  }
  return "neutral";
}

export function CanvaResultCard({
  artifactType,
  status,
  editUrl,
  thumbnailUrl,
  errorMessage,
  shareJob,
  onRetry,
  onRegenerate,
  disableRetry = false,
  disableRegenerate = false,
  disableCopy = false,
  showRegenerate = true,
}: CanvaResultCardProps) {
  const title = getArtifactTitle(artifactType);
  const isSucceeded = status === "SUCCEEDED";
  const isFailed = status === "FAILED";
  // editUrl is the private Connect-API URL (/api/design/<JWT>/edit) until the
  // share worker overwrites it with the public /design/<id>/<token>/edit link.
  // Only then can other accounts open it — so keep open/copy locked until then.
  const shareReady = shareJob?.status === "SUCCEEDED";
  const shareInProgress =
    !shareJob || shareJob.status === "PENDING" || shareJob.status === "RUNNING";
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
    "div",
    { className: `rv-result${isSucceeded ? " ok" : isFailed ? " fail" : ""}` },
    React.createElement(
      "div",
      { className: "rv-result-h" },
      React.createElement("h3", { className: "rt" }, title),
      React.createElement(
        "span",
        { className: `rv-rbadge ${isSucceeded ? "ok" : isFailed ? "fail" : "proc"}` },
        isSucceeded
          ? React.createElement(Check)
          : isFailed
            ? React.createElement(AlertTriangle)
            : React.createElement(Loader2, { className: "rv-spin" }),
        getStatusLabel(status),
      ),
    ),
    thumbnailUrl
      ? React.createElement("img", {
          src: thumbnailUrl,
          alt: `Xem trước ${title}`,
          className: "rv-thumb",
        })
      : null,
    React.createElement("p", { className: "rv-rhelper" }, helperText),
    isSucceeded
      ? React.createElement(
          "p",
          { className: `rv-share ${getShareTone(shareJob)}` },
          React.createElement(Users),
          React.createElement("span", null, getShareStatusText(shareJob)),
        )
      : null,
    React.createElement(
      "div",
      { className: "rv-result-actions" },
      editUrl && shareReady
        ? React.createElement(
            "a",
            { className: "rv-btn sm", href: editUrl, target: "_blank", rel: "noreferrer" },
            React.createElement(ExternalLink),
            " Mở trong Canva",
          )
        : isSucceeded
          ? React.createElement(
              "button",
              { type: "button", className: "rv-btn sm", disabled: true },
              shareInProgress
                ? React.createElement(Loader2, { className: "rv-spin" })
                : React.createElement(ExternalLink),
              shareInProgress ? " Đang chuẩn bị liên kết…" : " Mở trong Canva",
            )
          : null,
      React.createElement(
        "button",
        {
          type: "button",
          className: "rv-btn ghost sm",
          onClick: () => void handleCopy(),
          disabled: disableCopy || (isSucceeded && !shareReady),
        },
        React.createElement(Copy),
        " Sao chép link",
      ),
      isFailed
        ? React.createElement(
            "button",
            {
              type: "button",
              className: "rv-btn danger sm",
              onClick: onRetry,
              disabled: disableRetry,
            },
            React.createElement(RefreshCw),
            " Thử lại",
          )
        : null,
      showRegenerate
        ? React.createElement(
            "button",
            {
              type: "button",
              className: "rv-btn ghost sm",
              onClick: onRegenerate,
              disabled: disableRegenerate,
            },
            React.createElement(RefreshCw),
            " Tạo lại",
          )
        : null,
    ),
  );
}
