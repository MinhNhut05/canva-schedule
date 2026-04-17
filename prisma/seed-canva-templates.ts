import { PrismaClient } from "@prisma/client";

import { seedCanvaTemplates } from "../src/lib/canva/template-seed";

const prisma = new PrismaClient();

async function main() {
  console.log("Backfilling Canva templates...\n");

  await seedCanvaTemplates(prisma);

  console.log("\nCanva template backfill complete!");
}

main()
  .catch((error) => {
    console.error("Canva template backfill failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
