"use client";

import type { SectionColors, TextSegment } from "@/lib/review/highlight-terms";
import { splitTextByTerms } from "@/lib/review/highlight-terms";

interface HighlightedTextProps {
  text: string;
  importantTerms: string[];
  colors: SectionColors;
  /** If true, treat the whole text as a time label (uses timeColor + bold) */
  isTimeLabel?: boolean;
}

/**
 * Renders text with highlighted (bold) important terms.
 * Time labels get a different color than content text.
 */
export function HighlightedText({
  text,
  importantTerms,
  colors,
  isTimeLabel = false,
}: HighlightedTextProps) {
  if (isTimeLabel) {
    return (
      <span style={{ color: colors.timeColor, fontWeight: 700 }}>{text}</span>
    );
  }

  const segments: TextSegment[] = splitTextByTerms(text, importantTerms);

  return (
    <span style={{ color: colors.textColor }}>
      {segments.map((segment, i) =>
        segment.isHighlighted ? (
          <span
            key={i}
            style={{ color: colors.boldColor, fontWeight: 700 }}
          >
            {segment.text}
          </span>
        ) : (
          <span key={i}>{segment.text}</span>
        ),
      )}
    </span>
  );
}
