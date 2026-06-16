"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, ExternalLink, ImageIcon, Loader2, Sparkles } from "lucide-react";

type ImageSize = "auto" | "1024x1024" | "1024x1536" | "1536x1024";
type AspectRatio = "auto" | "square" | "portrait" | "story" | "landscape" | "widescreen";

interface GeneratedImage {
  url: string;
  key: string;
}

interface ImageGenApiResponse {
  success: boolean;
  data?: {
    images: GeneratedImage[];
  };
  error?: string;
}

const aspectRatioOptions: Array<{ value: AspectRatio; label: string; description: string; size: ImageSize }> = [
  { value: "auto", label: "Auto", description: "AI tự chọn khung hình", size: "auto" },
  { value: "square", label: "Square 1:1", description: "Vuông", size: "1024x1024" },
  { value: "portrait", label: "Portrait 3:4", description: "Dọc gần 3:4", size: "1024x1536" },
  { value: "story", label: "Story 9:16", description: "Dọc kiểu story", size: "1024x1536" },
  { value: "landscape", label: "Landscape 4:3", description: "Ngang gần 4:3", size: "1536x1024" },
  { value: "widescreen", label: "Widescreen 16:9", description: "Ngang rộng", size: "1536x1024" },
];

const GENERIC_ERROR = "Có lỗi xảy ra khi tạo ảnh. Vui lòng thử lại sau.";

export function ImageGenForm() {
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("auto");
  const [count, setCount] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<GeneratedImage[]>([]);

  const selectedRatio = useMemo(
    () => aspectRatioOptions.find((option) => option.value === aspectRatio) ?? aspectRatioOptions[0],
    [aspectRatio],
  );

  async function handleSubmit() {
    const cleanPrompt = prompt.trim();

    if (!cleanPrompt) {
      setError("Vui lòng nhập mô tả ảnh.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setImages([]);

    try {
      const response = await fetch("/api/image-gen", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: cleanPrompt,
          size: selectedRatio.size,
          n: count,
        }),
      });
      const payload = (await response.json()) as ImageGenApiResponse;

      if (!response.ok || !payload.success || !payload.data) {
        setError(payload.error || GENERIC_ERROR);
        return;
      }

      setImages(payload.data.images);
      toast.success("Tạo ảnh thành công.");
    } catch {
      setError(GENERIC_ERROR);
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="ig-grid">
      <section className="ig-card">
        <span className="ig-stage-pill">
          <Sparkles /> Prompt → ảnh
        </span>
        <div>
          <h2 className="ig-card-title">Mô tả ảnh cần tạo</h2>
          <p className="ig-card-desc">
            Viết mô tả càng rõ càng tốt: địa điểm, chủ thể, màu sắc, ánh sáng, phong cách và mục đích sử dụng.
          </p>
        </div>

        <div className="ig-field">
          <label htmlFor="image-prompt" className="ig-label">
            Prompt
          </label>
          <textarea
            id="image-prompt"
            className="ig-textarea"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Ví dụ: Poster du lịch Đà Nẵng buổi hoàng hôn, phong cách premium, màu xanh biển, ánh sáng điện ảnh..."
            rows={8}
            disabled={isGenerating}
          />
        </div>

        <div className="ig-row">
          <div className="ig-field">
            <label htmlFor="aspect-ratio" className="ig-label">
              Tỉ lệ khung hình
            </label>
            <select
              id="aspect-ratio"
              className="ig-select"
              value={aspectRatio}
              onChange={(event) => setAspectRatio(event.target.value as AspectRatio)}
              disabled={isGenerating}
            >
              {aspectRatioOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="ig-hint">{selectedRatio.description}</p>
          </div>

          <div className="ig-field">
            <label htmlFor="image-count" className="ig-label">
              Số ảnh
            </label>
            <select
              id="image-count"
              className="ig-select"
              value={count}
              onChange={(event) => setCount(Number(event.target.value))}
              disabled={isGenerating}
            >
              {[1, 2, 3, 4].map((value) => (
                <option key={value} value={value}>
                  {value} ảnh
                </option>
              ))}
            </select>
            <p className="ig-hint">Tối đa 4 ảnh mỗi lần để tránh chờ quá lâu.</p>
          </div>
        </div>

        {error ? (
          <div className="ig-alert" role="alert">
            <AlertTriangle />
            <div>
              <p className="at">Tạo ảnh thất bại</p>
              <p className="ad">{error}</p>
            </div>
          </div>
        ) : null}

        {isGenerating ? (
          <div className="ig-proc">
            <Loader2 className="ig-spin" />
            <span>Đang tạo ảnh và lưu vào storage...</span>
          </div>
        ) : null}

        <button
          type="button"
          className="ig-pill"
          onClick={() => void handleSubmit()}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <Loader2 className="ig-spin" /> Đang tạo ảnh...
            </>
          ) : (
            <>
              <Sparkles /> Tạo ảnh
            </>
          )}
        </button>
      </section>

      <aside className="ig-aside">
        <section className="ig-result">
          <div className="ig-result-head">
            <span className="ig-stage-pill">
              <ImageIcon /> Kết quả
            </span>
            <p className="ig-result-title">
              Ảnh sau khi tạo sẽ được lưu vào bucket và trả về URL công khai.
            </p>
            <p className="ig-result-desc">
              Tỉ lệ đang chọn: {selectedRatio.label}. Một số tỉ lệ được map về kích thước GPT image gần nhất để đảm bảo API chấp nhận.
            </p>
          </div>

          {images.length > 0 ? (
            <div className="ig-imgs">
              {images.map((image, index) => (
                <div key={image.key} className="ig-imgwrap">
                  <Image
                    src={image.url}
                    alt={`Ảnh AI đã tạo ${index + 1}`}
                    width={1024}
                    height={1024}
                    unoptimized
                  />
                  <a className="ig-imglink" href={image.url} target="_blank" rel="noreferrer">
                    <ExternalLink /> Mở URL ảnh
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <div className="ig-empty">
              <Image
                className="ig-fox"
                src="/front-flow/mascot-fox-explore.png"
                alt=""
                aria-hidden="true"
                width={2000}
                height={1414}
              />
              <p>Chưa có ảnh nào. Nhập prompt và bấm tạo ảnh để xem kết quả ở đây.</p>
            </div>
          )}
        </section>
      </aside>
    </div>
  );
}
