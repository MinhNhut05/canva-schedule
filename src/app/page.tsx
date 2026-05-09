import Link from "next/link";
import { ArrowRight, LayoutDashboard, Sparkles, Upload } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const milestones = [
  {
    title: "Foundation",
    description: "Chuẩn hóa visual token, surface glass, typography và hệ màu chủ đạo.",
    status: "Đã hoàn thành",
  },
  {
    title: "Core pages",
    description: "Nâng cấp dashboard, upload, review, history và admin về cùng một visual language.",
    status: "Đang triển khai",
  },
  {
    title: "Polish",
    description: "Tinh chỉnh chuyển động, responsive và trải nghiệm thao tác thực tế.",
    status: "Tiếp tục tối ưu",
  },
];

export default function HomePage() {
  return (
    <main className="mx-auto w-full max-w-[1200px] space-y-8 px-4 py-6 md:px-8 md:py-8">
      <section className="surface-hero hero-grid hero-grain relative overflow-hidden rounded-[30px] border border-semantic-dark px-6 py-10 text-surface-hero-foreground shadow-semantic-dark sm:px-8 lg:px-12 lg:py-14">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(171,221,255,0.28),transparent_30%),radial-gradient(circle_at_86%_74%,rgba(122,84,255,0.22),transparent_36%),linear-gradient(110deg,transparent,rgba(255,255,255,0.07),transparent)]" />
        <div className="pointer-events-none absolute -left-12 top-1/3 h-24 w-[42%] rotate-[-12deg] bg-gradient-to-r from-transparent via-white/18 to-transparent blur-2xl" />
        <div className="pointer-events-none absolute -right-14 bottom-12 h-20 w-[45%] rotate-[8deg] bg-gradient-to-r from-transparent via-cyan-200/35 to-transparent blur-2xl" />

        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)] lg:items-end">
          <div className="space-y-5">
            <Badge className="w-fit border border-white/15 bg-white/10 text-xs font-semibold tracking-[0.16em] text-white/85 uppercase">
              Frontend design roadmap
            </Badge>

            <div className="space-y-4">
              <h1 className="max-w-4xl font-heading text-[3.25rem] font-medium leading-[0.88] tracking-[-0.045em] text-white drop-shadow-[0_18px_40px_rgba(122,184,255,0.32)] sm:text-[4.9rem] lg:text-[5.9rem]">
                <span className="italic">FRONT</span>
                <br />
                <span className="italic">FLOW</span>
              </h1>
              <p className="max-w-2xl text-base leading-7 text-white/78 sm:text-lg">
                Trang chủ này dùng để thể hiện tiến trình nâng cấp UI/UX của website theo hướng
                futuristic blue, tập trung vào bố cục rõ, cảm giác cao cấp và thao tác nhanh.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild className="glow-accent focus-ring-premium transition-premium hover-lift-subtle">
                <Link href="/dashboard">
                  Vào Dashboard
                  <LayoutDashboard className="size-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-white/20 bg-white/10 text-white hover:bg-white/15 hover:text-white"
              >
                <Link href="/upload">
                  Mở luồng tải tài liệu
                  <Upload className="size-4" />
                </Link>
              </Button>
            </div>
          </div>

          <Card className="surface-hero-card border-semantic-dark text-white">
            <CardHeader className="space-y-3">
              <Badge className="w-fit border border-white/15 bg-white/10 text-white/85">2026 Visual</Badge>
              <CardTitle className="text-2xl text-white">Design status · 2026</CardTitle>
              <p className="text-sm leading-6 text-white/72">
                Home này là điểm vào chính tại <strong>http://localhost:3001/</strong> để theo dõi
                định hướng frontend trước khi đi vào các màn hình nghiệp vụ.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-[18px] border border-white/12 bg-white/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/58">Style</p>
                <p className="mt-2 text-base text-white/90">Premium glass · Blue futuristic · Motion streaks</p>
              </div>
              <div className="rounded-[18px] border border-white/12 bg-white/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/58">Mục tiêu</p>
                <p className="mt-2 text-base text-white/90">Đồng bộ trải nghiệm từ trang chủ đến dashboard/review</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {milestones.map((item) => (
          <Card
            key={item.title}
            className="surface-panel-glass border-semantic-light transition-premium hover-lift-subtle"
          >
            <CardHeader className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <CardTitle className="text-[1.4rem] leading-tight text-foreground">{item.title}</CardTitle>
                <Badge variant="outline" className="border-primary/15 bg-primary/5 text-primary">
                  {item.status}
                </Badge>
              </div>
              <p className="text-sm leading-6 text-muted-foreground">{item.description}</p>
            </CardHeader>
          </Card>
        ))}
      </section>

      <section className="surface-panel rounded-[28px] border border-semantic-light px-6 py-7 shadow-semantic-light sm:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary/75">
              Next step
            </p>
            <h2 className="text-[1.8rem] font-semibold leading-tight text-foreground sm:text-[2rem]">
              Chọn điểm vào phù hợp với tác vụ của bạn
            </h2>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground">
              Dashboard cho góc nhìn tổng quan, Upload cho intake workflow, và các màn hình còn lại
              bám theo cùng ngôn ngữ thiết kế.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
            <Button asChild variant="outline" className="justify-between">
              <Link href="/dashboard">
                Đi tới Dashboard
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild className="glow-accent focus-ring-premium transition-premium hover-lift-subtle">
              <Link href="/upload">
                Đi tới Upload
                <Sparkles className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
