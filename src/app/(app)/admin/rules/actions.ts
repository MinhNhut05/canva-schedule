"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { SEEDED_RULE_IDS } from "@/lib/rules/seed";

function assertAdmin(role: string | undefined) {
  if (role !== "admin") {
    throw new Error("Bạn không có quyền thực hiện thao tác này.");
  }
}

export async function getRules() {
  const session = await auth();
  assertAdmin(session?.user?.role);

  return db.companyRule.findMany({
    orderBy: [{ category: "asc" }, { ruleId: "asc" }],
  });
}

export async function createRule(data: {
  name: string;
  description: string;
  category: string;
}) {
  const session = await auth();
  assertAdmin(session?.user?.role);

  if (!data.name.trim() || !data.description.trim() || !data.category.trim()) {
    return { success: false, error: "Tất cả các trường đều bắt buộc." };
  }

  // Generate next rule ID: RULE-XX where XX is max existing + 1
  const lastRule = await db.companyRule.findFirst({
    orderBy: { ruleId: "desc" },
    select: { ruleId: true },
  });
  const lastNum = lastRule
    ? parseInt(lastRule.ruleId.replace("RULE-", ""), 10)
    : 0;
  const nextRuleId = `RULE-${String(lastNum + 1).padStart(2, "0")}`;

  await db.companyRule.create({
    data: {
      ruleId: nextRuleId,
      name: data.name.trim(),
      description: data.description.trim(),
      category: data.category.trim(),
      isActive: true,
    },
  });

  revalidatePath("/admin/rules");
  return { success: true };
}

export async function updateRule(
  ruleId: string,
  data: {
    name?: string;
    description?: string;
    category?: string;
    isActive?: boolean;
  },
) {
  const session = await auth();
  assertAdmin(session?.user?.role);

  const rule = await db.companyRule.findUnique({ where: { ruleId } });
  if (!rule) {
    return { success: false, error: "Không tìm thấy quy tắc." };
  }

  await db.companyRule.update({
    where: { ruleId },
    data: {
      ...(data.name !== undefined && { name: data.name.trim() }),
      ...(data.description !== undefined && { description: data.description.trim() }),
      ...(data.category !== undefined && { category: data.category.trim() }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  });

  revalidatePath("/admin/rules");
  return { success: true };
}

export async function toggleRuleActive(ruleId: string, isActive: boolean) {
  return updateRule(ruleId, { isActive });
}

export async function softDeleteRule(ruleId: string) {
  const session = await auth();
  assertAdmin(session?.user?.role);

  if (SEEDED_RULE_IDS.has(ruleId)) {
    return {
      success: false,
      error: "Quy tắc gốc không được xóa. Chỉ có thể tắt hoạt động.",
    };
  }

  const rule = await db.companyRule.findUnique({ where: { ruleId } });
  if (!rule) {
    return { success: false, error: "Không tìm thấy quy tắc." };
  }

  await db.companyRule.update({
    where: { ruleId },
    data: { isActive: false },
  });

  revalidatePath("/admin/rules");
  return { success: true };
}
