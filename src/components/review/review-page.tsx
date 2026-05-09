"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";

import {
  approveDraft,
  generateCanva,
  reExtractDraft,
  retryCanvaArtifact,
  saveCanvaGenerationOptions,
  saveDraftField,
} from "@/app/(app)/review/[id]/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type { StructuredDraft } from "@/lib/ai/extraction-schema";
import type { CanvaGenerationOptions } from "@/lib/review/draft";
import { ERROR_MESSAGES } from "@/lib/messages";
import { WorkflowStepper } from "@/components/workflow-stepper";

import { CanvaGenerationPanel } from "./canva-generation-panel";
import { CanvaResultCard } from "./canva-result-card";
import { CooldownBanner } from "./cooldown-banner";
import { CompletionBanner } from "./completion-banner";
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
type ReviewDuration = "ONE_DAY" | "TWO_DAY" | "THREE_DAY";

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
  initialCanvaOptions: CanvaGenerationOptions;
  initialMenuMergeWarning?: string | null;
}

function isArtifactKind(value: string): value is ReviewArtifactKind {
  return value === "ITINERARY" || value === "MENU";
}

function isArtifactStatus(value: string): value is ReviewArtifactStatus {
  return value === "SUCCEEDED" || value === "FAILED" || value === "PROCESSING";
}

