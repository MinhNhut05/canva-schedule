"use client";

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
  signOutAction: () => Promise<void>;
}

interface MobileSidebarProps {
  fullName?: string | null;
  username?: string | null;
  signOutAction: () => Promise<void>;
}

interface NavItem {
  href?: string;
  label: string;
  disabled?: boolean;
}

const primaryItems: NavItem[] = [
  { href: "/dashboard", label: "Bảng điều khiển" },
  { href: "/upload", label: "Tải tài liệu" },
  { href: "/review", label: "Duyet noi dung" },
];

const secondaryItems: NavItem[] = [
  { label: "Lịch sử", disabled: true },
  { label: "Cài đặt", disabled: true },
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
        className="flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-muted-foreground/80"
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
        "flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        isActive ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted",
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
  signOutAction,
  onNavigate,
}: {
  pathname: string;
  fullName?: string | null;
  username?: string | null;
  signOutAction: () => Promise<void>;
  onNavigate?: () => void;
}) {
  const displayName = useMemo(() => fullName?.trim() || "Người dùng", [fullName]);
  const displayUsername = useMemo(() => username?.trim() || "@chua-cap-nhat", [username]);

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="px-5 py-6">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="inline-flex rounded-md text-xl font-semibold text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          SileTravel
        </Link>
      </div>

      <Separator />

      <div className="flex-1 space-y-6 px-4 py-6">
        <nav aria-label="Điều hướng chính" className="space-y-2">
          {primaryItems.map((item) => (
            <SidebarLink key={item.label} item={item} pathname={pathname} onNavigate={onNavigate} />
          ))}
        </nav>

        <div className="space-y-2" aria-label="Mục dự kiến">
          {secondaryItems.map((item) => (
            <SidebarLink key={item.label} item={item} pathname={pathname} />
          ))}
        </div>
      </div>

      <Separator />

      <div className="space-y-4 px-4 py-5">
        <div className="space-y-1 rounded-xl bg-muted/50 px-4 py-3">
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

function MobileSidebar({ fullName, username, signOutAction }: MobileSidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b bg-white px-4 py-4 md:hidden">
      <div className="flex items-center justify-between gap-4">
        <Link href="/dashboard" className="text-lg font-semibold text-foreground">
          SileTravel
        </Link>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="focus-visible:ring-2 focus-visible:ring-primary"
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
              signOutAction={signOutAction}
              onNavigate={() => setOpen(false)}
            />
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}

export function AppSidebar({ fullName, username, signOutAction }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      <MobileSidebar
        fullName={fullName}
        username={username}
        signOutAction={signOutAction}
      />

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r bg-white md:block">
        <SidebarContent
          pathname={pathname}
          fullName={fullName}
          username={username}
          signOutAction={signOutAction}
        />
      </aside>
    </>
  );
}
