import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "admin") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <h1 className="text-xl font-semibold text-foreground">
          Bạn không có quyền truy cập
        </h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Trang này chỉ dành cho quản trị viên. Hãy quay về bảng điều khiển
          hoặc liên hệ người quản lý nếu bạn cần hỗ trợ.
        </p>
        <Button asChild className="mt-6">
          <Link href="/dashboard">Về bảng điều khiển</Link>
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
