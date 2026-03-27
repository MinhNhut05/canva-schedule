"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  approveDraft,
  generateCanva,
  reExtractDraft,
  retryCanvaArtifact,
  saveDraftField,
} from "@/app/(app)/review/[id]/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { StructuredDraft } from "@/lib/ai/extraction-schema";

import { CanvaGenerationPanel } from "./canva-generation-panel";
import { CanvaResultCard } from "./canva-result-card";
import { ItineraryEditor } from "./itinerary-editor";
import { MenuEditor } from "./menu-editor";
import { ReviewActions } from "./review-actions";
import { ReviewHeader } from "./review-header";
import { TemplateConfirmation } from "./template-confirmation";

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

type ReviewArtifactKind = "ITINERARY" | "MENU";
type ReviewArtifactStatus = "SUCCEEDED" | "FAILED" | "PROCESSING";
type ReviewDuration = "ONE_DAY" | "TWO_DAY";

interface InitialCanvaArtifact {
  id: string;
  uploadId: string;
  artifactType: string;
  status: string;
  templateId?: string | null;
  jobId?: string | null;
  designId?: string | null;
  errorMessage?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  editUrl?: string;
  viewUrl?: string;
  thumbnailUrl?: string;
}

interface ReviewArtifact {
  id?: string;
  uploadId?: string;
  artifactType: ReviewArtifactKind;
  status: ReviewArtifactStatus;
  templateId?: string | null;
  jobId?: string | null;
  designId?: string | null;
  errorMessage?: string | null;
  editUrl?: string;
  viewUrl?: string;
  thumbnailUrl?: string;
}

interface TemplatePairSummary {
  duration: string;
  itineraryTemplateId: string;
  menuTemplateId: string;
  displayLabel: string;
}

interface ReviewPageProps {
  upload: ReviewPageUpload;
  draft: StructuredDraft | null;
  canvaArtifacts?: InitialCanvaArtifact[];
  templatePair?: TemplatePairSummary | null;
  initialCooldownUntil?: string | null;
}

function isArtifactKind(value: string): value is ReviewArtifactKind {
  return value === "ITINERARY" || value === "MENU";
}

function isArtifactStatus(value: string): value is ReviewArtifactStatus {
  return value === "SUCCEEDED" || value === "FAILED" || value === "PROCESSING";
}

function isReviewDuration(value: string | null): value is ReviewDuration {
  return value === "ONE_DAY" || value === "TWO_DAY";
}

function normalizeArtifact(
  artifact: InitialCanvaArtifact | ReviewArtifact,
): ReviewArtifact | null {
  if (!isArtifactKind(artifact.artifactType) || !isArtifactStatus(artifact.status)) {
    return null;
  }

  return {
    id: artifact.id,
    uploadId: artifact.uploadId,
    artifactType: artifact.artifactType,
    status: artifact.status,
    templateId: artifact.templateId,
    jobId: artifact.jobId,
    designId: artifact.designId,
    errorMessage: artifact.errorMessage,
    editUrl: artifact.editUrl,
    viewUrl: artifact.viewUrl,
    thumbnailUrl: artifact.thumbnailUrl,
  };
}

function normalizeArtifacts(artifacts?: InitialCanvaArtifact[]): ReviewArtifact[] {
  return (artifacts ?? [])
    .map((artifact) => normalizeArtifact(artifact))
    .filter((artifact): artifact is ReviewArtifact => artifact !== null)
    .sort((a, b) => a.artifactType.localeCompare(b.artifactType));
}

function mergeArtifactResult(
  previous: ReviewArtifact[],
  nextArtifact: ReviewArtifact,
): ReviewArtifact[] {
  const remaining = previous.filter(
    (artifact) => artifact.artifactType !== nextArtifact.artifactType,
  );

  return [...remaining, nextArtifact].sort((a, b) =>
    a.artifactType.localeCompare(b.artifactType),
  );
}