function isReviewDuration(value: string | null): value is ReviewDuration {
  return value === "ONE_DAY" || value === "TWO_DAY" || value === "THREE_DAY";
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
  initialCanvaOptions,
  initialMenuMergeWarning,
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
  const [canvaError, setCanvaError] = useState<string | null>(null);
  const [canvaOptions, setCanvaOptions] = useState<CanvaGenerationOptions>(initialCanvaOptions);
  const [isSavingCanvaOptions, setIsSavingCanvaOptions] = useState(false);
  const [menuMergeWarning, setMenuMergeWarning] = useState<string | null>(
    initialMenuMergeWarning ?? null,
  );
  const generationRequestInFlightRef = useRef(false);

  useEffect(() => {
    setArtifacts(normalizeArtifacts(canvaArtifacts));
  }, [canvaArtifacts]);

  useEffect(() => {
    setIsApproved(upload.reviewStatus === "APPROVED");
  }, [upload.reviewStatus]);

  useEffect(() => {
    setCanvaOptions(initialCanvaOptions);
    setMenuMergeWarning(initialMenuMergeWarning ?? null);
  }, [initialCanvaOptions, initialMenuMergeWarning]);

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

  // Step computation from UI-SPEC step-to-status mapping
  const computedStep = useMemo(() => {
    const allSucceeded =
      artifacts.length >= 2 && artifacts.every((a) => a.status === "SUCCEEDED");
    const anyFailed = artifacts.some((a) => a.status === "FAILED");

    if (allSucceeded) return { activeStep: 5, errorStep: null };
    if (isApproved && anyFailed) return { activeStep: 4, errorStep: 4 };
    if (isApproved && isGenerating) return { activeStep: 4, errorStep: null };
    if (isApproved && artifacts.length > 0) return { activeStep: 4, errorStep: null };
    if (isApproved) return { activeStep: 4, errorStep: null };
    if (upload.aiStatus === "FAILED") return { activeStep: 2, errorStep: 2 };
    if (upload.aiStatus === "PROCESSING" || isReExtracting)
      return { activeStep: 2, errorStep: null };
    if (upload.aiStatus === "READY_FOR_REVIEW") return { activeStep: 3, errorStep: null };
    return { activeStep: 2, errorStep: null };
  }, [artifacts, isApproved, isGenerating, isReExtracting, upload.aiStatus]);

  // Completion detection
  const completionVariant = useMemo(() => {
    if (artifacts.length < 2) return null;
    const allSucceeded = artifacts.every((a) => a.status === "SUCCEEDED");
    const someSucceeded = artifacts.some((a) => a.status === "SUCCEEDED");
    const someFailed = artifacts.some((a) => a.status === "FAILED");
    if (allSucceeded) return "full" as const;
    if (someSucceeded && someFailed) return "partial" as const;
    return null;
  }, [artifacts]);

  const hasCompletedAttempt = useMemo(
    () => artifacts.some((artifact) => artifact.status === "SUCCEEDED" || artifact.status === "FAILED"),
    [artifacts],
  );

  const hasPersistedResults = artifacts.length > 0;
  const generationDisabled =
    isGenerating || isRateLimited || isSavingCanvaOptions || !templatePair;
  const showOneDayCanvaOptions = draft?.duration === "ONE_DAY" && upload.tourDuration === "ONE_DAY";

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

  const handleToggleMenuMerge = useCallback(
    async (checked: boolean) => {
      const previousValue = canvaOptions.mergeMenuIntoItinerary;
      setCanvaOptions((current) => ({
        ...current,
        mergeMenuIntoItinerary: checked,
      }));
      setIsSavingCanvaOptions(true);

      try {
        const result = await saveCanvaGenerationOptions(upload.id, checked);

        if (!result.success || !result.options) {
          setCanvaOptions((current) => ({
            ...current,
            mergeMenuIntoItinerary: previousValue,
          }));
          toast.error(result.error || "Không thể lưu tùy chọn Canva.");
          return;
        }

        setCanvaOptions(result.options);
        setMenuMergeWarning(result.warningMessage ?? null);
        toast.success("Đã lưu tùy chọn tạo Canva.");
        router.refresh();
      } catch {
        setCanvaOptions((current) => ({
          ...current,
          mergeMenuIntoItinerary: previousValue,
        }));
        toast.error("Không thể lưu tùy chọn Canva.");
      } finally {
        setIsSavingCanvaOptions(false);
      }
    },
    [canvaOptions.mergeMenuIntoItinerary, router, upload.id],
  );

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
    if (generationRequestInFlightRef.current || !templatePair || !isApproved) {
      return;
    }

    generationRequestInFlightRef.current = true;
    setIsGenerating(true);
    setCanvaError(null);

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
        setCanvaError(null);
        toast.success("Đã tạo liên kết Canva.");
      } else if (result.error) {
        setCanvaError(result.error);
      } else if (result.results.length > 0) {
        setCanvaError(ERROR_MESSAGES.canvaGeneration.description);
      }

      router.refresh();
    } catch {
      setCanvaError(ERROR_MESSAGES.canvaGeneration.description);
    } finally {
      generationRequestInFlightRef.current = false;
      setIsGenerating(false);
    }
  }, [applyCooldown, isApproved, router, templatePair, upload.id]);

  const handleRetryArtifact = useCallback(
    async (kind: ReviewArtifactKind) => {
      if (isRateLimited) {
        return;
      }

      setPendingRetryKinds((current) => [...current, kind]);
      setCanvaError(null);

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
          setCanvaError(null);
          toast.success(`Đã tạo lại ${kind === "ITINERARY" ? "Lịch trình" : "Thực đơn"}.`);
        } else {
          setCanvaError(result.errorMessage || ERROR_MESSAGES.canvaGeneration.description);
        }

        router.refresh();
      } catch {
        setCanvaError(ERROR_MESSAGES.canvaGeneration.description);
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
        <WorkflowStepper
          activeStep={computedStep.activeStep}
          errorStep={computedStep.errorStep}
          activeLoading={upload.aiStatus === "PROCESSING" || isReExtracting}
        />
        <ReviewHeader
          fileName={upload.originalFileName}
          tourDuration={upload.tourDuration}
          clientType={upload.clientType}
          reviewStatus={upload.reviewStatus}
          hasUserEdits={false}
          isReExtracting={isReExtracting}
          onReExtract={() => void handleReExtract()}
        />
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/40 px-6 py-16 text-center">
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
        <WorkflowStepper
          activeStep={computedStep.activeStep}
          errorStep={computedStep.errorStep}
          activeLoading={isReExtracting}
        />
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
      {/* Global cooldown banner — above everything */}
      {isRateLimited && cooldownMinutes > 0 ? (
        <CooldownBanner cooldownMinutes={cooldownMinutes} />
      ) : null}

      {/* Workflow stepper */}
      <WorkflowStepper
        activeStep={computedStep.activeStep}
        errorStep={computedStep.errorStep}
        activeLoading={upload.aiStatus === "PROCESSING" || isReExtracting || isGenerating}
      />

      <ReviewHeader
        fileName={upload.originalFileName}
        tourDuration={upload.tourDuration}
        clientType={upload.clientType}
        reviewStatus={isApproved ? "APPROVED" : upload.reviewStatus}
        hasUserEdits={hasUserEdits}
        isReExtracting={isReExtracting}
        onReExtract={() => void handleReExtract()}
      />

      <div className="space-y-4">
        <div className="surface-panel-glass rounded-[24px] border border-semantic-light p-5 shadow-semantic-light">
          <div className="space-y-3">
            <Badge variant="outline" className="w-fit border-primary/15 bg-primary/5 text-primary">
              Giai đoạn 2 · Rà soát và chỉnh sửa nội dung
            </Badge>
            <div className="space-y-2">
              <h2 className="text-[1.5rem] font-semibold leading-tight text-foreground">
                Kiểm tra lịch trình và thực đơn trước khi duyệt
              </h2>
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                Hãy chỉnh lại các phần AI trích xuất chưa chính xác, ưu tiên những trường được đánh dấu cần xem lại. Khi hoàn tất, bạn sẽ xác nhận nội dung để mở rõ giai đoạn Canva.
              </p>
            </div>
          </div>
        </div>

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
      </div>

      <div className="space-y-4">
        <div className="surface-panel-glass rounded-[24px] border border-semantic-light p-5 shadow-semantic-light">
          <div className="space-y-3">
            <Badge variant="outline" className="w-fit border-primary/15 bg-primary/5 text-primary">
              Giai đoạn 3 · Xác nhận để mở Canva
            </Badge>
            <div className="space-y-2">
              <h2 className="text-[1.5rem] font-semibold leading-tight text-foreground">
                Chốt nội dung trước khi tạo thiết kế
              </h2>
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                Sau khi xác nhận, hệ thống sẽ nhấn mạnh phần mẫu Canva, các tùy chọn tạo và kết quả thiết kế. Sticky action phía dưới luôn bám theo giai đoạn hiện tại để tránh rối CTA.
              </p>
            </div>
          </div>
        </div>
      </div>

      {showOneDayCanvaOptions ? (
        <div className="surface-panel-glass rounded-2xl border border-semantic-light p-5 shadow-semantic-light">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary/75">
                Tùy chọn Canva 1 ngày
              </p>
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-foreground">
                  Có nhập menu vào lịch trình không?
                </h3>
                <p className="max-w-2xl text-sm text-muted-foreground">
                  Khi bật, các dòng menu ngắn sẽ được ghép vào lịch trình 1 ngày trước khi tạo Canva. Tùy chọn này được lưu riêng cho từng tài liệu.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-full border border-semantic-light bg-surface-panel-glass px-4 py-2 shadow-semantic-light">
              <span className="text-sm font-medium text-foreground/80">
                {canvaOptions.mergeMenuIntoItinerary ? "Đang bật" : "Đang tắt"}
              </span>
              <Switch
                checked={canvaOptions.mergeMenuIntoItinerary}
                onCheckedChange={(checked) => void handleToggleMenuMerge(checked)}
                disabled={isSavingCanvaOptions}
                aria-label="Có nhập menu vào lịch trình không?"
              />
            </div>
          </div>

          <p className="mt-3 text-sm text-muted-foreground">
            {canvaOptions.mergeMenuIntoItinerary
              ? "Menu sẽ được chèn vào block lịch trình tương ứng khi tạo Canva."
              : "Menu sẽ giữ riêng ở thiết kế thực đơn, không ghép vào lịch trình."}
          </p>

          {isSavingCanvaOptions ? (
            <p className="mt-2 text-sm text-muted-foreground/80">Đang lưu lựa chọn...</p>
          ) : null}

          {menuMergeWarning ? (
            <Alert className="mt-4 border-amber-300 bg-amber-50">
              <AlertTriangle className="size-4 text-amber-600" />
              <AlertTitle className="text-amber-900">Cảnh báo độ dài trước khi tạo Canva</AlertTitle>
              <AlertDescription className="text-amber-800">
                {menuMergeWarning}
              </AlertDescription>
            </Alert>
          ) : null}
        </div>
      ) : null}

      {isApproved ? (
        <div className="space-y-6">
          <div className="surface-panel-glass rounded-[24px] border border-semantic-light p-5 shadow-semantic-light">
            <div className="space-y-3">
              <Badge variant="outline" className="w-fit border-primary/15 bg-primary/5 text-primary">
                Giai đoạn 4 · Xác nhận mẫu và tạo Canva
              </Badge>
              <div className="space-y-2">
                <h2 className="text-[1.5rem] font-semibold leading-tight text-foreground">
                  Mở phần tạo thiết kế sau khi duyệt xong nội dung
                </h2>
                <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                  Ở giai đoạn này, bạn kiểm tra cặp mẫu, lưu tùy chọn Canva nếu có, rồi bắt đầu tạo hoặc tạo lại liên kết thiết kế.
                </p>
              </div>
            </div>
          </div>
          {/* Completion banner — replaces approved alert when generation is done */}
          {completionVariant ? (
            <CompletionBanner variant={completionVariant} />
          ) : (
            <Alert className="border-emerald-300 bg-emerald-50">
              <AlertTitle className="text-emerald-800">Nội dung đã được duyệt</AlertTitle>
              <AlertDescription className="text-emerald-700">
                Nội dung đã được duyệt. Hãy xác nhận mẫu Canva rồi bắt đầu tạo liên kết.
              </AlertDescription>
            </Alert>
          )}

          {/* Template confirmation — only if not completed */}
          {!completionVariant && templatePair && isReviewDuration(upload.tourDuration) ? (
            <TemplateConfirmation
              duration={upload.tourDuration}
              templatePair={templatePair as never}
              onConfirm={() => void handleGenerate()}
              disabled={generationDisabled}
            />
          ) : null}

          <CanvaGenerationPanel isGenerating={isGenerating} isRateLimited={isRateLimited} />

          {/* Canva error alert — persistent, replaces toast.error */}
          {canvaError && !isGenerating ? (
            <Alert variant="destructive">
              <AlertTriangle className="size-4" />
              <AlertTitle>{ERROR_MESSAGES.canvaGeneration.title}</AlertTitle>
              <AlertDescription>{canvaError}</AlertDescription>
            </Alert>
          ) : null}

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
                    className="glow-accent"
                  >
                    Tạo lại Canva
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
        disableGenerate={generationDisabled}
        onApprove={() => void handleApprove()}
        onGenerate={() => void handleGenerate()}
      />
    </section>
  );
}
