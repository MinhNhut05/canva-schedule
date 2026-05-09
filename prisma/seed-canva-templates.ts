import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TEMPLATE_SEEDS = [
  {
    tourDuration: "ONE_DAY",
    artifactType: "ITINERARY",
    envVar: "CANVA_TEMPLATE_1DAY_ITINERARY",
    fields: ["title", "program_label", "tour_date", "morning_block", "afternoon_block"],
  },
  {
    tourDuration: "ONE_DAY",
    artifactType: "MENU",
    envVar: "CANVA_TEMPLATE_1DAY_MENU",
    fields: ["title", "program_label", "tour_date", "menu_morning_block", "menu_lunch_block", "menu_afternoon_block"],
  },
  {
    tourDuration: "TWO_DAY",
    artifactType: "ITINERARY",
    envVar: "CANVA_TEMPLATE_2DAY_ITINERARY",
    fields: ["title", "program_label", "tour_date", "day1_block", "day2_block"],
  },
  {
    tourDuration: "TWO_DAY",
    artifactType: "MENU",
    envVar: "CANVA_TEMPLATE_2DAY_MENU",
    fields: [
      "title",
      "program_label",
      "tour_date",
      "menu_morning_day1_block",
      "menu_lunch_day1_block",
      "menu_afternoon_day1_block",
      "menu_morning_day2_block",
      "menu_lunch_day2_block",
      "menu_afternoon_day2_block",
    ],
  },
  {
    tourDuration: "THREE_DAY",
    artifactType: "ITINERARY",
    envVar: "CANVA_TEMPLATE_3DAY_ITINERARY",
    fields: ["title", "program_label", "tour_date", "day1_block", "day2_block", "day3_block"],
  },
  {
    tourDuration: "THREE_DAY",
    artifactType: "MENU",
    envVar: "CANVA_TEMPLATE_3DAY_MENU",
    fields: [
      "title",
      "program_label",
      "tour_date",
      "menu_morning_day1_block",
      "menu_lunch_day1_block",
      "menu_afternoon_day1_block",
      "menu_morning_day2_block",
      "menu_lunch_day2_block",
      "menu_afternoon_day2_block",
      "menu_morning_day3_block",
      "menu_lunch_day3_block",
      "menu_afternoon_day3_block",
    ],
  },
];

function buildDefaultFieldMapping(fields: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  for (const field of fields) {
    mapping[field] = field;
  }
  return mapping;
}

async function main() {
  console.log("Backfilling Canva templates...\n");

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
      update: { templateId, fieldMapping: buildDefaultFieldMapping(seed.fields) },
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

  console.log(`\nBackfilled ${seeded} Canva templates.`);
}

main()
  .catch((error) => {
    console.error("Canva template backfill failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
