"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
      ? "Tour 1 ngay"
      : tourDuration === "TWO_DAY"
        ? "Tour 2 ngay"
        : null;

  const clientLabel =
    clientType === "SCHOOL"
      ? "Truong hoc"
      : clientType === "GROUP"
        ? "Doan/Doanh nghiep"
        : null;

  const statusLabel =
    reviewStatus === "APPROVED"
      ? "Da duyet"
      : reviewStatus === "PENDING_REVIEW"
        ? "Cho duyet"
        : reviewStatus === "REVIEWED"
          ? "Da xem"
          : null;

  const statusColor =
    reviewStatus === "APPROVED"
      ? "bg-emerald-600 text-white"
      : "bg-slate-200 text-slate-700";

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
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-[28px] font-semibold leading-tight text-foreground">
            Duyet noi dung trich xuat
          </h1>
          <p className="text-base text-muted-foreground">{fileName}</p>
        </div>

        <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              onClick={handleReExtractClick}
              disabled={isReExtracting || reviewStatus === "APPROVED"}
              className="shrink-0 gap-2"
            >
              {isReExtracting ? <SpinnerIcon /> : <RefreshIcon />}
              {isReExtracting ? "Dang trich xuat..." : "Trich xuat lai"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Trich xuat lai?</AlertDialogTitle>
              <AlertDialogDescription>
                Trich xuat lai se thay the cac chinh sua chua duoc duyet. Ban co muon tiep tuc khong?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Huy</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmReExtract}
                className="bg-[#1E3B8A] text-white hover:bg-[#1E3B8A]/90"
              >
                Tiep tuc trich xuat
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="flex flex-wrap gap-2">
        {durationLabel ? <Badge variant="secondary">{durationLabel}</Badge> : null}
        {clientLabel ? <Badge variant="secondary">{clientLabel}</Badge> : null}
        {statusLabel ? <Badge className={statusColor}>{statusLabel}</Badge> : null}
      </div>
    </div>
  );
}
