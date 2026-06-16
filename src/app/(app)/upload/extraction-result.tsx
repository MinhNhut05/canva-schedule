"use client";

import Link from "next/link";
import { ArrowRight, Check, FileText, Gauge, RefreshCw } from "lucide-react";
import type {
  ExtractionResult as DocumentExtractionResult,
  QualityLevel,
} from "@/lib/documents/types";

interface ExtractionResultProps {
  data: DocumentExtractionResult;
  onReset: () => void;
  reviewHref?: string;
}

const qualityContent: Record<
  QualityLevel,
  {
    tone: "good" | "warn";
    statusLabel: string;
    title: string;
    description: string;
    bars: number;
  }
> = {
  good: {
    tone: "good",
    statusLabel: "Đã trích xuất",
    title: "Chất lượng trích xuất tốt",
    description:
      "Văn bản rõ ràng, đủ cấu trúc để chuyển sang bước duyệt nội dung.",
    bars: 4,
  },
  warning: {
    tone: "warn",
    statusLabel: "Đã trích xuất kèm cảnh báo",
    title: "Chất lượng trích xuất cần kiểm tra",
    description:
      "Văn bản đã lấy ra nhưng có dấu hiệu chưa ổn. Hãy đọc kỹ trước khi sang bước duyệt nội dung.",
    bars: 3,
  },
  poor: {
    tone: "warn",
    statusLabel: "Đã trích xuất kèm cảnh báo",
    title: "Chất lượng trích xuất thấp",
    description:
      "Nội dung lấy ra có thể chưa chính xác. Cân nhắc đọc kỹ hoặc tải lại file gọn hơn trước khi duyệt.",
    bars: 2,
  },
};

const numberFormatter = new Intl.NumberFormat("vi-VN");

export function ExtractionResult({ data, onReset, reviewHref }: ExtractionResultProps) {
  const quality = qualityContent[data.quality.level];
  const rawText = data.normalizedText?.trim() ?? "";
  const hasText = rawText.length > 0;
  const previewText = hasText
    ? data.normalizedText
    : "Văn bản trích xuất sẽ hiển thị ở đây sau khi xử lý.";
  const wordCount = hasText ? rawText.split(/\s+/).filter(Boolean).length : 0;
  const paragraphCount = hasText
    ? data.normalizedText
        .split(/\n\s*\n/)
        .map((block) => block.trim())
        .filter(Boolean).length
    : 0;

  return (
    <div className="up-result up-rv">
      <div className="up-result-head">
        <div className="up-stage">
          <span className="up-stage-pill green">Giai đoạn 3</span>
          <span className="up-stage-cap">Kết quả trích xuất</span>
        </div>
        <span className={`up-badge ${quality.tone === "good" ? "green" : "amber"}`}>
          <Check />
          {quality.statusLabel}
        </span>
      </div>

      <h2 className="up-card-title">Văn bản đã được lấy ra</h2>

      <div className={`up-quality${quality.tone === "warn" ? " warn" : ""}`}>
        <span className="up-quality-ic">
          <Gauge />
        </span>
        <div className="up-quality-tx">
          <div className="qt">{quality.title}</div>
          <div className="qd">{quality.description}</div>
        </div>
        <div className="up-meter" aria-hidden="true">
          {[0, 1, 2, 3, 4].map((index) => (
            <span key={index} className={index < quality.bars ? "on" : undefined} />
          ))}
        </div>
      </div>

      <div className="up-preview">
        <div className="up-preview-h">
          <span className="t">
            <FileText /> Xem trước văn bản thô
          </span>
          <span className="c">
            {numberFormatter.format(wordCount)} từ · {numberFormatter.format(paragraphCount)} đoạn
          </span>
        </div>
        <div className="up-preview-body">{previewText}</div>
      </div>

      <div className="up-actions">
        {reviewHref ? (
          <Link className="up-pill" href={reviewHref}>
            Sang bước duyệt nội dung <ArrowRight />
          </Link>
        ) : null}
        <button type="button" className="up-ghost" onClick={onReset}>
          <RefreshCw /> Chọn file khác
        </button>
      </div>
    </div>
  );
}
