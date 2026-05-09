"use client";

import { Button } from "@/components/ui/button";

function SpinnerIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4 animate-spin"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

interface ReviewActionsProps {
  isApproving: boolean;
  isApproved: boolean;
  hasDraft: boolean;
  isGenerating: boolean;
  hasResults: boolean;
  isRateLimited: boolean;
  disableGenerate?: boolean;
  onApprove: () => void;
  onGenerate: () => void;
}

export function ReviewActions({
  isApproving,
  isApproved,
  hasDraft,
  isGenerating,
  hasResults,
  isRateLimited,
  disableGenerate = false,
  onApprove,
  onGenerate,
}: ReviewActionsProps) {
  const generationLabel = isGenerating
    ? "Đang tạo Canva..."
    : hasResults
      ? "Tạo lại Canva"
      : "Tạo Canva";

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-semantic-light bg-surface-panel-glass/90 px-4 py-4 backdrop-blur md:left-60">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">
            {!isApproved ? "Giai đoạn 3 · Xác nhận nội dung" : "Giai đoạn 4 · Tạo thiết kế Canva"}
          </p>
          <p className="text-sm text-muted-foreground">
            {!isApproved
              ? "Chỉ xác nhận khi bạn đã rà soát xong nội dung ở cả lịch trình và thực đơn."
              : isRateLimited
                ? "Hệ thống đang trong thời gian chờ trước khi tạo tiếp."
                : "Khi mẫu đã đúng, bạn có thể bắt đầu tạo hoặc tạo lại liên kết Canva."}
          </p>
        </div>

        {!isApproved ? (
          <Button
            onClick={onApprove}
            disabled={isApproving || !hasDraft}
            className="glow-accent gap-2 px-6 py-2.5 text-base font-semibold"
          >
            {isApproving ? (
              <>
                <SpinnerIcon />
                Đang xác nhận...
              </>
            ) : (
              "Xác nhận nội dung"
            )}
          </Button>
        ) : (
          <Button
            onClick={onGenerate}
            disabled={disableGenerate || isGenerating || isRateLimited}
            className="glow-accent gap-2 px-6 py-2.5 text-base font-semibold"
          >
            {isGenerating ? (
              <>
                <SpinnerIcon />
                Đang tạo Canva...
              </>
            ) : (
              generationLabel
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
