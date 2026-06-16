"use client";

import NextImage from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  ChevronRight,
  History,
  Image as ImageIcon,
  LayoutGrid,
  LayoutTemplate,
  ListChecks,
  LogOut,
  Menu,
  Plug,
  Settings,
  ShieldCheck,
  Upload,
  type LucideIcon,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type Role = "admin" | "member";

interface AppSidebarProps {
  fullName?: string | null;
  username?: string | null;
  role: Role;
  signOutAction: () => Promise<void>;
  fontClass: string;
}

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const primaryItems: NavItem[] = [
  { href: "/dashboard", label: "Tổng quan", icon: LayoutGrid },
  { href: "/upload", label: "Tải tài liệu", icon: Upload },
  { href: "/image-gen", label: "Tạo ảnh", icon: ImageIcon },
  { href: "/history", label: "Lịch sử", icon: History },
  { href: "/settings/password", label: "Cài đặt", icon: Settings },
];

const adminItems: NavItem[] = [
  { href: "/admin/rules", label: "Quy tắc", icon: ListChecks },
  { href: "/admin/templates", label: "Mẫu Canva", icon: LayoutTemplate },
  { href: "/admin/canva", label: "Kết nối Canva", icon: Plug },
];

function NavLink({
  item,
  pathname,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  onNavigate?: () => void;
}) {
  const isActive = pathname.startsWith(item.href);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={isActive ? "page" : undefined}
      className={`nav-item${isActive ? " active" : ""}`}
    >
      {isActive ? <span className="dot" aria-hidden="true" /> : null}
      <span className="ic">
        <Icon />
      </span>
      <span className="lbl">{item.label}</span>
      <span className="tail" aria-hidden="true">
        <ChevronRight />
      </span>
    </Link>
  );
}

function SidebarBody({
  fullName,
  username,
  role,
  signOutAction,
  pathname,
  onNavigate,
}: Omit<AppSidebarProps, "fontClass"> & {
  pathname: string;
  onNavigate?: () => void;
}) {
  const displayName = fullName?.trim() || "Người dùng";
  const cleanUsername = username?.trim().replace(/^@/, "");
  const displayUsername = cleanUsername ? `@${cleanUsername}` : "@chua-cap-nhat";
  const initial = (displayName[0] || "S").toUpperCase();

  return (
    <div className="sb-inner">
      <Link href="/" onClick={onNavigate} className="sb-brand" aria-label="SOHA Travel">
        <NextImage src="/front-flow/soha-logo.png" alt="SOHA Travel" width={51} height={38} priority />
        <span className="bt">
          <span className="nm">SOHA Travel</span>
          <span className="sub">Tour workspace</span>
        </span>
      </Link>

      <nav className="sb-nav" aria-label="Điều hướng chính">
        {primaryItems.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} onNavigate={onNavigate} />
        ))}
      </nav>

      {role === "admin" ? (
        <div className="sb-group">
          <div className="sb-divider" aria-hidden="true" />
          <div className="sb-group-h">
            <ShieldCheck /> Quản lý
          </div>
          <nav className="sb-nav" aria-label="Quản trị">
            {adminItems.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} onNavigate={onNavigate} />
            ))}
          </nav>
        </div>
      ) : null}

      <div className="sb-foot">
        <div className="sb-user">
          <span className="sb-ava" aria-hidden="true">
            {initial}
          </span>
          <span className="ut">
            <span className="nm">{displayName}</span>
            <span className="un">{displayUsername}</span>
          </span>
        </div>
        <form action={signOutAction}>
          <button type="submit" className="sb-logout">
            <LogOut /> Đăng xuất
          </button>
        </form>
      </div>
    </div>
  );
}

export function AppSidebar({ fontClass, ...rest }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="app-aside">
      <div className={`sb-scope ${fontClass}`}>
        <SidebarBody {...rest} pathname={pathname} />
      </div>
    </aside>
  );
}

export function AppMobileTopbar({ fontClass, ...rest }: AppSidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="app-topbar">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button type="button" className="app-burger" aria-label="Mở điều hướng">
            <Menu />
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="sb-drawer w-[264px] max-w-[264px] p-0">
          <SheetTitle className="sr-only">Điều hướng ứng dụng</SheetTitle>
          <SheetDescription className="sr-only">
            Chuyển giữa các khu vực làm việc của SOHA Travel.
          </SheetDescription>
          <div className={`sb-scope ${fontClass}`} style={{ height: "100%" }}>
            <SidebarBody {...rest} pathname={pathname} onNavigate={() => setOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      <Link href="/" className="app-tb-brand" aria-label="SOHA Travel">
        <NextImage src="/front-flow/soha-logo.png" alt="SOHA Travel" width={40} height={30} priority />
        <span className="nm">SOHA Travel</span>
      </Link>
    </header>
  );
}
