"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

function RefreshIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4"
    >
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 16h5v5" />
    </svg>
  );
}

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

  const statusColor =
    reviewStatus === "APPROVED"
      ? "bg-emerald-600 text-white"
      : "bg-secondary text-secondary-foreground";

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
    <Card className="surface-panel-glass overflow-hidden border-semantic-light shadow-semantic-light">
      <CardHeader className="space-y-4 border-b border-semantic-light bg-surface-panel-cool/60">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <Badge variant="outline" className="w-fit border-primary/15 bg-primary/5 text-primary">
              Giai đoạn 1 · Kiểm tra đầu vào review
            </Badge>
            <div className="space-y-2">
              <CardTitle className="text-[1.9rem] leading-tight text-foreground">
                Duyệt nội dung trích xuất
              </CardTitle>
              <p className="text-base leading-7 text-muted-foreground">{fileName}</p>
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                Kiểm tra lại nội dung AI đã trích xuất, xác nhận các phần cần chỉnh sửa, rồi mới chuyển sang bước xác nhận và tạo Canva.
              </p>
            </div>
          </div>

          <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                onClick={handleReExtractClick}
                disabled={isReExtracting || reviewStatus === "APPROVED"}
                className="focus-ring-premium shrink-0 gap-2"
              >
                {isReExtracting ? <SpinnerIcon /> : <RefreshIcon />}
                {isReExtracting ? "Đang trích xuất..." : "Trích xuất lại"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Trích xuất lại?</AlertDialogTitle>
                <AlertDialogDescription>
                  Trích xuất lại sẽ thay thế các chỉnh sửa chưa được duyệt. Bạn có muốn tiếp tục không?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Huỷ</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleConfirmReExtract}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Tiếp tục trích xuất
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 p-6">
        <div className="flex flex-wrap gap-2">
          {durationLabel ? <Badge variant="secondary">{durationLabel}</Badge> : null}
          {clientLabel ? <Badge variant="secondary">{clientLabel}</Badge> : null}
          {statusLabel ? <Badge className={statusColor}>{statusLabel}</Badge> : null}
          {hasUserEdits ? (
            <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-900">
              Có chỉnh sửa chưa duyệt
            </Badge>
          ) : null}
        </div>

        <div className="rounded-[20px] border border-semantic-light bg-primary/5 p-4">
          <p className="text-sm leading-6 text-muted-foreground">
            Mục tiêu của bước này là làm sạch nội dung trước khi xác nhận. Khi đã duyệt, hệ thống sẽ mở rõ phần mẫu Canva và hành động tạo liên kết ở giai đoạn tiếp theo.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
