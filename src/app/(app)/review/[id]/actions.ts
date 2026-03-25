"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { structuredDraftSchema } from "@/lib/ai/extraction-schema";
import { extractTour } from "@/lib/ai/extract-tour";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  approveDraft as persistApproval,
  saveDraft as persistDraft,
} from "@/lib/review/draft";
import { AI_STATUS } from "@/lib/review/status";

function setByPath(obj: unknown, path: string, value: unknown): unknown {
  const clone = JSON.parse(JSON.stringify(obj));
  const keys = path.split(".");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let current: any = clone;

  for (let index = 0; index < keys.length - 1; index += 1) {
    const key = /^\d+$/.test(keys[index]) ? Number(keys[index]) : keys[index];

    if (current[key] === undefined || current[key] === null) {
      return clone;
    }

    current = current[key];
  }

  const lastKey = keys[keys.length - 1];
  const finalKey = /^\d+$/.test(lastKey) ? Number(lastKey) : lastKey;
  current[finalKey] = value;

  return clone;
}

async function requireAuth() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  return session.user.id;
}

export async function saveDraftField(
  uploadId: string,
  fieldPath: string,
  newValue: string,
): Promise<{ success: boolean; error?: string }> {
  const userId = await requireAuth();

  if (!userId) {
    return { success: false, error: "Phien dang nhap het han." };
  }

  const upload = await prisma.upload.findFirst({
    where: { id: uploadId, userId },
    select: { structuredDraft: true },
  });

  if (!upload?.structuredDraft) {
    return { success: false, error: "Khong tim thay ban nhap." };
  }

  const updated = setByPath(upload.structuredDraft, fieldPath, newValue);
  const parsed = structuredDraftSchema.safeParse(updated);

  if (!parsed.success) {
    const issue = parsed.error.issues[0];

    return {
      success: false,
      error: `Gia tri khong hop le: ${issue?.path.join(".")}: ${issue?.message}`,
    };
  }

  await prisma.upload.update({
    where: { id: uploadId },
    data: {
      structuredDraft: parsed.data as Prisma.InputJsonValue,
    },
  });

  revalidatePath(`/review/${uploadId}`);
  return { success: true };
}

export async function approveDraft(
  uploadId: string,
): Promise<{ success: boolean; error?: string }> {
  const userId = await requireAuth();

  if (!userId) {
    return { success: false, error: "Phien dang nhap het han." };
  }

  const upload = await prisma.upload.findFirst({
    where: { id: uploadId, userId },
    select: { id: true, structuredDraft: true },
  });

  if (!upload) {
    return { success: false, error: "Khong tim thay tai lieu." };
  }

  if (!upload.structuredDraft) {
    return { success: false, error: "Chua co noi dung de duyet." };
  }

  await persistApproval(uploadId);

  revalidatePath(`/review/${uploadId}`);
  return { success: true };
}

export async function reExtractDraft(
  uploadId: string,
): Promise<{ success: boolean; error?: string }> {
  const userId = await requireAuth();

  if (!userId) {
    return { success: false, error: "Phien dang nhap het han." };
  }

  const upload = await prisma.upload.findFirst({
    where: { id: uploadId, userId },
    select: { id: true, normalizedText: true },
  });

  if (!upload?.normalizedText) {
    return {
      success: false,
      error: "Khong co van ban goc de trich xuat lai.",
    };
  }

  try {
    await prisma.upload.update({
      where: { id: uploadId },
      data: { aiStatus: AI_STATUS.PROCESSING },
    });

    const result = await extractTour(upload.normalizedText);

    await persistDraft(
      uploadId,
      result.draft,
      result.model,
      result.attemptCount,
    );

    revalidatePath(`/review/${uploadId}`);
    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Co loi xay ra khi trich xuat lai.";

    await prisma.upload.update({
      where: { id: uploadId },
      data: {
        aiStatus: AI_STATUS.FAILED,
        aiErrorMessage: message,
      },
    });

    revalidatePath(`/review/${uploadId}`);
    return { success: false, error: message };
  }
}
