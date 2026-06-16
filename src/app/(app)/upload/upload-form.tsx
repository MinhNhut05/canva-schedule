"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  File as FileIcon,
  HardDrive,
  Loader2,
  MapPin,
  RefreshCw,
  Route,
  Sparkles,
  Tag,
  UploadCloud,
} from "lucide-react";
import { ExtractionResult } from "./extraction-result";
import { WorkflowStepper } from "@/components/workflow-stepper";
import {
  ALLOWED_EXTENSIONS,
  MAX_FILE_SIZE_BYTES,
  type UploadApiResponse,
} from "@/lib/documents/types";

interface UploadError {
  title: string;
  detail: string;
}

const UPLOAD_ERRORS = {
  format: {
    title: "Định dạng file không được hỗ trợ.",
    detail: "Vui lòng chọn file PDF hoặc DOCX.",
  },
  size: {
    title: "File vượt quá 30MB.",
    detail: "Vui lòng chọn file nhỏ hơn rồi thử lại.",
  },
  missing: {
    title: "Chưa có file nào được chọn.",
    detail: "Vui lòng chọn một file trước khi xử lý.",
  },
  generic: {
    title: "Có lỗi xảy ra khi xử lý file.",
    detail: "Vui lòng thử lại sau ít phút.",
  },
} as const satisfies Record<string, UploadError>;

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

function validateSelectedFile(file: File | null): UploadError | null {
  if (!file) {
    return UPLOAD_ERRORS.missing;
  }

  const extension = `.${file.name.split(".").pop()?.toLowerCase() ?? ""}`;

  if (!ALLOWED_EXTENSIONS.includes(extension as (typeof ALLOWED_EXTENSIONS)[number])) {
    return UPLOAD_ERRORS.format;
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return UPLOAD_ERRORS.size;
  }

  return null;
}

