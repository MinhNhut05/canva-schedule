"use client";

import Link from "next/link";
import { useRef } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ExtractionResult as DocumentExtractionResult, QualityLevel } from "@/lib/documents/types";
import { cn } from "@/lib/utils";

interface ExtractionResultProps {
  data: DocumentExtractionResult;
  onReset: () => void;
  reviewHref?: string;
}

const qualityContent: Record<
  QualityLevel,
  {
    label: string;
    badgeClassName: string;
    summaryStatus: string;
    warningTitle?: string;
    warningBody?: string;
  }
> = {
  good: {
    label: "Tốt",
    badgeClassName: "border-transparent bg-emerald-600 text-white",
    summaryStatus: "Đã trích xuất",
  },
  warning: {
    label: "Cần kiểm tra",
    badgeClassName: "border-transparent bg-amber-400 text-amber-950",
    summaryStatus: "Đã trích xuất kèm cảnh báo",
    warningTitle: "Nội dung cần kiểm tra lại",
    warningBody:
      "Hệ thống đã trích xuất được văn bản nhưng có dấu hiệu chất lượng chưa ổn. Hãy xem kỹ trước khi dùng cho bước tiếp theo.",
  },
  poor: {
    label: "Thấp",
    badgeClassName: "border-transparent bg-orange-500 text-white",
    summaryStatus: "Đã trích xuất kèm cảnh báo",
    warningTitle: "Chất lượng trích xuất thấp",
    warningBody:
      "Nội dung lấy ra có thể không chính xác. Bạn có thể tiếp tục kiểm tra hoặc tải file khác để thử lại.",
  },
};

function formatDocumentType(kind: DocumentExtractionResult["kind"]) {
  return kind.toUpperCase();
}

function formatProcessingTime(processingTimeMs: number) {
  if (processingTimeMs < 1000) {
    return `${processingTimeMs} ms`;
  }

  const seconds = processingTimeMs / 1000;

  if (seconds < 10) {
    return `${seconds.toFixed(1)} giây`;
  }

  return `${Math.round(seconds)} giây`;
}

function WarningIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mt-0.5 size-5 shrink-0"
    >
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
    </svg>
  );
}

export function ExtractionResult({ data, onReset, reviewHref }: ExtractionResultProps) {
  const previewRef = useRef<HTMLDivElement>(null);
  const quality = qualityContent[data.quality.level];
  const previewText = data.normalizedText || "Văn bản trích xuất sẽ hiển thị ở đây sau khi xử lý.";
  const shouldShowWarning = data.quality.level !== "good";

  function handleContinueReview() {
    previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="space-y-4">
      <Card className="border-border bg-white shadow-sm">
        <CardHeader className="space-y-2">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <CardTitle>Kết quả trích xuất</CardTitle>
              <p className="text-base text-muted-foreground">
                {quality.summaryStatus === "Đã trích xuất"
                  ? "Đã trích xuất văn bản thành công."
                  : "Đã trích xuất văn bản nhưng cần kiểm tra kỹ trước khi dùng tiếp."}
              </p>
            </div>
            <Badge className={cn("w-fit text-sm", quality.badgeClassName)}>{quality.summaryStatus}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-muted-foreground">Tên file</p>
              <p className="break-all text-base text-foreground">{data.originalFileName}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-muted-foreground">Loại file</p>
              <p className="text-base text-foreground">{formatDocumentType(data.kind)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-muted-foreground">Thời gian xử lý</p>
              <p className="text-base text-foreground">{formatProcessingTime(data.processingTimeMs)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-muted-foreground">Chất lượng</p>
              <Badge className={cn("w-fit text-sm", quality.badgeClassName)}>{quality.label}</Badge>
            </div>
          </div>

          {shouldShowWarning ? (
            <Alert className="border-[#FCD34D] bg-[#FEF3C7] text-[#92400E]">
              <div className="flex gap-3">
                <WarningIcon />
                <div className="space-y-3">
                  <div className="space-y-1">
                    <AlertTitle className="text-[#92400E]">{quality.warningTitle}</AlertTitle>
                    <AlertDescription className="text-[#92400E]">
                      <p>{quality.warningBody}</p>
                    </AlertDescription>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button
                      type="button"
                      onClick={handleContinueReview}
                      className="bg-[#92400E] text-white hover:bg-[#78350F]"
                    >
                      Tiếp tục kiểm tra
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onReset}
                      className="border-[#92400E] bg-transparent text-[#92400E] hover:bg-[#FDE68A] hover:text-[#78350F]"
                    >
                      Tải file khác
                    </Button>
                  </div>
                </div>
              </div>
            </Alert>
          ) : null}

          <div className="rounded-xl border border-border bg-slate-50/70 p-4 text-sm text-muted-foreground">
            Bạn có thể kiểm tra nhanh nội dung bên dưới trước khi chuyển sang bước trích xuất AI ở Phase 3.
          </div>

          {reviewHref ? (
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild className="focus-visible:ring-2 focus-visible:ring-primary">
                <Link href={reviewHref}>Mở bước kiểm tra</Link>
              </Button>
              {!shouldShowWarning ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onReset}
                  className="focus-visible:ring-2 focus-visible:ring-primary"
                >
                  Tải file khác
                </Button>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card ref={previewRef} className="border-border bg-white shadow-sm">
        <CardHeader className="space-y-1">
          <CardTitle>Nội dung văn bản</CardTitle>
          <p className="text-base text-muted-foreground">
            Nội dung được hiển thị dạng văn bản thuần để bạn dễ đọc, chọn và sao chép.
          </p>
        </CardHeader>
        <CardContent>
          <div className="max-h-[500px] min-h-[240px] overflow-y-auto rounded-xl border border-border bg-white p-4 md:min-h-[320px]">
            <p className="whitespace-pre-wrap break-words text-sm leading-6 text-foreground">{previewText}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
