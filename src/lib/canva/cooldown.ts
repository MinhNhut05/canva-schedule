import "server-only";
import { db } from "@/lib/db";

export async function getGlobalCooldown(): Promise<Date | null> {
  const token = await db.canvaToken.findFirst({
    orderBy: { updatedAt: "desc" },
    select: { cooldownUntil: true },
  });
  if (!token?.cooldownUntil) return null;
  if (token.cooldownUntil.getTime() <= Date.now()) return null;
  return token.cooldownUntil;
}

export async function setGlobalCooldown(cooldownSeconds: number): Promise<void> {
  const cooldownUntil = new Date(Date.now() + cooldownSeconds * 1000);
  const token = await db.canvaToken.findFirst({
    orderBy: { updatedAt: "desc" },
    select: { id: true },
  });
  if (!token) return;
  await db.canvaToken.update({
    where: { id: token.id },
    data: { cooldownUntil },
  });
}

export function getRemainingCooldownSeconds(cooldownUntil: Date): number {
  const remaining = Math.ceil((cooldownUntil.getTime() - Date.now()) / 1000);
  return Math.max(0, remaining);
}
