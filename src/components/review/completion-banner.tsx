"use client";

import Link from "next/link";
import { ArrowRight, Award } from "lucide-react";

import { COMPLETION_MESSAGES } from "@/lib/messages";

interface CompletionBannerProps {
  variant: "full" | "partial";
}

const CONFETTI_COLORS = ["#F3C94C", "#D95F3D", "#78A85A", "#5DA9D6", "#1C3F60"];
const CONFETTI = Array.from({ length: 12 }, (_, index) => ({
  left: (index * 8.3 + 4) % 100,
  delay: (index % 6) * 0.22,
  color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
}));

export function CompletionBanner({ variant }: CompletionBannerProps) {
  const isFull = variant === "full";
  const messages = isFull
    ? COMPLETION_MESSAGES.fullSuccess
    : COMPLETION_MESSAGES.partialSuccess;

  return (
    <div className={`rv-win ${isFull ? "full" : "partial"} rv-rv`}>
      {isFull ? (
        <div className="rv-confetti" aria-hidden="true">
          {CONFETTI.map((piece, index) => (
            <i
              key={index}
              style={{
                left: `${piece.left}%`,
                background: piece.color,
                animationDelay: `${piece.delay}s`,
              }}
            />
          ))}
        </div>
      ) : null}

      <span className="rv-seal" aria-hidden="true">
        <Award />
      </span>

      <div className="rv-win-tx">
        <span className={`rv-stage-pill ${isFull ? "green" : "amber"}`}>
          {isFull ? "Giai đoạn 5 · Hoàn thành" : "Giai đoạn 5 · Hoàn thành một phần"}
        </span>
        <h3>{messages.heading}</h3>
        <p>{messages.body}</p>

        {isFull ? (
          <div className="rv-win-cta">
            <Link className="rv-btn green" href="/upload">
              {COMPLETION_MESSAGES.ctaNewTour}
            </Link>
            <Link className="rv-btn ghost" href="/history">
              {COMPLETION_MESSAGES.ctaHistory} <ArrowRight />
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
