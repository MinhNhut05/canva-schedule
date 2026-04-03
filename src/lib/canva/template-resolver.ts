import "server-only";

import { db } from "@/lib/db";

export type TourDuration = "ONE_DAY" | "TWO_DAY";
export type ArtifactKind = "ITINERARY" | "MENU";
export type TemplateKey = `${TourDuration}_${ArtifactKind}`;

export interface ResolvedTemplate {
  templateId: string;
  fieldMapping: Record<string, string>;
}

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

/**
 * Load the full CanvaTemplate record and return both templateId and fieldMapping.
 * fieldMapping is a JSON object mapping canonical keys (e.g. "morning_block")
 * to actual Canva text-element names configured by admin.
 */
export async function resolveTemplate(
  duration: TourDuration,
  kind: ArtifactKind,
): Promise<ResolvedTemplate> {
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

  // fieldMapping is stored as Prisma Json — parse to Record<string, string>
  const raw = template.fieldMapping;
  const mapping: Record<string, string> =
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as Record<string, string>)
      : {};

  return { templateId: template.templateId, fieldMapping: mapping };
}

export async function resolveTemplateId(
  duration: TourDuration,
  kind: ArtifactKind,
): Promise<string> {
  const { templateId } = await resolveTemplate(duration, kind);
  return templateId;
}

/**
 * Remap canonical payload keys through the stored fieldMapping.
 *
 * For each entry in `data`, if `fieldMapping[canonicalKey]` exists and differs
 * from the canonical key, the entry is written under the mapped name instead.
 * Keys not present in fieldMapping pass through unchanged (identity mapping).
 *
 * This is the last-mile translation so the payload sent to Canva matches
 * the actual text-element names in the user's Canva template.
 */
export function applyFieldMapping(
  data: Record<string, { type: "text"; text: string }>,
  fieldMapping: Record<string, string>,
): Record<string, { type: "text"; text: string }> {
  // Fast path: empty mapping means identity (default seed maps key→key)
  if (Object.keys(fieldMapping).length === 0) return data;

  const remapped: Record<string, { type: "text"; text: string }> = {};

  for (const [canonicalKey, value] of Object.entries(data)) {
    const targetKey = fieldMapping[canonicalKey] ?? canonicalKey;
    remapped[targetKey] = value;
  }

  return remapped;
}

export async function resolveTemplatePair(
  duration: TourDuration,
): Promise<TemplatePair> {
  const itinerary = await resolveTemplate(duration, "ITINERARY");
  const menu = await resolveTemplate(duration, "MENU");
  return {
    duration,
    itineraryTemplateId: itinerary.templateId,
    menuTemplateId: menu.templateId,
    displayLabel: DURATION_LABELS[duration],
  };
}

export function getTemplatePairLabel(duration: TourDuration): string {
  return DURATION_LABELS[duration];
}
