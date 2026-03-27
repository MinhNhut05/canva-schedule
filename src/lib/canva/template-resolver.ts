import "server-only";

import { db } from "@/lib/db";

export type TourDuration = "ONE_DAY" | "TWO_DAY";
export type ArtifactKind = "ITINERARY" | "MENU";
export type TemplateKey = `${TourDuration}_${ArtifactKind}`;

export interface TemplatePair {
  duration: TourDuration;
  itineraryTemplateId: string;
  menuTemplateId: string;
  displayLabel: string;
}

const DURATION_LABELS: Record<TourDuration, string> = {
  ONE_DAY: "Tour 1 ngày",
  TWO_DAY: "Tour 2 ngày",
};

export async function resolveTemplateId(
  duration: TourDuration,
  kind: ArtifactKind,
): Promise<string> {
  const template = await db.canvaTemplate.findUnique({
    where: {
      tourDuration_artifactType: {
        tourDuration: duration,
        artifactType: kind,
      },
    },
  });

  if (!template || !template.isActive) {
    throw new Error(
      `Missing active Canva template for ${duration}_${kind}. ` +
      `Run prisma db seed or configure via admin panel.`
    );
  }

  return template.templateId;
}

export async function resolveTemplatePair(
  duration: TourDuration,
): Promise<TemplatePair> {
  return {
    duration,
    itineraryTemplateId: await resolveTemplateId(duration, "ITINERARY"),
    menuTemplateId: await resolveTemplateId(duration, "MENU"),
    displayLabel: DURATION_LABELS[duration],
  };
}

export function getTemplatePairLabel(duration: TourDuration): string {
  return DURATION_LABELS[duration];
}
