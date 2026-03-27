"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { COMPLETION_MESSAGES } from "@/lib/messages";

interface CompletionBannerProps {
  variant: "full" | "partial";
}

export function CompletionBanner({ variant }: CompletionBannerProps) {
  const messages =
    variant === "full"
      ? COMPLETION_MESSAGES.fullSuccess
      : COMPLETION_MESSAGES.partialSuccess;

  if (variant === "full") {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-green-800">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 size-6 shrink-0" />
          <div className="space-y-3">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">{messages.heading}</h3>
              <p className="text-sm">{messages.body}</p>
            </div>
            <div className="flex gap-3">
              <Button asChild>
                <Link href="/upload">{COMPLETION_MESSAGES.ctaNewTour}</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/history">{COMPLETION_MESSAGES.ctaHistory}</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Partial success variant
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-amber-600" />
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-foreground">
            {messages.heading}
          </h3>
          <p className="text-sm text-muted-foreground">{messages.body}</p>
        </div>
      </div>
    </div>
  );
}