export function ReviewPage({
  upload,
  draft,
  canvaArtifacts,
  templatePair,
  initialCooldownUntil,
}: ReviewPageProps) {
  const router = useRouter();
  const [isApproved, setIsApproved] = useState(upload.reviewStatus === "APPROVED");
  const [isApproving, setIsApproving] = useState(false);
  const [isReExtracting, setIsReExtracting] = useState(false);
  const [hasUserEdits, setHasUserEdits] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState<Date | null>(() => {
    if (!initialCooldownUntil) return null;
    const date = new Date(initialCooldownUntil);
    return date.getTime() > Date.now() ? date : null;
  });
  const [isRateLimited, setIsRateLimited] = useState(() => {
    if (!initialCooldownUntil) return false;
    return new Date(initialCooldownUntil).getTime() > Date.now();
  });
  const [cooldownMinutes, setCooldownMinutes] = useState(() => {
    if (!initialCooldownUntil) return 0;
    const date = new Date(initialCooldownUntil);
    return date.getTime() > Date.now()
      ? Math.max(1, Math.ceil((date.getTime() - Date.now()) / 60000))
      : 0;
  });
  const [artifacts, setArtifacts] = useState<ReviewArtifact[]>(() =>
    normalizeArtifacts(canvaArtifacts),
  );
  const [pendingRetryKinds, setPendingRetryKinds] = useState<ReviewArtifactKind[]>([]);

  useEffect(() => {
    setArtifacts(normalizeArtifacts(canvaArtifacts));
  }, [canvaArtifacts]);

  useEffect(() => {
    setIsApproved(upload.reviewStatus === "APPROVED");
  }, [upload.reviewStatus]);

  useEffect(() => {
    if (!cooldownUntil) {
      setIsRateLimited(false);
      setCooldownMinutes(0);
      return;
    }

    function tick() {
      const remaining = cooldownUntil!.getTime() - Date.now();
      if (remaining <= 0) {
        setIsRateLimited(false);
        setCooldownUntil(null);
        setCooldownMinutes(0);
        return;
      }
      setCooldownMinutes(Math.max(1, Math.ceil(remaining / 60000)));
    }

    tick();
    const interval = setInterval(tick, 30_000);
    return () => clearInterval(interval);
  }, [cooldownUntil]);

  const hasCompletedAttempt = useMemo(
    () => artifacts.some((artifact) => artifact.status === "SUCCEEDED" || artifact.status === "FAILED"),
    [artifacts],
  );

  const hasPersistedResults = artifacts.length > 0;
  const generationDisabled = isGenerating || isRateLimited || !templatePair;

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
    toast.success("Đã lưu thay đổi.");
    router.refresh();
  }, [router]);

  const handleSaveError = useCallback((error: string) => {
    toast.error(error);
  }, []);

  const applyCooldown = useCallback((cooldownSeconds?: number) => {
    const seconds = cooldownSeconds ?? 60;
    const until = new Date(Date.now() + seconds * 1000);
    setCooldownUntil(until);
    setIsRateLimited(true);
    setCooldownMinutes(Math.max(1, Math.ceil(seconds / 60)));
  }, []);

  const handleApprove = useCallback(async () => {
    setIsApproving(true);
    try {
      const result = await approveDraft(upload.id);
      if (result.success) {
        setIsApproved(true);
        toast.success("Đã duyệt thành công. Sẵn sàng tạo Canva.");
        router.refresh();
      } else {
        toast.error(result.error || "Không thể duyệt.");
      }
    } catch {
      toast.error("Có lỗi xảy ra khi duyệt.");
    } finally {
      setIsApproving(false);
    }
  }, [router, upload.id]);

  const handleGenerate = useCallback(async () => {
    if (!templatePair || !isApproved) {
      return;
    }

    setIsGenerating(true);

    try {
      const result = await generateCanva(upload.id);

      if (result.results.length > 0) {
        setArtifacts(
          result.results
            .map((artifact) => normalizeArtifact(artifact))
            .filter((artifact): artifact is ReviewArtifact => artifact !== null)
            .sort((a, b) => a.artifactType.localeCompare(b.artifactType)),
        );
      }

      if (result.isRateLimited) {
        applyCooldown(result.cooldownSeconds);
      }

      if (result.success) {
        toast.success("Đã tạo liên kết Canva.");
      } else if (result.error) {
        toast.error(result.error);
      } else if (result.results.length > 0) {
        toast.error("Không thể tạo Canva lúc này. Hãy thử lại.");
      }

      router.refresh();
    } catch {
      toast.error("Không thể tạo Canva lúc này. Hãy thử lại.");
    } finally {
      setIsGenerating(false);
    }
  }, [applyCooldown, isApproved, router, templatePair, upload.id]);

  const handleRetryArtifact = useCallback(
    async (kind: ReviewArtifactKind) => {
      if (isRateLimited) {
        return;
      }

      setPendingRetryKinds((current) => [...current, kind]);

      try {
        const result = await retryCanvaArtifact(upload.id, kind);
        const normalized = normalizeArtifact(result);

        if (normalized) {
          setArtifacts((current) => mergeArtifactResult(current, normalized));
        }

        if (result.isRateLimited) {
          applyCooldown(result.cooldownSeconds);
        }

        if (result.status === "SUCCEEDED") {
          toast.success(`Đã tạo lại ${kind === "ITINERARY" ? "Lịch trình" : "Thực đơn"}.`);
        } else {
          toast.error(result.errorMessage || "Không thể tạo Canva lúc này. Hãy thử lại.");
        }

        router.refresh();
      } catch {
        toast.error("Không thể tạo Canva lúc này. Hãy thử lại.");
      } finally {
        setPendingRetryKinds((current) => current.filter((value) => value !== kind));
      }
    },
    [applyCooldown, isRateLimited, router, upload.id],
  );

  const handleReExtract = useCallback(async () => {
    setIsReExtracting(true);
    try {
      const result = await reExtractDraft(upload.id);
      if (result.success) {
        setHasUserEdits(false);
        toast.success("Đã trích xuất lại thành công.");
        router.refresh();
      } else {
        toast.error(result.error || "Không thể trích xuất lại.");
      }
    } catch {
      toast.error("Có lỗi xảy ra khi trích xuất lại.");
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
            Chưa có nội dung để duyệt
          </h2>
          <p className="mt-2 max-w-md text-base text-muted-foreground">
            Bản trích xuất có cấu trúc chưa sẵn sàng. Hãy thử Trích xuất lại hoặc quay về Tải tài liệu để kiểm tra file nguồn.
          </p>
          <div className="mt-6 flex gap-3">
            <Button
              onClick={() => void handleReExtract()}
              disabled={isReExtracting}
              className="bg-[#1E3B8A] text-white hover:bg-[#1E3B8A]/90"
            >
              {isReExtracting ? "Đang trích xuất..." : "Trích xuất lại"}
            </Button>
            <Button variant="outline" onClick={() => router.push("/upload")}>
              Quay về Tải tài liệu
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
                  Không thể trích xuất nội dung
                </AlertTitle>
                <AlertDescription className="text-destructive/80">
                  {upload.aiErrorMessage ||
                    "Không thể trích xuất nội dung lúc này. Hãy thử Trích xuất lại. Nếu lỗi vẫn tiếp diễn, hãy quay về Tải tài liệu và kiểm tra chất lượng tài liệu nguồn."}
                </AlertDescription>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => void handleReExtract()}
                  disabled={isReExtracting}
                  className="bg-[#1E3B8A] text-white hover:bg-[#1E3B8A]/90"
                >
                  {isReExtracting ? "Đang trích xuất..." : "Trích xuất lại"}
                </Button>
                <Button variant="outline" onClick={() => router.push("/upload")}>
                  Quay về Tải tài liệu
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
        reviewStatus={isApproved ? "APPROVED" : upload.reviewStatus}
        hasUserEdits={hasUserEdits}
        isReExtracting={isReExtracting}
        onReExtract={() => void handleReExtract()}
      />

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

      {isApproved ? (
        <div className="space-y-6">
          <Alert className="border-emerald-300 bg-emerald-50">
            <AlertTitle className="text-emerald-800">Nội dung đã được duyệt</AlertTitle>
            <AlertDescription className="text-emerald-700">
              Nội dung đã được duyệt. Hãy xác nhận mẫu Canva rồi bắt đầu tạo liên kết.
            </AlertDescription>
          </Alert>

          {templatePair && isReviewDuration(upload.tourDuration) ? (
            <TemplateConfirmation
              duration={upload.tourDuration}
              templatePair={templatePair as never}
              onConfirm={() => void handleGenerate()}
              disabled={generationDisabled}
            />
          ) : null}

          <CanvaGenerationPanel
            isGenerating={isGenerating}
            isRateLimited={isRateLimited}
            cooldownMinutes={cooldownMinutes}
          />

          {hasPersistedResults ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {artifacts.map((artifact) => {
                  const isRetrying = pendingRetryKinds.includes(artifact.artifactType);

                  return (
                    <CanvaResultCard
                      key={artifact.artifactType}
                      artifactType={artifact.artifactType}
                      status={artifact.status}
                      editUrl={artifact.editUrl}
                      viewUrl={artifact.viewUrl}
                      thumbnailUrl={artifact.thumbnailUrl}
                      errorMessage={artifact.errorMessage ?? undefined}
                      onRetry={() => void handleRetryArtifact(artifact.artifactType)}
                      onRegenerate={() => void handleGenerate()}
                      disableRetry={isRetrying || isRateLimited || isGenerating}
                      disableRegenerate={generationDisabled}
                      showRegenerate={false}
                    />
                  );
                })}
              </div>

              {hasCompletedAttempt ? (
                <div className="flex justify-end">
                  <Button
                    onClick={() => void handleGenerate()}
                    disabled={generationDisabled}
                    className="bg-[#3B82F6] text-white hover:bg-[#3B82F6]/90"
                  >
                    Tạo lại
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      <ReviewActions
        isApproving={isApproving}
        isApproved={isApproved}
        hasDraft={!!draft}
        isGenerating={isGenerating}
        hasResults={hasCompletedAttempt}
        isRateLimited={isRateLimited}
        onApprove={() => void handleApprove()}
        onGenerate={() => void handleGenerate()}
      />
    </section>
  );
}
