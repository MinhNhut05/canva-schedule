import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { seedCompanyRules } from "../src/lib/rules/seed";
import { seedCanvaTemplates } from "../src/lib/canva/template-seed";

const prisma = new PrismaClient();

const SALT_ROUNDS = 12;

interface SeedUser {
  username: string;
  email: string;
  name: string;
  password: string;
  role: "admin" | "member";
}

const seedUsers: SeedUser[] = [
  { username: "admin", email: "admin@siletravel.local", name: "Admin User", password: "password123", role: "admin" },
  { username: "editor", email: "editor@siletravel.local", name: "Editor User", password: "password123", role: "member" },
  { username: "viewer", email: "viewer@siletravel.local", name: "Viewer User", password: "password123", role: "member" },
];

async function main() {
  console.log("Seeding database...\n");

  await seedCompanyRules(prisma);
  await seedCanvaTemplates(prisma);

  console.log("Resetting existing users and user-owned records...");
  await prisma.canvaShareJob.deleteMany();
  await prisma.canvaArtifact.deleteMany();
  await prisma.upload.deleteMany();
  await prisma.user.deleteMany();

  for (const user of seedUsers) {
    const passwordHash = await bcrypt.hash(user.password, SALT_ROUNDS);

    const created = await prisma.user.upsert({
      where: { username: user.username },
      update: {
        email: user.email,
        name: user.name,
        passwordHash,
        role: user.role,
        mustChangePassword: true,
      },
      create: {
        username: user.username,
        email: user.email,
        name: user.name,
        passwordHash,
        role: user.role,
        mustChangePassword: true,
      },
    });

    console.log(
      `  ${created.username} (${created.name}) email=${created.email} role=${created.role} — mustChangePassword: true`
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
