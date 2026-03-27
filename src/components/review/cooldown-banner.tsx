"use client";

import { Clock } from "lucide-react";

import { COOLDOWN_MESSAGES } from "@/lib/messages";

interface CooldownBannerProps {
  cooldownMinutes: number;
}

export function CooldownBanner({ cooldownMinutes }: CooldownBannerProps) {
  if (cooldownMinutes <= 0) return null;

  return (
    <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
      <Clock className="mt-0.5 size-5 shrink-0" />
      <div className="space-y-1">
        <p className="text-sm font-semibold">
          {COOLDOWN_MESSAGES.primary(cooldownMinutes)}
        </p>
        <p className="text-sm">{COOLDOWN_MESSAGES.secondary}</p>
      </div>
    </div>
  );
}
