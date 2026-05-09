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
  const qualityTone = shouldShowWarning ? "Cần kiểm tra trước khi sang review" : "Sẵn sàng sang bước duyệt";

  function handleContinueReview() {
    previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="space-y-6">
      <Card className="surface-panel-glass border-semantic-light overflow-hidden shadow-semantic-light">
        <CardHeader className="surface-hero hero-grid hero-grain relative space-y-4 border-b border-white/10 text-white">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(169,208,255,0.16),transparent_32%)]" />
          <div className="relative flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="space-y-3">
              <Badge className="w-fit border border-white/15 bg-white/10 text-white/85">
                Giai đoạn 3 · Xem kết quả trích xuất
              </Badge>
              <div className="space-y-2">
                <CardTitle className="text-[1.75rem] leading-tight text-white">Kết quả trích xuất</CardTitle>
                <p className="max-w-2xl text-base leading-7 text-white/78">
                  {quality.summaryStatus === "Đã trích xuất"
                    ? "Nội dung đã được trích xuất thành công. Bạn có thể đọc nhanh trước khi sang bước duyệt."
                    : "Nội dung đã được trích xuất nhưng cần kiểm tra kỹ trước khi chuyển tiếp sang bước duyệt."}
                </p>
              </div>
            </div>
            <div className="space-y-2 text-left md:text-right">
              <Badge className={cn("w-fit text-sm", quality.badgeClassName)}>{quality.summaryStatus}</Badge>
              <p className="text-sm leading-6 text-white/72">{qualityTone}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 p-6 lg:p-7">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="surface-panel-glass rounded-[20px] border border-primary/20 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/75">Tên file</p>
              <p className="mt-3 break-all text-base text-foreground">{data.originalFileName}</p>
            </div>
            <div className="surface-panel-glass rounded-[20px] border border-primary/20 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/75">Loại file</p>
              <p className="mt-3 text-base text-foreground">{formatDocumentType(data.kind)}</p>
            </div>
            <div className="surface-panel-glass rounded-[20px] border border-primary/20 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/75">Thời gian xử lý</p>
              <p className="mt-3 text-base text-foreground">{formatProcessingTime(data.processingTimeMs)}</p>
            </div>
            <div className="surface-panel-glass rounded-[20px] border border-primary/20 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/75">Bước tiếp theo</p>
              <div className="mt-3 space-y-2">
                <Badge className={cn("w-fit text-sm", quality.badgeClassName)}>{quality.label}</Badge>
                <p className="text-sm leading-6 text-muted-foreground">Mở review để rà soát và xác nhận nội dung trước khi tạo Canva.</p>
              </div>
            </div>
          </div>

          {shouldShowWarning ? (
            <Alert className="rounded-[24px] border-amber-300/45 bg-amber-400/10 text-amber-100 shadow-none">
              <div className="flex gap-3">
                <WarningIcon />
                <div className="space-y-3">
                  <div className="space-y-1">
                    <AlertTitle className="text-amber-100">{quality.warningTitle}</AlertTitle>
                    <AlertDescription className="text-amber-100/80">
                      <p>{quality.warningBody}</p>
                    </AlertDescription>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button
                      type="button"
                      onClick={handleContinueReview}
                      className="bg-amber-300 text-amber-950 hover:bg-amber-200"
                    >
                      Đọc preview trước khi sang review
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onReset}
                      className="border-amber-900 bg-transparent text-amber-900 hover:bg-amber-100 hover:text-amber-950"
                    >
                      Tải file khác
                    </Button>
                  </div>
                </div>
              </div>
            </Alert>
          ) : null}

          <div className="surface-panel-cool rounded-[24px] border border-semantic-light p-5 text-sm leading-6 text-muted-foreground">
            Đây là checkpoint trước khi duyệt. Hãy đọc nhanh preview bên dưới để xác nhận chất lượng trích xuất, rồi mới mở bước review chi tiết.
          </div>

          {reviewHref ? (
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild className="glow-accent focus-ring-premium transition-premium hover-lift-subtle">
                <Link href={reviewHref}>{shouldShowWarning ? "Tiếp tục sang bước duyệt" : "Mở bước duyệt nội dung"}</Link>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onReset}
                className="focus-ring-premium"
              >
                Tải file khác
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card
        ref={previewRef}
        className="surface-panel border-semantic-light overflow-hidden shadow-semantic-light"
      >
        <CardHeader className="space-y-2 border-b border-semantic-light bg-surface-panel-cool/60">
          <CardTitle className="text-[1.5rem] leading-tight text-foreground">Nội dung văn bản</CardTitle>
          <p className="text-base leading-7 text-muted-foreground">
            Nội dung được hiển thị dạng văn bản thuần để bạn dễ đọc, chọn và sao chép.
          </p>
        </CardHeader>
        <CardContent className="p-6">
          <div className="surface-panel-glass max-h-[500px] min-h-[240px] overflow-y-auto rounded-[24px] border-semantic-light p-5 md:min-h-[320px]">
            <p className="whitespace-pre-wrap break-words text-sm leading-7 text-foreground">{previewText}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
