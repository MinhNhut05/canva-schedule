import type { PrismaClient } from "@prisma/client";

import {
  SHARED_FIELDS,
  ONE_DAY_ITINERARY_FIELDS,
  ONE_DAY_MENU_FIELDS,
  TWO_DAY_ITINERARY_FIELDS,
  TWO_DAY_MENU_FIELDS,
} from "./field-map";

interface TemplateSeedInput {
  tourDuration: string;
  artifactType: string;
  envVar: string;
  fields: readonly string[];
}

const TEMPLATE_SEEDS: TemplateSeedInput[] = [
  {
    tourDuration: "ONE_DAY",
    artifactType: "ITINERARY",
    envVar: "CANVA_TEMPLATE_1DAY_ITINERARY",
    fields: ONE_DAY_ITINERARY_FIELDS,
  },
  {
    tourDuration: "ONE_DAY",
    artifactType: "MENU",
    envVar: "CANVA_TEMPLATE_1DAY_MENU",
    fields: ONE_DAY_MENU_FIELDS,
  },
  {
    tourDuration: "TWO_DAY",
    artifactType: "ITINERARY",
    envVar: "CANVA_TEMPLATE_2DAY_ITINERARY",
    fields: TWO_DAY_ITINERARY_FIELDS,
  },
  {
    tourDuration: "TWO_DAY",
    artifactType: "MENU",
    envVar: "CANVA_TEMPLATE_2DAY_MENU",
    fields: TWO_DAY_MENU_FIELDS,
  },
];

// SHARED_FIELDS is used indirectly via ONE_DAY_ITINERARY_FIELDS etc.
void SHARED_FIELDS;

function buildDefaultFieldMapping(fields: readonly string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  for (const field of fields) {
    mapping[field] = field;
  }
  return mapping;
}

export async function seedCanvaTemplates(prisma: PrismaClient) {
  console.log("Seeding Canva templates from env vars...");

  let seeded = 0;
  for (const seed of TEMPLATE_SEEDS) {
    const templateId = process.env[seed.envVar];
    if (!templateId) {
      console.warn(`  Skipping ${seed.tourDuration}_${seed.artifactType}: ${seed.envVar} not set`);
      continue;
    }

    await prisma.canvaTemplate.upsert({
      where: {
        tourDuration_artifactType: {
          tourDuration: seed.tourDuration,
          artifactType: seed.artifactType,
        },
      },
      update: {},
      create: {
        tourDuration: seed.tourDuration,
        artifactType: seed.artifactType,
        templateId,
        fieldMapping: buildDefaultFieldMapping(seed.fields),
        isActive: true,
      },
    });
    seeded++;
  }

  console.log(`Seeded ${seeded} Canva templates.`);
}
