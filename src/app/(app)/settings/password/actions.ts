"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  verifyPassword,
  hashPassword,
  assertPasswordPolicy,
} from "@/lib/password";

interface ChangePasswordState {
  success: boolean;
  error: string | null;
}

export async function changePasswordAction(
  _prevState: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Phiên đăng nhập hết hạn" };
  }

  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { success: false, error: "Vui lòng điền đầy đủ thông tin" };
  }

  if (newPassword !== confirmPassword) {
    return { success: false, error: "Mật khẩu mới không khớp" };
  }

  try {
    assertPasswordPolicy(newPassword);
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Mật khẩu không hợp lệ",
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) {
    return { success: false, error: "Không tìm thấy tài khoản" };
  }

  const isValid = await verifyPassword(currentPassword, user.passwordHash);
  if (!isValid) {
    return { success: false, error: "Mật khẩu hiện tại không đúng" };
  }

  const newHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      passwordHash: newHash,
      mustChangePassword: false,
    },
  });

  return { success: true, error: null };
}
