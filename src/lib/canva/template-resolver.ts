import "server-only";
import { getCanvaConfig } from "./server-client";

export type TourDuration = "ONE_DAY" | "TWO_DAY";
export type ArtifactKind = "ITINERARY" | "MENU";
export type TemplateKey = `${TourDuration}_${ArtifactKind}`;

export interface TemplatePair {
  duration: TourDuration;
  itineraryTemplateId: string;
  menuTemplateId: string;
  displayLabel: string; // e.g. "Tour 1 ngày" or "Tour 2 ngày"
}

const DURATION_LABELS: Record<TourDuration, string> = {
  ONE_DAY: "Tour 1 ngày",
  TWO_DAY: "Tour 2 ngày",
};

export function resolveTemplateId(
  duration: TourDuration,
  kind: ArtifactKind
): string {
  const config = getCanvaConfig();
  const key: TemplateKey = `${duration}_${kind}`;
  const templateId = config.templates[key];
  if (!templateId) throw new Error(`Missing template config for ${key}`);
  return templateId;
}

export function resolveTemplatePair(duration: TourDuration): TemplatePair {
  return {
    duration,
    itineraryTemplateId: resolveTemplateId(duration, "ITINERARY"),
    menuTemplateId: resolveTemplateId(duration, "MENU"),
    displayLabel: DURATION_LABELS[duration],
  };
}

export function getTemplatePairLabel(duration: TourDuration): string {
  return DURATION_LABELS[duration];
}
