import Link from "next/link";
import { ArrowRight, Clock3, History, ShieldCheck, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";

const quickActions = [
  {
    href: "/upload",
    title: "Tải tài liệu mới",
    description: "Bắt đầu luồng nhập tài liệu và chuẩn bị dữ liệu cho bước AI.",
    icon: Upload,
    badge: "Ưu tiên",
  },
  {
    href: "/history",
    title: "Lịch sử xử lý",
    description: "Xem lại các tài liệu đã xử lý và trạng thái gần đây.",
    icon: History,
    badge: "Theo dõi",
  },
  {
    href: "/settings/password",
    title: "Bảo mật tài khoản",
    description: "Kiểm tra mật khẩu và cập nhật thiết lập truy cập khi cần.",
    icon: ShieldCheck,
    badge: "An toàn",
  },
];

const supportPanels = [
  {
    title: "Không gian làm việc",
    description: "Khu vực này giữ vai trò control-center cho các bước tải lên, kiểm tra và theo dõi tiến độ.",
  },
  {
    title: "Trạng thái phát triển",
    description: "Một số khối điều phối nâng cao đang tiếp tục được hoàn thiện để phục vụ quy trình tài liệu.",
  },
];

export default async function DashboardPage() {
  const session = await auth();
  const userName = session?.user?.name || "bạn";

  return (
    <div className="space-y-8 pb-4">
      <section className="surface-hero hero-grid hero-grain relative overflow-hidden rounded-[28px] border border-semantic-dark px-6 py-8 text-surface-hero-foreground shadow-semantic-dark sm:px-8 lg:px-10 lg:py-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(169,208,255,0.2),transparent_30%),linear-gradient(120deg,transparent,rgba(255,255,255,0.06),transparent)]" />
        <div className="pointer-events-none absolute inset-y-6 right-6 hidden w-px bg-gradient-to-b from-white/0 via-white/30 to-white/0 lg:block" />
        <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.9fr)] lg:items-end">
          <div className="space-y-5">
            <Badge className="w-fit border border-white/15 bg-white/10 text-xs font-semibold tracking-[0.16em] text-white/85 uppercase">
              Control center
            </Badge>
            <div className="space-y-3">
              <h1 className="max-w-3xl text-4xl font-bold leading-tight text-white sm:text-5xl">
                Bảng điều khiển
              </h1>
              <p className="max-w-2xl text-base leading-7 text-white/78 sm:text-lg">
                Xin chào, <strong className="font-semibold text-white">{userName}</strong>! Đây là trung tâm điều phối SileTravel để bắt đầu tải tài liệu, mở bước kiểm tra và theo dõi các luồng đang chạy.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild className="glow-accent focus-ring-premium transition-premium hover-lift-subtle">
                <Link href="/upload">
                  Mở luồng tải tài liệu
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-primary/30 bg-primary/10 text-white hover:bg-primary/15 hover:text-primary"
              >
                <Link href="/history">Xem lịch sử xử lý</Link>
              </Button>
            </div>
          </div>

          <Card className="surface-hero-card border-semantic-dark text-white transition-premium">
            <CardHeader className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <CardTitle className="text-2xl text-white">Nhịp làm việc</CardTitle>
                <Badge className="border border-white/15 bg-white/10 text-white">Đang mở rộng</Badge>
              </div>
              <p className="text-sm leading-6 text-white/72">
                Giữ luồng thao tác rõ ràng: tải lên, kiểm tra nội dung, theo dõi lịch sử và quản lý bảo mật truy cập.
              </p>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-2xl border border-white/12 bg-white/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/55">Workflow</p>
                <p className="mt-2 text-lg font-semibold text-white">Upload → Review</p>
              </div>
              <div className="rounded-2xl border border-white/12 bg-white/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/55">Trạng thái</p>
                <p className="mt-2 text-lg font-semibold text-white">Sẵn sàng xử lý tài liệu mới</p>
              </div>
              <div className="rounded-2xl border border-white/12 bg-white/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/55">Điểm nhấn</p>
                <p className="mt-2 flex items-center gap-2 text-lg font-semibold text-white">
                  <Clock3 className="size-4 text-accent-soft" />
                  Tính năng đang được phát triển...
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-4">
        {quickActions.map((action) => {
          const Icon = action.icon;

          return (
            <Card
              key={action.href}
              className="surface-panel-glass border-semantic-light transition-premium hover-lift-subtle hover:border-primary/30"
            >
              <CardHeader className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-[inset_0_0_0_1px_rgba(41,218,245,0.16)]">
                    <Icon className="size-5" />
                  </div>
                  <Badge variant="outline" className="border-primary/25 bg-primary/10 text-primary">
                    {action.badge}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-[1.35rem] leading-tight text-foreground">{action.title}</CardTitle>
                  <p className="text-sm leading-6 text-muted-foreground">{action.description}</p>
                </div>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full justify-between">
                  <Link href={action.href}>
                    Truy cập
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <Card className="surface-panel border-semantic-light shadow-semantic-light">
          <CardHeader className="space-y-3">
            <Badge variant="outline" className="w-fit border-primary/15 bg-primary/5 text-primary">
              Hỗ trợ vận hành
            </Badge>
            <CardTitle className="text-[1.75rem] leading-tight text-foreground">
              Trung tâm làm việc đang hình thành theo visual system mới.
            </CardTitle>
            <p className="max-w-3xl text-base leading-7 text-muted-foreground">
              Giao diện ưu tiên bố cục rõ, điểm nhấn mạnh ở hành động chính và mặt nền sáng ổn định để đọc nội dung dài không bị mỏi mắt.
            </p>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {supportPanels.map((panel) => (
              <div
                key={panel.title}
                className="surface-panel-cool rounded-[24px] border border-semantic-light p-5"
              >
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary/75">
                  {panel.title}
                </p>
                <p className="mt-3 text-base leading-7 text-muted-foreground">{panel.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="surface-panel-glass border-semantic-light shadow-semantic-light">
          <CardHeader className="space-y-3">
            <Badge variant="outline" className="w-fit border-primary/25 bg-primary/10 text-primary">
              Tiến độ
            </Badge>
            <CardTitle className="text-[1.5rem] leading-tight text-foreground">
              Control-center đang mở rộng từng bước.
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-[24px] border border-dashed border-primary/20 bg-primary/5 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary/75">Hiện tại</p>
              <p className="mt-3 text-base leading-7 text-muted-foreground">
                Luồng tải tài liệu và review đã sẵn sàng để thao tác. Các vùng tổng hợp sâu hơn tiếp tục được phát triển.
              </p>
            </div>
            <div className="surface-panel-glass space-y-3 rounded-[24px] border border-primary/20 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary/75">Lối tắt nhanh</p>
              <div className="flex flex-col gap-3">
                <Button asChild variant="outline" className="justify-between">
                  <Link href="/history">
                    Xem lịch sử xử lý
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="justify-between">
                  <Link href="/settings/password">
                    Mở bảo mật tài khoản
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
