import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div style={{ minHeight: "100vh" }}>
      <header
        style={{
          padding: "0.75rem 1.5rem",
          backgroundColor: "#1e40af",
          color: "white",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1 style={{ fontSize: "1.25rem", fontWeight: "bold", margin: 0 }}>
          SileTravel
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span style={{ fontSize: "0.875rem" }}>
            {session.user.name} ({session.user.username})
          </span>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              style={{
                padding: "0.375rem 0.75rem",
                backgroundColor: "transparent",
                color: "white",
                border: "1px solid rgba(255,255,255,0.3)",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "0.875rem",
              }}
            >
              Đăng xuất
            </button>
          </form>
        </div>
      </header>
      <main style={{ padding: "1.5rem" }}>{children}</main>
    </div>
  );
}
