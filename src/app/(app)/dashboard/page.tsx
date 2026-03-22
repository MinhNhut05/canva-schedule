import { auth } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div>
      <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", marginBottom: "1rem" }}>
        Dashboard
      </h2>
      <p>
        Xin chào, <strong>{session?.user?.name}</strong>! Đây là trang quản lý
        SileTravel.
      </p>
      <p style={{ color: "#666", marginTop: "0.5rem" }}>
        Tính năng đang được phát triển...
      </p>
    </div>
  );
}