export function UploadForm() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<UploadError | null>(null);
  const [result, setResult] = useState<UploadApiResponse["data"]>();
  const [isDragActive, setIsDragActive] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!shake) {
      return;
    }
    const id = setTimeout(() => setShake(false), 420);
    return () => clearTimeout(id);
  }, [shake]);

  const canInteract = isHydrated && !isProcessing;

  function flagError(next: UploadError) {
    setError(next);
    setShake(true);
  }

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
    } as const;
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

  function handleFile(file: File | null) {
    const validationError = validateSelectedFile(file);

    if (validationError) {
      setSelectedFile(null);
      setResult(undefined);
      flagError(validationError);
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
      flagError(UPLOAD_ERRORS.missing);
      return;
    }

    const validationError = validateSelectedFile(selectedFile);

    if (validationError) {
      flagError(validationError);
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
        flagError({
          title: "Xử lý thất bại.",
          detail: payload.error || UPLOAD_ERRORS.generic.detail,
        });
        return;
      }

      setResult(payload.data);
      toast.success("Tải tài liệu thành công.");
    } catch {
      flagError(UPLOAD_ERRORS.generic);
    } finally {
      setIsProcessing(false);
    }
  }

  const tone = fileDetails?.statusTone;
  const badgeClass =
    tone === "processing"
      ? "primary"
      : tone === "success"
        ? "green"
        : tone === "warning"
          ? "amber"
          : tone === "error"
            ? "red"
            : "neutral";

  const errorAlert = error ? (
    <div className={`up-alert${shake ? " shake" : ""}`} role="alert">
      <AlertTriangle />
      <div>
        <div className="at">{error.title}</div>
        <div className="ad">{error.detail}</div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <div className="up-stepper-card up-rv up-rv-2">
        <WorkflowStepper
          variant="paper"
          activeStep={result ? 2 : 1}
          activeLoading={isProcessing}
        />
      </div>

      <div className="up-grid up-rv up-rv-3">
        {selectedFile ? (
          <div className="up-card">
            <div className="up-file-head">
              <div className="up-stage">
                <span className="up-stage-pill">Giai đoạn 2</span>
                <span className="up-stage-cap">Kiểm tra trước khi trích xuất</span>
              </div>
              <span className={`up-badge ${badgeClass}`}>
                {tone === "processing" && <Loader2 className="up-spin" />}
                {tone === "success" && <Check />}
                {(tone === "warning" || tone === "error") && <AlertTriangle />}
                {fileDetails?.status}
              </span>
            </div>

            <div>
              <h2 className="up-card-title">File đã sẵn sàng để xử lý</h2>
              <p className="up-card-desc">
                Xác nhận nhanh thông tin bên dưới trước khi mở kết quả trích xuất.
              </p>
            </div>

            {errorAlert}

            <div className="up-chip">
              <span className="up-chip-ic">
                <FileIcon />
              </span>
              <span className="ct">
                <span className="nm">{fileDetails?.fileName}</span>
                <span className="meta">
                  Tài liệu nguồn · sẵn sàng kiểm tra trước khi trích xuất
                </span>
              </span>
            </div>

            <div className="up-stats">
              <div className="up-stat">
                <span className="k">
                  <FileIcon /> Tên file
                </span>
                <p className="v">{fileDetails?.fileName}</p>
              </div>
              <div className="up-stat">
                <span className="k">
                  <HardDrive /> Kích thước
                </span>
                <p className="v">{fileDetails?.size}</p>
              </div>
              <div className="up-stat">
                <span className="k">
                  <Tag /> Loại file
                </span>
                <p className="v">{fileDetails?.type}</p>
              </div>
              <div className="up-stat">
                <span className="k">
                  <MapPin /> Điểm đến tiếp theo
                </span>
                <p className="v">{result ? "Bước duyệt nội dung" : "Bước trích xuất"}</p>
              </div>
            </div>

            {isProcessing ? (
              <div className="up-proc">
                <div className="up-proc-row">
                  <Loader2 className="up-spin" />
                  <span>Đang phân tích file và chuẩn bị kết quả xem trước...</span>
                </div>
                <div className="up-bar" aria-hidden="true">
                  <i />
                </div>
              </div>
            ) : null}

            <div className="up-actions">
              {result ? (
                <Link className="up-pill" href={`/review/${result.uploadId}`}>
                  Sang bước duyệt nội dung <ArrowRight />
                </Link>
              ) : (
                <button
                  type="button"
                  className="up-pill"
                  onClick={() => void handleSubmit()}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="up-spin" /> Đang xử lý...
                    </>
                  ) : (
                    "Bắt đầu trích xuất"
                  )}
                </button>
              )}
              <button
                type="button"
                className="up-ghost"
                onClick={resetFile}
                disabled={!canInteract}
              >
                <RefreshCw /> Chọn file khác
              </button>
            </div>
          </div>
        ) : (
          <div className="up-card">
            <div className="up-stage">
              <span className="up-stage-pill">Giai đoạn 1</span>
              <span className="up-stage-cap">Chọn và xác nhận file</span>
            </div>

            <div>
              <h2 className="up-card-title">Bắt đầu với tài liệu nguồn</h2>
              <p className="up-card-desc">
                Chọn 1 file PDF hoặc DOCX, kiểm tra nhanh thông tin file, rồi bắt đầu
                trích xuất để mở bước xem trước.
              </p>
            </div>

            {errorAlert}

            <div
              role="button"
              tabIndex={canInteract ? 0 : -1}
              aria-disabled={!canInteract}
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
              className={`up-drop${isDragActive && canInteract ? " drag" : ""}${
                !canInteract ? " disabled" : ""
              }`}
            >
              {isDragActive && canInteract ? (
                <span className="up-flag">Thả ra nhé!</span>
              ) : null}

              <span className="up-drop-icon">
                <UploadCloud />
              </span>
              <p className="up-drop-title">Kéo và thả file vào đây</p>
              <p className="up-drop-text">
                Hoặc chọn file từ máy tính của bạn để bắt đầu luồng xử lý.
              </p>
              <p className="up-drop-support">
                Hỗ trợ: PDF, DOCX · Tối đa 30MB · Mỗi lần chỉ 1 file
              </p>
              <button type="button" className="up-pill" disabled={!canInteract} tabIndex={-1}>
                Chọn file
              </button>

              <Image
                className="up-drop-mascot"
                src="/front-flow/mascot-capybara-import.png"
                alt=""
                width={2000}
                height={1414}
                aria-hidden="true"
              />

              <input
                ref={inputRef}
                type="file"
                accept=".pdf,.docx"
                className="sr-only"
                onChange={handleInputChange}
                disabled={!canInteract}
              />
            </div>
          </div>
        )}

        <aside className="up-aside">
          <div className="up-promo grain">
            <span className="up-promo-eyebrow">
              <Route /> Lộ trình nhanh
            </span>
            <h3>Flow intake được tách thành các checkpoint ngắn để ít nhiễu hơn.</h3>
            <p>
              Mỗi checkpoint chỉ yêu cầu một quyết định: chọn file, xác nhận file, xem
              kết quả trích xuất, rồi mới sang bước review.
            </p>
            <div className="up-note">
              <span className="up-num">1</span>
              <p>Giai đoạn 1 — Chọn một file sạch, đúng định dạng PDF hoặc DOCX.</p>
            </div>
            <div className="up-note">
              <span className="up-num">2</span>
              <p>Giai đoạn 2 — Kiểm tra nhanh tên, kích thước và trạng thái file.</p>
            </div>
            <div className="up-note">
              <span className="up-num">3</span>
              <p>Giai đoạn 3 — Đọc kết quả xem trước và các cảnh báo trước khi duyệt.</p>
            </div>
            <Image
              className="up-promo-mascot"
              src="/front-flow/mascot-capybara-import.png"
              alt=""
              width={2000}
              height={1414}
              aria-hidden="true"
            />
          </div>

          <div className="up-tip">
            <span className="up-tip-h">
              <Sparkles /> Mẹo nhỏ
            </span>
            <p>
              File càng gọn và đúng định dạng thì bước trích xuất càng nhanh và ít cảnh
              báo hơn.
            </p>
          </div>
        </aside>
      </div>

      {result ? (
        <ExtractionResult
          data={result}
          onReset={resetFile}
          reviewHref={`/review/${result.uploadId}`}
        />
      ) : null}
    </>
  );
}
