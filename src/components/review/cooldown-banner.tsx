"use client";

import { Clock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { COOLDOWN_MESSAGES } from "@/lib/messages";

interface CooldownBannerProps {
  cooldownMinutes: number;
}

export function CooldownBanner({ cooldownMinutes }: CooldownBannerProps) {
  if (cooldownMinutes <= 0) return null;

  return (
    <Card className="overflow-hidden border-amber-300 bg-amber-50/80 shadow-none">
      <CardContent className="flex items-start gap-4 p-5 text-amber-900">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-amber-400 text-amber-950">
          <Clock className="size-5" />
        </div>
        <div className="space-y-2">
          <Badge className="w-fit bg-amber-400 text-amber-950">Tạm chờ trước khi tạo lại</Badge>
          <div className="space-y-1">
            <p className="text-sm font-semibold leading-6">
              {COOLDOWN_MESSAGES.primary(cooldownMinutes)}
            </p>
            <p className="text-sm leading-6 text-amber-800">{COOLDOWN_MESSAGES.secondary}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
