"use client";

import { Check, Loader2, Sparkles } from "lucide-react";

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
    <div className="rv-sticky">
      <div className="rv-sticky-inner">
        <div className="rv-sticky-tx">
          <p className="l">
            {!isApproved ? "Giai đoạn 3 · Xác nhận nội dung" : "Giai đoạn 4 · Tạo thiết kế Canva"}
          </p>
          <p className="s">
            {!isApproved
              ? "Chỉ xác nhận khi bạn đã rà soát xong nội dung ở cả lịch trình và thực đơn."
              : isRateLimited
                ? "Hệ thống đang trong thời gian chờ trước khi tạo tiếp."
                : "Khi mẫu đã đúng, bạn có thể bắt đầu tạo hoặc tạo lại liên kết Canva."}
          </p>
        </div>

        {!isApproved ? (
          <button
            type="button"
            className="rv-btn green"
            onClick={onApprove}
            disabled={isApproving || !hasDraft}
          >
            {isApproving ? (
              <>
                <Loader2 className="rv-spin" /> Đang xác nhận...
              </>
            ) : (
              <>
                <Check /> Xác nhận nội dung
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            className="rv-btn"
            onClick={onGenerate}
            disabled={disableGenerate || isGenerating || isRateLimited}
          >
            {isGenerating ? (
              <>
                <Loader2 className="rv-spin" /> Đang tạo Canva...
              </>
            ) : (
              <>
                <Sparkles /> {generationLabel}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
