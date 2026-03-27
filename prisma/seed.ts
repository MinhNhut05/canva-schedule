import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { seedCompanyRules } from "../src/lib/rules/seed";
import { seedCanvaTemplates } from "../src/lib/canva/template-seed";

const prisma = new PrismaClient();

const SALT_ROUNDS = 12;

interface SeedUser {
  username: string;
  name: string;
  password: string;
  role: "admin" | "member";
}

const seedUsers: SeedUser[] = [
  { username: "admin", name: "Admin User", password: "password123", role: "admin" },
  { username: "editor", name: "Editor User", password: "password123", role: "member" },
  { username: "viewer", name: "Viewer User", password: "password123", role: "member" },
];

async function main() {
  console.log("Seeding database...\n");

  await seedCompanyRules(prisma);
  await seedCanvaTemplates(prisma);

  for (const user of seedUsers) {
    const passwordHash = await bcrypt.hash(user.password, SALT_ROUNDS);

    const created = await prisma.user.upsert({
      where: { username: user.username },
      update: {
        name: user.name,
        passwordHash,
        role: user.role,
        mustChangePassword: true,
      },
      create: {
        username: user.username,
        name: user.name,
        passwordHash,
        role: user.role,
        mustChangePassword: true,
      },
    });

    console.log(
      `  ${created.username} (${created.name}) role=${created.role} — mustChangePassword: true`
    );
  }

  console.log("\nSeed complete!");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
