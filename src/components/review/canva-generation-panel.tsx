"use client";

import { Loader2 } from "lucide-react";

interface CanvaGenerationPanelProps {
  isGenerating: boolean;
  isRateLimited?: boolean;
}

export function CanvaGenerationPanel({ isGenerating }: CanvaGenerationPanelProps) {
  if (!isGenerating) {
    return null;
  }

  return (
    <div className="rv-card rv-rv">
      <div className="rv-gen">
        <span className="rv-gen-ic">
          <Loader2 className="rv-spin" />
        </span>
        <div className="rv-gen-tx">
          <span className="rv-stage-pill">Giai đoạn 4 · Đang tạo Canva</span>
          <div className="gt">Đang tạo Canva...</div>
          <div className="gd">
            Hệ thống đang tạo liên kết thiết kế. Quá trình này thường mất 10–30 giây.
          </div>
          <div className="rv-bar" aria-hidden="true">
            <i />
          </div>
        </div>
      </div>
    </div>
  );
}
