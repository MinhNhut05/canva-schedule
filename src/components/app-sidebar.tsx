"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

function MenuIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-5"
    >
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </svg>
  );
}

interface AppSidebarProps {
  fullName?: string | null;
  username?: string | null;
  role: "admin" | "member";
  signOutAction: () => Promise<void>;
}

interface MobileSidebarProps {
  fullName?: string | null;
  username?: string | null;
  role: "admin" | "member";
  signOutAction: () => Promise<void>;
}

interface NavItem {
  href?: string;
  label: string;
  disabled?: boolean;
}

const primaryItems: NavItem[] = [
  { href: "/dashboard", label: "Tổng quan" },
  { href: "/upload", label: "Tải tài liệu" },
  { href: "/history", label: "Lịch sử" },
  { href: "/settings/password", label: "Cài đặt" },
];

const adminItems: NavItem[] = [
  { href: "/admin/rules", label: "Quy tắc" },
  { href: "/admin/templates", label: "Mẫu Canva" },
  { href: "/admin/canva", label: "Kết nối Canva" },
];

function SidebarLink({
  item,
  pathname,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  onNavigate?: () => void;
}) {
  const isActive = item.href ? pathname.startsWith(item.href) : false;

  if (!item.href || item.disabled) {
    return (
      <span
        aria-disabled="true"
        className="flex min-h-11 items-center rounded-full px-4 text-sm font-semibold text-muted-foreground/70"
      >
        {item.label}
      </span>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "flex min-h-11 items-center rounded-full px-4 text-sm font-semibold transition-premium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        isActive
          ? "border border-primary/35 bg-primary/15 text-primary shadow-[0_0_26px_rgba(41,218,245,0.18)]"
          : "text-muted-foreground hover:border hover:border-primary/20 hover:bg-primary/10 hover:text-foreground",
      )}
    >
      {item.label}
    </Link>
  );
}

function SidebarContent({
  pathname,
  fullName,
  username,
  role,
  signOutAction,
  onNavigate,
}: {
  pathname: string;
  fullName?: string | null;
  username?: string | null;
  role: "admin" | "member";
  signOutAction: () => Promise<void>;
  onNavigate?: () => void;
}) {
  const displayName = useMemo(() => fullName?.trim() || "Người dùng", [fullName]);
  const displayUsername = useMemo(() => username?.trim() || "@chua-cap-nhat", [username]);

  return (
    <div className="flex h-full flex-col surface-panel-glass">
      <div className="px-5 py-6">
        <Link
          href="/"
          onClick={onNavigate}
          className="inline-flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Image src="/logo.png" alt="SileTravel" width={160} height={56} className="h-14 w-auto" priority unoptimized />
        </Link>
      </div>

      <Separator />

      <div className="flex-1 space-y-6 px-4 py-6">
        <nav aria-label="Điều hướng chính" className="space-y-2">
          {primaryItems.map((item) => (
            <SidebarLink key={item.label} item={item} pathname={pathname} onNavigate={onNavigate} />
          ))}
        </nav>

        {role === "admin" && (
          <div className="pt-2">
            <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Quản lý
            </p>
            <nav aria-label="Quan tri" className="space-y-2">
              {adminItems.map((item) => (
                <SidebarLink key={item.label} item={item} pathname={pathname} onNavigate={onNavigate} />
              ))}
            </nav>
          </div>
        )}
      </div>

      <Separator />

      <div className="space-y-4 px-4 py-5">
        <div className="space-y-1 rounded-[24px] border border-primary/15 bg-primary/10 px-4 py-3 shadow-semantic-light">
          <p className="text-sm font-semibold text-foreground">{displayName}</p>
          <p className="text-sm text-muted-foreground">{displayUsername}</p>
        </div>

        <form action={signOutAction}>
          <Button
            type="submit"
            variant="outline"
            className="w-full justify-center focus-visible:ring-2 focus-visible:ring-primary"
          >
            Đăng xuất
          </Button>
        </form>
      </div>
    </div>
  );
}

function MobileSidebar({ fullName, username, role, signOutAction }: MobileSidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-primary/20 surface-panel-glass px-4 py-4 md:hidden">
      <div className="flex items-center justify-between gap-4">
        <Link href="/" className="inline-flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background">
          <Image src="/logo.png" alt="SileTravel" width={120} height={42} className="h-10 w-auto" priority unoptimized />
        </Link>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="border-primary/25 bg-primary/10 text-primary transition-premium hover:bg-primary/15 focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Mở điều hướng"
            >
              <MenuIcon />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-60 p-0 sm:max-w-60">
            <SheetTitle className="sr-only">Điều hướng ứng dụng</SheetTitle>
            <SheetDescription className="sr-only">
              Mở thanh điều hướng để chuyển giữa bảng điều khiển và tải tài liệu.
            </SheetDescription>
            <SidebarContent
              pathname={pathname}
              fullName={fullName}
              username={username}
              role={role}
              signOutAction={signOutAction}
              onNavigate={() => setOpen(false)}
            />
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}

export function AppSidebar({ fullName, username, role, signOutAction }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      <MobileSidebar
        fullName={fullName}
        username={username}
        role={role}
        signOutAction={signOutAction}
      />

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-primary/20 surface-panel-glass md:block">
        <SidebarContent
          pathname={pathname}
          fullName={fullName}
          username={username}
          role={role}
          signOutAction={signOutAction}
        />
      </aside>
    </>
  );
}
