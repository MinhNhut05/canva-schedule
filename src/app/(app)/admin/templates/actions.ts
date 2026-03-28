"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { verifyCanvaTemplate } from "@/lib/canva/verify-template";

function assertAdmin(role: string | undefined) {
  if (role !== "admin") {
    throw new Error("Bạn không có quyền thực hiện thao tác này.");
  }
}

export type FieldMappingEntry = {
  sourceField: string;
  canvaElementName: string;
};

export async function getTemplates() {
  const session = await auth();
  assertAdmin(session?.user?.role);

  return db.canvaTemplate.findMany({
    orderBy: [{ tourDuration: "asc" }, { artifactType: "asc" }],
  });
}

export async function updateTemplate(
  id: string,
  data: {
    templateId?: string;
    fieldMapping?: Record<string, string>;
    isActive?: boolean;
  },
) {
  const session = await auth();
  assertAdmin(session?.user?.role);

  const template = await db.canvaTemplate.findUnique({ where: { id } });
  if (!template) {
    return { success: false, error: "Không tìm thấy mẫu Canva." };
  }

  // If templateId is being changed, verify with Canva API first
  if (data.templateId !== undefined && data.templateId !== template.templateId) {
    const verification = await verifyCanvaTemplate(data.templateId);
    if (!verification.success) {
      return {
        success: false,
        error: verification.error ?? "Không thể xác minh mẫu Canva. Kiểm tra lại Template ID hoặc quyền truy cập Canva rồi thử lưu lại.",
      };
    }
  }

  await db.canvaTemplate.update({
    where: { id },
    data: {
      ...(data.templateId !== undefined && { templateId: data.templateId.trim() }),
      ...(data.fieldMapping !== undefined && { fieldMapping: data.fieldMapping }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  });

  revalidatePath("/admin/templates");
  return { success: true };
}

export async function toggleTemplateActive(id: string, isActive: boolean) {
  return updateTemplate(id, { isActive });
}
