"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import { ExtractionResult } from "./extraction-result";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { WorkflowStepper } from "@/components/workflow-stepper";
import { ALLOWED_EXTENSIONS, MAX_FILE_SIZE_BYTES, type UploadApiResponse } from "@/lib/documents/types";
import { ERROR_MESSAGES } from "@/lib/messages";
import { cn } from "@/lib/utils";

function FileUploadIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mb-4 size-10 text-primary"
    >
      <path d="M12 16V4" />
      <path d="m7 9 5-5 5 5" />
      <path d="M5 20h14" />
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

const SUPPORTED_FORMAT_ERROR =
  "Định dạng file không được hỗ trợ. Vui lòng chọn file PDF hoặc DOCX.";
const FILE_TOO_LARGE_ERROR = "File vượt quá 30MB. Vui lòng chọn file nhỏ hơn.";
const MISSING_FILE_ERROR = "Vui lòng chọn một file trước khi xử lý.";
const GENERIC_ERROR = "Có lỗi xảy ra khi xử lý file. Vui lòng thử lại sau.";

function formatFileSize(sizeBytes: number) {
  if (sizeBytes >= 1024 * 1024) {
    return `${(sizeBytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  return `${(sizeBytes / 1024).toFixed(2)} KB`;
}

function getFileLabel(file: File) {
  const extension = file.name.split(".").pop()?.toUpperCase();
  return extension || file.type || "Không xác định";
}

function validateSelectedFile(file: File | null) {
  if (!file) {
    return MISSING_FILE_ERROR;
  }

  const extension = `.${file.name.split(".").pop()?.toLowerCase() ?? ""}`;

  if (!ALLOWED_EXTENSIONS.includes(extension as (typeof ALLOWED_EXTENSIONS)[number])) {
    return SUPPORTED_FORMAT_ERROR;
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return FILE_TOO_LARGE_ERROR;
  }

  return null;
}

export function UploadForm() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadApiResponse["data"]>();
  const [isDragActive, setIsDragActive] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const canInteract = isHydrated && !isProcessing;

  const fileDetails = useMemo(() => {
    if (!selectedFile) {
      return null;
    }

    const statusTone = isProcessing
      ? "processing"
      : result
        ? result.quality.level === "good"
          ? "success"
          : "warning"
        : error
          ? "error"
          : "ready";

    return {
      fileName: selectedFile.name,
      size: formatFileSize(selectedFile.size),
      type: getFileLabel(selectedFile),
      status: isProcessing
        ? "Đang xử lý"
        : result
          ? result.quality.level === "good"
            ? "Đã trích xuất"
            : "Đã trích xuất kèm cảnh báo"
          : error
            ? "Xử lý thất bại"
            : "Sẵn sàng xử lý",
      statusTone,
    };
  }, [error, isProcessing, result, selectedFile]);

  function resetFile() {
    setSelectedFile(null);
    setError(null);
    setResult(undefined);
    setIsDragActive(false);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function resetExtractionResult() {
    resetFile();
  }

  function handleFile(file: File | null) {
    const validationError = validateSelectedFile(file);

    if (validationError) {
      setSelectedFile(null);
      setResult(undefined);
      setError(validationError);
      return;
    }

    setSelectedFile(file);
    setError(null);
    setResult(undefined);
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    handleFile(event.target.files?.[0] ?? null);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragActive(false);

    if (!canInteract) {
      return;
    }

    handleFile(event.dataTransfer.files?.[0] ?? null);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();

    if (canInteract) {
      setIsDragActive(true);
    }
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragActive(false);
  }

  async function handleSubmit() {
    if (!selectedFile) {
      setError(MISSING_FILE_ERROR);
      return;
    }

    const validationError = validateSelectedFile(selectedFile);

    if (validationError) {
      setError(validationError);
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    setIsProcessing(true);
    setError(null);
    setResult(undefined);

    try {
      const response = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as UploadApiResponse;

      if (!response.ok || !payload.success || !payload.data) {
        const message = payload.error || GENERIC_ERROR;
        setError(message);
        return;
      }

      setResult(payload.data);
      toast.success("Tải tài liệu thành công.");
    } catch {
      setError(GENERIC_ERROR);
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="space-y-6">
      <WorkflowStepper activeStep={1} activeLoading={isProcessing} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <Card className="surface-panel-glass border-semantic-light overflow-hidden shadow-semantic-light">
          <CardHeader className="space-y-3 border-b border-semantic-light bg-surface-panel-cool/60">
            <Badge variant="outline" className="w-fit border-primary/15 bg-primary/5 text-primary">
              Giai đoạn 1 · Chọn và xác nhận file
            </Badge>
            <div className="space-y-2">
              <CardTitle className="text-[1.75rem] leading-tight text-foreground">Bắt đầu với tài liệu nguồn</CardTitle>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground">
                Chọn 1 file PDF hoặc DOCX, kiểm tra nhanh thông tin file, rồi bắt đầu trích xuất để mở bước xem trước.
              </p>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 p-6 lg:p-7">
            <div
              role="button"
              tabIndex={canInteract ? 0 : -1}
              onClick={() => canInteract && inputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onKeyDown={(event) => {
                if ((event.key === "Enter" || event.key === " ") && canInteract) {
                  event.preventDefault();
                  inputRef.current?.click();
                }
              }}
              className={cn(
                "focus-ring-premium transition-premium group relative flex min-h-[280px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[28px] border border-dashed px-6 py-10 text-center md:px-10",
                "bg-white text-slate-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_24px_60px_rgba(11,47,174,0.08)]",
                isDragActive && canInteract && "border-primary bg-sky-50",
                !canInteract && "pointer-events-none opacity-60",
                error ? "border-destructive/60 bg-destructive/5" : "border-primary/20 hover:border-primary/35",
              )}
              aria-disabled={!canInteract}
            >
              <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-primary/35 to-transparent" />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,184,255,0.18),transparent_45%)] opacity-80" />
              <div className="relative flex flex-col items-center">
                <div className="mb-5 flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-[24px] bg-primary/10 text-primary shadow-[inset_0_0_0_1px_rgba(20,100,244,0.12),0_18px_40px_rgba(20,100,244,0.12)]">
                  <FileUploadIcon />
                </div>
                <p className="text-2xl font-semibold text-slate-950">Kéo và thả file vào đây</p>
                <p className="mt-3 max-w-xl text-base leading-7 text-slate-700">
                  Hoặc chọn file từ máy tính của bạn để bắt đầu luồng xử lý.
                </p>
                <p className="mt-4 text-sm font-medium text-slate-600">
                  Hỗ trợ: PDF, DOCX · Tối đa 30MB · Mỗi lần chỉ 1 file
                </p>
                <Button
                  className="glow-accent focus-ring-premium transition-premium hover-lift-subtle mt-7"
                  disabled={!canInteract}
                >
                  Chọn file
                </Button>
                <Input
                  ref={inputRef}
                  type="file"
                  accept=".pdf,.docx"
                  className="hidden"
                  onChange={handleInputChange}
                  disabled={!canInteract}
                />
              </div>
            </div>

            {error ? (
              <Alert variant="destructive" className="rounded-[20px] border-destructive/35 bg-destructive/5">
                <AlertTriangle className="size-4" />
                <AlertTitle>{ERROR_MESSAGES.uploadParsing.title}</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            {selectedFile ? (
              <Card className="surface-panel-cool border-semantic-light rounded-[24px] shadow-none">
                <CardHeader className="space-y-2 pb-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                      <Badge variant="outline" className="w-fit border-primary/25 bg-primary/10 text-primary">
                        Giai đoạn 2 · Kiểm tra trước khi trích xuất
                      </Badge>
                      <CardTitle className="text-[1.35rem] leading-tight text-foreground">
                        File đã sẵn sàng để xử lý
                      </CardTitle>
                      <p className="text-base leading-7 text-muted-foreground">
                        Xác nhận nhanh thông tin bên dưới trước khi mở kết quả trích xuất.
                      </p>
                    </div>
                    <Badge
                      className={cn(
                        "w-fit text-sm",
                        fileDetails?.statusTone === "processing"
                          ? "bg-primary text-primary-foreground"
                          : fileDetails?.statusTone === "error"
                            ? "bg-destructive text-destructive-foreground"
                            : fileDetails?.statusTone === "warning"
                              ? "bg-amber-400 text-amber-950"
                              : "bg-emerald-600 text-white",
                      )}
                    >
                      {fileDetails?.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div className="surface-panel-glass rounded-[20px] border border-primary/20 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/75">Tên file</p>
                      <p className="mt-3 break-all text-base text-foreground">{fileDetails?.fileName}</p>
                    </div>
                    <div className="surface-panel-glass rounded-[20px] border border-primary/20 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/75">Kích thước</p>
                      <p className="mt-3 text-base text-foreground">{fileDetails?.size}</p>
                    </div>
                    <div className="surface-panel-glass rounded-[20px] border border-primary/20 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/75">Loại file</p>
                      <p className="mt-3 text-base text-foreground">{fileDetails?.type}</p>
                    </div>
                    <div className="surface-panel-glass rounded-[20px] border border-primary/20 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/75">Điểm đến tiếp theo</p>
                      <p className="mt-3 text-base text-foreground">
                        {result ? "Đã có kết quả xem trước" : "Mở bước trích xuất và xem nhanh nội dung"}
                      </p>
                    </div>
                  </div>

                  {isProcessing ? (
                    <div className="surface-panel-glass flex items-center gap-3 rounded-[20px] border-semantic-light px-4 py-3 text-base text-muted-foreground">
                      <SpinnerIcon />
                      <span>Đang phân tích file và chuẩn bị kết quả xem trước...</span>
                    </div>
                  ) : null}

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button
                      onClick={() => void handleSubmit()}
                      disabled={isProcessing || !selectedFile}
                      className="glow-accent focus-ring-premium transition-premium hover-lift-subtle"
                    >
                      {isProcessing ? "Đang xử lý..." : "Bắt đầu trích xuất"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={resetFile}
                      disabled={!canInteract}
                      className="focus-ring-premium"
                    >
                      Chọn file khác
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </CardContent>
        </Card>

        <Card className="surface-hero text-white shadow-semantic-dark overflow-hidden border border-semantic-dark">
          <CardHeader className="hero-grid hero-grain relative space-y-3 border-b border-white/10 bg-transparent">
            <div className="pointer-events-none absolute inset-0 opacity-90" />
            <Badge className="w-fit border border-white/15 bg-white/10 text-white">Lộ trình nhanh</Badge>
            <CardTitle className="relative text-[1.5rem] leading-tight text-white">
              Flow intake được tách thành các checkpoint ngắn để ít nhiễu hơn.
            </CardTitle>
            <p className="relative text-sm leading-6 text-white/75">
              Mỗi checkpoint chỉ yêu cầu một quyết định: chọn file, xác nhận file, xem kết quả trích xuất, rồi mới sang bước review.
            </p>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <div className="rounded-[22px] border border-white/12 bg-white/10 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/55">Giai đoạn 1</p>
              <p className="mt-3 text-sm leading-6 text-white/78">
                Chọn file sạch, đúng định dạng và đủ gọn để kết quả trích xuất ổn định hơn.
              </p>
            </div>
            <div className="rounded-[22px] border border-white/12 bg-white/10 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/55">Giai đoạn 2</p>
              <p className="mt-3 text-sm leading-6 text-white/78">
                Kiểm tra nhanh tên file, dung lượng và trạng thái trước khi bấm trích xuất.
              </p>
            </div>
            <div className="rounded-[22px] border border-white/12 bg-white/10 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/55">Giai đoạn 3</p>
              <p className="mt-3 text-sm leading-6 text-white/78">
                Đọc preview, xem cảnh báo nếu có, rồi mới tiếp tục sang bước duyệt nội dung.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {result ? (
        <ExtractionResult
          data={result}
          onReset={resetExtractionResult}
          reviewHref={`/review/${result.uploadId}`}
        />
      ) : null}
    </div>
  );
}
