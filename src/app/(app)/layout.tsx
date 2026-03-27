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
    <div className="min-h-screen bg-background text-foreground">
      <AppSidebar
        fullName={session?.user?.name}
        username={session?.user?.username}
        role={session?.user?.role ?? "member"}
        signOutAction={signOutAction}
      />

      <main className="px-4 py-8 md:ml-60 md:px-8">
        <div className="mx-auto w-full max-w-[960px]">{children}</div>
      </main>
    </div>
  );
}
