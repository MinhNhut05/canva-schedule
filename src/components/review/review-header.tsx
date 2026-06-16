"use client";

import { useState } from "react";
import { Loader2, RefreshCw, Route } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ReviewHeaderProps {
  fileName: string;
  tourDuration: string | null;
  clientType: string | null;
  reviewStatus: string | null;
  hasUserEdits: boolean;
  isReExtracting: boolean;
  onReExtract: () => void;
}

export function ReviewHeader({
  fileName,
  tourDuration,
  clientType,
  reviewStatus,
  hasUserEdits,
  isReExtracting,
  onReExtract,
}: ReviewHeaderProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const durationLabel =
    tourDuration === "ONE_DAY"
      ? "Tour 1 ngày"
      : tourDuration === "TWO_DAY"
        ? "Tour 2 ngày"
        : tourDuration === "THREE_DAY"
          ? "Tour 3 ngày"
          : tourDuration === "FOUR_DAY"
            ? "Tour 4 ngày"
            : null;

  const clientLabel =
    clientType === "SCHOOL"
      ? "Trường học"
      : clientType === "GROUP"
        ? "Đoàn/Doanh nghiệp"
        : null;

  const statusLabel =
    reviewStatus === "APPROVED"
      ? "Đã duyệt"
      : reviewStatus === "PENDING_REVIEW"
        ? "Chờ duyệt"
        : reviewStatus === "REVIEWED"
          ? "Đã xem"
          : null;

  function handleReExtractClick() {
    if (hasUserEdits) {
      setDialogOpen(true);
    } else {
      onReExtract();
    }
  }

  function handleConfirmReExtract() {
    setDialogOpen(false);
    onReExtract();
  }

  return (
    <div className="rv-card rv-hero rv-rv">
      <div className="rv-hero-top">
        <div>
          <span className="rv-kicker">
            <Route /> Review &amp; approve
          </span>
          <h1>Duyệt nội dung tour</h1>
          <p className="rv-file">{fileName}</p>
          <p className="rv-lede">
            Kiểm tra lại nội dung AI đã trích xuất, xác nhận các phần cần chỉnh sửa, rồi
            mới chuyển sang bước xác nhận và tạo Canva.
          </p>
        </div>

        <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <AlertDialogTrigger asChild>
            <button
              type="button"
              className="rv-btn ghost"
              onClick={handleReExtractClick}
              disabled={isReExtracting || reviewStatus === "APPROVED"}
            >
              {isReExtracting ? <Loader2 className="rv-spin" /> : <RefreshCw />}
              {isReExtracting ? "Đang trích xuất..." : "Trích xuất lại"}
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Trích xuất lại?</AlertDialogTitle>
              <AlertDialogDescription>
                Trích xuất lại sẽ thay thế các chỉnh sửa chưa được duyệt. Bạn có muốn
                tiếp tục không?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Huỷ</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmReExtract}>
                Tiếp tục trích xuất
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="rv-chips">
        <span className="rv-stage-pill">Giai đoạn 1 · Kiểm tra đầu vào review</span>
        {durationLabel ? <span className="rv-chip neutral">{durationLabel}</span> : null}
        {clientLabel ? <span className="rv-chip">{clientLabel}</span> : null}
        {statusLabel ? (
          <span className={`rv-chip${reviewStatus === "APPROVED" ? " ok" : ""}`}>{statusLabel}</span>
        ) : null}
        {hasUserEdits ? <span className="rv-chip amber">Có chỉnh sửa chưa duyệt</span> : null}
      </div>

      <div className="rv-note">
        Mục tiêu của bước này là làm sạch nội dung trước khi xác nhận. Khi đã duyệt, hệ
        thống sẽ mở rõ phần mẫu Canva và hành động tạo liên kết ở giai đoạn tiếp theo.
      </div>
    </div>
  );
}
