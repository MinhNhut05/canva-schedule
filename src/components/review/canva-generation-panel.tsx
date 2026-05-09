"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface CanvaGenerationPanelProps {
  isGenerating: boolean;
  isRateLimited?: boolean;
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
      className="size-5 animate-spin text-primary"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

export function CanvaGenerationPanel({ isGenerating }: CanvaGenerationPanelProps) {
  if (!isGenerating) {
    return null;
  }

  return (
    <Card className="surface-panel-glass border-semantic-light overflow-hidden shadow-semantic-light">
      <CardContent className="flex items-start gap-4 p-5">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <SpinnerIcon />
        </div>
        <div className="space-y-2">
          <Badge variant="outline" className="w-fit border-primary/15 bg-primary/5 text-primary">
            Giai đoạn 4 · Đang tạo Canva
          </Badge>
          <div className="space-y-1">
            <p className="text-base font-semibold text-foreground">Đang tạo Canva...</p>
            <p className="text-sm leading-6 text-muted-foreground">
              Hệ thống đang tạo liên kết thiết kế. Quá trình này thường mất 10–30 giây.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
