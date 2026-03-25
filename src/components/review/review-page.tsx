"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { approveDraft, reExtractDraft, saveDraftField } from "@/app/(app)/review/[id]/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { StructuredDraft } from "@/lib/ai/extraction-schema";

import { ItineraryEditor } from "./itinerary-editor";
import { MenuEditor } from "./menu-editor";
import { ReviewActions } from "./review-actions";
import { ReviewHeader } from "./review-header";

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

export interface ReviewPageUpload {
  id: string;
  originalFileName: string;
  aiStatus: string | null;
  reviewStatus: string | null;
  aiErrorMessage: string | null;
  clientType: string | null;
  tourDuration: string | null;
}

interface ReviewPageProps {
  upload: ReviewPageUpload;
  draft: StructuredDraft | null;
}

export function ReviewPage({ upload, draft }: ReviewPageProps) {
  const router = useRouter();
  const [isApproving, setIsApproving] = useState(false);
  const [isReExtracting, setIsReExtracting] = useState(false);
  const [hasUserEdits, setHasUserEdits] = useState(false);

  const isApproved = upload.reviewStatus === "APPROVED";

  const handleSaveField = useCallback(
    async (
      uploadId: string,
      fieldPath: string,
      newValue: string,
    ): Promise<{ success: boolean; error?: string }> => {
      return saveDraftField(uploadId, fieldPath, newValue);
    },
    [],
  );

  const handleSaveSuccess = useCallback(() => {
    setHasUserEdits(true);
    toast.success("Da luu thay doi.");
    router.refresh();
  }, [router]);

  const handleSaveError = useCallback((error: string) => {
    toast.error(error);
  }, []);

  const handleApprove = useCallback(async () => {
    setIsApproving(true);
    try {
      const result = await approveDraft(upload.id);
      if (result.success) {
        toast.success("Da duyet thanh cong! San sang tao Canva.");
        router.refresh();
      } else {
        toast.error(result.error || "Khong the duyet.");
      }
    } catch {
      toast.error("Co loi xay ra khi duyet.");
    } finally {
      setIsApproving(false);
    }
  }, [router, upload.id]);

  const handleReExtract = useCallback(async () => {
    setIsReExtracting(true);
    try {
      const result = await reExtractDraft(upload.id);
      if (result.success) {
        setHasUserEdits(false);
        toast.success("Da trich xuat lai thanh cong.");
        router.refresh();
      } else {
        toast.error(result.error || "Khong the trich xuat lai.");
      }
    } catch {
      toast.error("Co loi xay ra khi trich xuat lai.");
    } finally {
      setIsReExtracting(false);
    }
  }, [router, upload.id]);

  if (!draft && upload.aiStatus !== "FAILED") {
    return (
      <section className="space-y-6">
        <ReviewHeader
          fileName={upload.originalFileName}
          tourDuration={upload.tourDuration}
          clientType={upload.clientType}
          reviewStatus={upload.reviewStatus}
          hasUserEdits={false}
          isReExtracting={isReExtracting}
          onReExtract={() => void handleReExtract()}
        />
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-[#F8FAFC] px-6 py-16 text-center">
          <h2 className="text-xl font-semibold text-foreground">
            Chua co noi dung de duyet
          </h2>
          <p className="mt-2 max-w-md text-base text-muted-foreground">
            Ban trich xuat co cau truc chua san sang. Hay thu Trich xuat lai hoac quay ve Tai tai lieu de kiem tra file nguon.
          </p>
          <div className="mt-6 flex gap-3">
            <Button
              onClick={() => void handleReExtract()}
              disabled={isReExtracting}
              className="bg-[#1E3B8A] text-white hover:bg-[#1E3B8A]/90"
            >
              {isReExtracting ? "Dang trich xuat..." : "Trich xuat lai"}
            </Button>
            <Button variant="outline" onClick={() => router.push("/upload")}>
              Quay ve Tai tai lieu
            </Button>
          </div>
        </div>
      </section>
    );
  }

  if (upload.aiStatus === "FAILED") {
    return (
      <section className="space-y-6">
        <ReviewHeader
          fileName={upload.originalFileName}
          tourDuration={upload.tourDuration}
          clientType={upload.clientType}
          reviewStatus={upload.reviewStatus}
          hasUserEdits={false}
          isReExtracting={isReExtracting}
          onReExtract={() => void handleReExtract()}
        />
        <Alert className="border-destructive/50 bg-destructive/5">
          <div className="flex gap-3">
            <WarningIcon />
            <div className="space-y-3">
              <div className="space-y-1">
                <AlertTitle className="text-destructive">
                  Khong the trich xuat noi dung
                </AlertTitle>
                <AlertDescription className="text-destructive/80">
                  {upload.aiErrorMessage ||
                    "Khong the trich xuat noi dung luc nay. Hay thu Trich xuat lai. Neu loi van tiep dien, hay quay ve Tai tai lieu va kiem tra chat luong tai lieu nguon."}
                </AlertDescription>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => void handleReExtract()}
                  disabled={isReExtracting}
                  className="bg-[#1E3B8A] text-white hover:bg-[#1E3B8A]/90"
                >
                  {isReExtracting ? "Dang trich xuat..." : "Trich xuat lai"}
                </Button>
                <Button variant="outline" onClick={() => router.push("/upload")}>
                  Quay ve Tai tai lieu
                </Button>
              </div>
            </div>
          </div>
        </Alert>
      </section>
    );
  }

  return (
    <section className="space-y-6 pb-24">
      <ReviewHeader
        fileName={upload.originalFileName}
        tourDuration={upload.tourDuration}
        clientType={upload.clientType}
        reviewStatus={upload.reviewStatus}
        hasUserEdits={hasUserEdits}
        isReExtracting={isReExtracting}
        onReExtract={() => void handleReExtract()}
      />

      {isApproved ? (
        <Alert className="border-emerald-300 bg-emerald-50">
          <AlertTitle className="text-emerald-800">Noi dung da duoc duyet</AlertTitle>
          <AlertDescription className="text-emerald-700">
            Ban co the chuyen sang buoc tao Canva (Phase 4).
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <ItineraryEditor
          draft={draft!}
          uploadId={upload.id}
          onSaveField={handleSaveField}
          onSaveSuccess={handleSaveSuccess}
          onSaveError={handleSaveError}
        />
        <MenuEditor
          draft={draft!}
          uploadId={upload.id}
          onSaveField={handleSaveField}
          onSaveSuccess={handleSaveSuccess}
          onSaveError={handleSaveError}
        />
      </div>

      <ReviewActions
        isApproving={isApproving}
        isApproved={isApproved}
        hasDraft={!!draft}
        onApprove={() => void handleApprove()}
      />
    </section>
  );
}
