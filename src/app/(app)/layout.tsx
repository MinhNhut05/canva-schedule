import { AppSidebar } from "@/components/app-sidebar";
import { auth } from "@/lib/auth";
import { signOutAction } from "./actions";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="min-h-screen bg-background text-foreground hero-grid hero-grain">
      <AppSidebar
        fullName={session?.user?.name}
        username={session?.user?.username}
        role={session?.user?.role ?? "member"}
        signOutAction={signOutAction}
      />

      <main className="relative z-10 px-4 py-8 md:ml-60 md:px-8">
        <div className="mx-auto w-full max-w-[1200px]">{children}</div>
      </main>
    </div>
  );
}
