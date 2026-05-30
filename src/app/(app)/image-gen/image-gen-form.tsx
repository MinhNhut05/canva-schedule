"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

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
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
      <Card className="surface-panel-glass border-semantic-light overflow-hidden shadow-semantic-light">
        <CardHeader className="space-y-3 border-b border-semantic-light bg-surface-panel-cool/60">
          <Badge variant="outline" className="w-fit border-primary/15 bg-primary/5 text-primary">
            Prompt → ảnh
          </Badge>
          <div className="space-y-2">
            <CardTitle className="text-[1.75rem] leading-tight text-foreground">Mô tả ảnh cần tạo</CardTitle>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground">
              Viết mô tả càng rõ càng tốt: địa điểm, chủ thể, màu sắc, ánh sáng, phong cách và mục đích sử dụng.
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 p-6 lg:p-7">
          <div className="space-y-3">
            <label htmlFor="image-prompt" className="text-sm font-semibold text-foreground">
              Prompt
            </label>
            <Textarea
              id="image-prompt"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Ví dụ: Poster du lịch Đà Nẵng buổi hoàng hôn, phong cách premium, màu xanh biển, ánh sáng điện ảnh..."
              rows={8}
              disabled={isGenerating}
              className="min-h-44 resize-y rounded-[22px] bg-white text-base text-slate-950 placeholder:text-slate-500"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_160px]">
            <div className="space-y-3">
              <label htmlFor="aspect-ratio" className="text-sm font-semibold text-foreground">
                Tỉ lệ khung hình
              </label>
              <select
                id="aspect-ratio"
                value={aspectRatio}
                onChange={(event) => setAspectRatio(event.target.value as AspectRatio)}
                disabled={isGenerating}
                className="h-12 w-full rounded-[18px] border border-semantic-light bg-white px-4 text-base font-medium text-slate-950 shadow-semantic-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {aspectRatioOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-xs leading-5 text-muted-foreground">{selectedRatio.description}</p>
            </div>

            <div className="space-y-3">
              <label htmlFor="image-count" className="text-sm font-semibold text-foreground">
                Số ảnh
              </label>
              <select
                id="image-count"
                value={count}
                onChange={(event) => setCount(Number(event.target.value))}
                disabled={isGenerating}
                className="h-12 w-full rounded-[18px] border border-semantic-light bg-white px-4 text-base font-medium text-slate-950 shadow-semantic-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {[1, 2, 3, 4].map((value) => (
                  <option key={value} value={value}>
                    {value} ảnh
                  </option>
                ))}
              </select>
              <p className="text-xs leading-5 text-muted-foreground">Tối đa 4 ảnh mỗi lần để tránh chờ quá lâu.</p>
            </div>
          </div>

          {error ? (
            <Alert variant="destructive" className="rounded-[20px] border-destructive/35 bg-destructive/5">
              <AlertTriangle className="size-4" />
              <AlertTitle>Tạo ảnh thất bại</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          {isGenerating ? (
            <div className="surface-panel-glass flex items-center gap-3 rounded-[20px] border-semantic-light px-4 py-3 text-base text-muted-foreground">
              <SpinnerIcon />
              <span>Đang tạo ảnh và lưu vào storage...</span>
            </div>
          ) : null}

          <Button
            onClick={() => void handleSubmit()}
            disabled={isGenerating}
            className="glow-accent focus-ring-premium transition-premium hover-lift-subtle"
          >
            {isGenerating ? "Đang tạo ảnh..." : "Tạo ảnh"}
          </Button>
        </CardContent>
      </Card>

      <Card className="surface-hero text-white shadow-semantic-dark overflow-hidden border border-semantic-dark">
        <CardHeader className="hero-grid hero-grain relative space-y-3 border-b border-white/10 bg-transparent">
          <Badge className="w-fit border border-white/15 bg-white/10 text-white">Kết quả</Badge>
          <CardTitle className="relative text-[1.5rem] leading-tight text-white">
            Ảnh sau khi tạo sẽ được lưu vào bucket và trả về URL công khai.
          </CardTitle>
          <p className="relative text-sm leading-6 text-white/75">
            Tỉ lệ đang chọn: {selectedRatio.label}. Một số tỉ lệ được map về kích thước GPT image gần nhất để đảm bảo API chấp nhận.
          </p>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          {images.length > 0 ? (
            <div className="grid gap-4">
              {images.map((image, index) => (
                <div key={image.key} className="rounded-[22px] border border-white/12 bg-white/10 p-3">
                  <Image
                    src={image.url}
                    alt={`Ảnh AI đã tạo ${index + 1}`}
                    width={1024}
                    height={1024}
                    unoptimized
                    className="h-auto w-full rounded-[18px] bg-white/5"
                  />
                  <a
                    href={image.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 block break-all text-sm font-medium text-white/82 underline-offset-4 hover:text-white hover:underline"
                  >
                    Mở URL ảnh
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[22px] border border-white/12 bg-white/10 p-4">
              <p className="text-sm leading-6 text-white/78">
                Chưa có ảnh nào. Nhập prompt và bấm tạo ảnh để xem kết quả ở đây.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
