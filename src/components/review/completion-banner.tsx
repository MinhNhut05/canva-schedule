"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { COMPLETION_MESSAGES } from "@/lib/messages";
import { cn } from "@/lib/utils";

interface CompletionBannerProps {
  variant: "full" | "partial";
}

export function CompletionBanner({ variant }: CompletionBannerProps) {
  const messages =
    variant === "full"
      ? COMPLETION_MESSAGES.fullSuccess
      : COMPLETION_MESSAGES.partialSuccess;
  const isFull = variant === "full";

  return (
    <Card
      className={cn(
        "overflow-hidden border shadow-semantic-light",
        isFull
          ? "border-emerald-300 bg-emerald-50/80"
          : "border-amber-300 bg-amber-50/80",
      )}
    >
      <CardContent className="flex items-start gap-4 p-6">
        <div
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-2xl",
            isFull ? "bg-emerald-600 text-white" : "bg-amber-400 text-amber-950",
          )}
        >
          <CheckCircle2 className="size-5" />
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Badge
              className={cn(
                "w-fit",
                isFull ? "bg-emerald-600 text-white" : "bg-amber-400 text-amber-950",
              )}
            >
              {isFull ? "Giai đoạn 5 · Hoàn thành" : "Giai đoạn 5 · Hoàn thành một phần"}
            </Badge>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-foreground">{messages.heading}</h3>
              <p className="text-sm leading-6 text-muted-foreground">{messages.body}</p>
            </div>
          </div>

          {isFull ? (
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild className="glow-accent focus-ring-premium transition-premium hover-lift-subtle">
                <Link href="/upload">{COMPLETION_MESSAGES.ctaNewTour}</Link>
              </Button>
              <Button variant="outline" asChild className="focus-ring-premium">
                <Link href="/history">{COMPLETION_MESSAGES.ctaHistory}</Link>
              </Button>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
