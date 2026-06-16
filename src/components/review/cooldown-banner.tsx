"use client";

import { Hourglass } from "lucide-react";

import { COOLDOWN_MESSAGES } from "@/lib/messages";

interface CooldownBannerProps {
  cooldownMinutes: number;
}

export function CooldownBanner({ cooldownMinutes }: CooldownBannerProps) {
  if (cooldownMinutes <= 0) return null;

  return (
    <div className="rv-cooldown rv-rv">
      <span className="rv-cooldown-ic" aria-hidden="true">
        <Hourglass />
      </span>
      <div className="rv-cooldown-tx">
        <span className="rv-stage-pill amber">Tạm chờ trước khi tạo lại</span>
        <div className="cb">{COOLDOWN_MESSAGES.primary(cooldownMinutes)}</div>
        <div className="cs">{COOLDOWN_MESSAGES.secondary}</div>
      </div>
    </div>
  );
}
