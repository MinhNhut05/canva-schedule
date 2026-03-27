import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

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
        <Link
          href="/dashboard"
          className="mt-6 inline-flex h-11 items-center rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          Về bảng điều khiển
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
