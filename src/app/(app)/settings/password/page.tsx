"use client";

import { useActionState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { changePasswordAction } from "./actions";

export default function PasswordChangePage() {
  const [state, formAction, isPending] = useActionState(changePasswordAction, {
    success: false,
    error: null,
  });

  return (
    <section className="space-y-6 pb-4">
      <Card className="surface-hero hero-grid hero-grain overflow-hidden border border-semantic-dark text-surface-hero-foreground shadow-semantic-dark">
        <CardHeader className="space-y-4 px-6 py-7 sm:px-8">
          <Badge className="w-fit border border-white/15 bg-white/10 text-white/85">Trust surface</Badge>
          <div className="space-y-2">
            <CardTitle className="text-[2rem] leading-tight text-white">Đổi mật khẩu</CardTitle>
            <CardDescription className="max-w-2xl text-base leading-7 text-white/78">
              Cập nhật thông tin truy cập để giữ không gian xử lý tài liệu an toàn và ổn định cho đội ngũ vận hành.
            </CardDescription>
          </div>
        </CardHeader>
      </Card>

      <Card className="surface-panel-glass border-semantic-light shadow-semantic-light">
        <CardHeader className="space-y-3 border-b border-semantic-light bg-surface-panel-cool/60">
          <CardTitle className="text-[1.5rem] leading-tight text-foreground">Thông tin bảo mật</CardTitle>
          <CardDescription className="text-base leading-7 text-muted-foreground">
            Mật khẩu mới nên có ít nhất 8 ký tự và kết hợp chữ cái với số để giảm rủi ro truy cập ngoài ý muốn.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 p-6 lg:p-7">
          {state.success ? (
            <Alert className="rounded-[20px] border-emerald-300 bg-emerald-50 text-emerald-900">
              <AlertTitle>Đổi mật khẩu thành công</AlertTitle>
              <AlertDescription>Tài khoản đã được cập nhật với thông tin truy cập mới.</AlertDescription>
            </Alert>
          ) : null}

          {state.error ? (
            <Alert variant="destructive" className="rounded-[20px] border-destructive/35 bg-destructive/5">
              <AlertTitle>Không thể đổi mật khẩu</AlertTitle>
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          ) : null}

          <form action={formAction} className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <label htmlFor="currentPassword" className="text-sm font-semibold text-foreground">
                  Mật khẩu hiện tại
                </label>
                <Input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  required
                  autoComplete="current-password"
                  className="h-12 rounded-2xl border-semantic-light bg-white text-slate-950 placeholder:text-slate-500"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="newPassword" className="text-sm font-semibold text-foreground">
                  Mật khẩu mới
                </label>
                <Input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  required
                  autoComplete="new-password"
                  className="h-12 rounded-2xl border-semantic-light bg-white text-slate-950 placeholder:text-slate-500"
                />
                <p className="text-sm leading-6 text-muted-foreground">
                  Tối thiểu 8 ký tự, nên gồm chữ cái và số.
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-semibold text-foreground">
                  Xác nhận mật khẩu mới
                </label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  autoComplete="new-password"
                  className="h-12 rounded-2xl border-semantic-light bg-white text-slate-950 placeholder:text-slate-500"
                />
                <p className="text-sm leading-6 text-muted-foreground">
                  Nhập lại đúng mật khẩu mới để xác nhận thay đổi.
                </p>
              </div>
            </div>

            <div className="rounded-[20px] border border-semantic-light bg-primary/5 p-4">
              <p className="text-sm leading-6 text-muted-foreground">
                Sau khi cập nhật, hãy dùng mật khẩu mới cho các phiên đăng nhập tiếp theo của bạn.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
              <Button
                type="submit"
                disabled={isPending}
                className="glow-accent focus-ring-premium transition-premium hover-lift-subtle min-h-11 px-6"
              >
                {isPending ? "Đang xử lý..." : "Cập nhật mật khẩu"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
