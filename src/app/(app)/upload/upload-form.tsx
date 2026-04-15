"use client";

import { useMemo, useRef, useState, type ChangeEvent, type DragEvent } from "react";
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

  const fileDetails = useMemo(() => {
    if (!selectedFile) {
      return null;
    }

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

    if (isProcessing) {
      return;
    }

    handleFile(event.dataTransfer.files?.[0] ?? null);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();

    if (!isProcessing) {
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
        // Removed toast.error — error now shown as persistent Alert below
        return;
      }

      setResult(payload.data);
      toast.success("Tải tài liệu thành công.");
    } catch {
      setError(GENERIC_ERROR);
      // Removed toast.error — error now shown as persistent Alert below
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="space-y-6">
      <WorkflowStepper activeStep={1} activeLoading={isProcessing} />
      <Card className="border-border bg-white shadow-sm">
        <CardHeader className="space-y-2">
          <CardTitle>Tải tài liệu</CardTitle>
          <p className="text-base text-muted-foreground">
            Mỗi lần chỉ xử lý 1 file để dễ kiểm tra kết quả trích xuất.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div
            role="button"
            tabIndex={isProcessing ? -1 : 0}
            onClick={() => !isProcessing && inputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onKeyDown={(event) => {
              if ((event.key === "Enter" || event.key === " ") && !isProcessing) {
                event.preventDefault();
                inputRef.current?.click();
              }
            }}
            className={cn(
              "flex min-h-[180px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-background px-6 py-8 text-center transition-colors md:min-h-[220px] md:px-10",
              isDragActive && !isProcessing && "border-primary bg-primary/5",
              isProcessing && "pointer-events-none opacity-50",
              error && "border-destructive/60 bg-destructive/5",
            )}
            aria-disabled={isProcessing}
          >
            <FileUploadIcon />
            <p className="text-xl font-semibold text-foreground">Kéo và thả file vào đây</p>
            <p className="mt-2 text-base text-muted-foreground">
              Hoặc chọn file từ máy tính của bạn
            </p>
            <p className="mt-3 text-sm font-medium text-muted-foreground">
              Hỗ trợ: PDF, DOCX · Tối đa 30MB · Mỗi lần chỉ 1 file
            </p>
            <Button className="mt-6 focus-visible:ring-2 focus-visible:ring-primary" disabled={isProcessing}>
              Chọn file
            </Button>
            <Input
              ref={inputRef}
              type="file"
              accept=".pdf,.docx"
              className="hidden"
              onChange={handleInputChange}
              disabled={isProcessing}
            />
          </div>

          {error ? (
            <Alert variant="destructive">
              <AlertTriangle className="size-4" />
              <AlertTitle>{ERROR_MESSAGES.uploadParsing.title}</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          {selectedFile ? (
            <Card className="border-border bg-slate-50/70 shadow-none">
              <CardHeader className="space-y-1">
                <CardTitle>Thông tin file đã chọn</CardTitle>
                <p className="text-base text-muted-foreground">
                  Kiểm tra nhanh trước khi bấm xử lý tài liệu.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-muted-foreground">Tên file</p>
                    <p className="break-all text-base text-foreground">{fileDetails?.fileName}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-muted-foreground">Kích thước</p>
                    <p className="text-base text-foreground">{fileDetails?.size}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-muted-foreground">Loại file</p>
                    <p className="text-base text-foreground">{fileDetails?.type}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-muted-foreground">Trạng thái</p>
                    <Badge
                      className={cn(
                        "w-fit text-sm",
                        isProcessing
                          ? "bg-primary text-primary-foreground"
                          : error
                            ? "bg-destructive text-destructive-foreground"
                            : result?.quality.level === "good"
                              ? "bg-emerald-600 text-white"
                              : result
                                ? "bg-amber-400 text-amber-950"
                                : "bg-emerald-600 text-white",
                      )}
                    >
                      {fileDetails?.status}
                    </Badge>
                  </div>
                </div>

                {isProcessing ? (
                  <div className="flex items-center gap-2 text-base text-muted-foreground">
                    <SpinnerIcon />
                    <span>Đang phân tích file và trích xuất văn bản...</span>
                  </div>
                ) : null}

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    onClick={() => void handleSubmit()}
                    disabled={isProcessing || !selectedFile}
                    className="focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    {isProcessing ? "Đang xử lý..." : "Xử lý"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={resetFile}
                    disabled={isProcessing}
                    className="focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    Chọn file khác
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {result ? (
            <ExtractionResult
              data={result}
              onReset={resetExtractionResult}
              reviewHref={`/review/${result.uploadId}`}
            />
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
