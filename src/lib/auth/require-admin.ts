import { auth } from "@/lib/auth";

export interface AdminCheckResult {
  isAdmin: boolean;
  userId: string | null;
  role: "admin" | "member" | null;
}

export async function requireAdmin(): Promise<AdminCheckResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return { isAdmin: false, userId: null, role: null };
  }

  const role = (session.user.role as "admin" | "member") ?? "member";

  return {
    isAdmin: role === "admin",
    userId: session.user.id,
    role,
  };
}
