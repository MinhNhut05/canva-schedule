import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCanvaTokenStatus } from "@/lib/canva/oauth";

import { startCanvaConnect } from "./actions";

export const metadata = {
  title: "Kết nối Canva | SileTravel",
};

function formatDate(value: Date | null) {
  if (!value) return "Chưa có";

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function getStatusLabel(status: string) {
  if (status === "ACTIVE") return "Đã kết nối";
  if (status === "REFRESHING") return "Đang làm mới token";
  return "Cần kết nối lại";
}

export default async function AdminCanvaPage({
  searchParams,
}: {
  searchParams?: Promise<{ connected?: string; error?: string }>;
}) {
  const [status, params] = await Promise.all([
    getCanvaTokenStatus(),
    searchParams ?? Promise.resolve({} as { connected?: string; error?: string }),
  ]);
  const statusTone = status.isConnected
    ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200"
    : "border-destructive/40 bg-destructive/10 text-destructive";

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Badge variant="outline" className="w-fit border-primary/15 bg-primary/5 text-primary">
          Quản trị Canva
        </Badge>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Kết nối Canva</h1>
          <p className="max-w-3xl text-base leading-7 text-muted-foreground">
            Kết nối lại tài khoản Canva khi refresh token hết hạn, bị thu hồi, hoặc môi trường local/staging/production cần token riêng.
          </p>
        </div>
      </div>

      {params.connected === "1" ? (
        <div className="rounded-[24px] border border-emerald-400/30 bg-emerald-400/10 px-5 py-4 text-sm font-medium text-emerald-100">
          Canva đã kết nối lại thành công.
        </div>
      ) : null}

      {params.error ? (
        <div className="rounded-[24px] border border-destructive/30 bg-destructive/10 px-5 py-4 text-sm font-medium text-destructive">
          Không thể kết nối Canva: {params.error}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <CardTitle>Trạng thái token Canva</CardTitle>
              <CardDescription>
                Mỗi môi trường phải tự kết nối Canva riêng; không copy refresh token giữa local, staging và production.
              </CardDescription>
            </div>
            <Badge variant="outline" className={statusTone}>
              {getStatusLabel(status.status)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[20px] border border-primary/15 bg-primary/5 p-4">
              <dt className="text-sm font-medium text-muted-foreground">Access token hết hạn</dt>
              <dd className="mt-2 text-base font-semibold text-foreground">{formatDate(status.expiresAt)}</dd>
            </div>
            <div className="rounded-[20px] border border-primary/15 bg-primary/5 p-4">
              <dt className="text-sm font-medium text-muted-foreground">Cập nhật gần nhất</dt>
              <dd className="mt-2 text-base font-semibold text-foreground">{formatDate(status.updatedAt)}</dd>
            </div>
            <div className="rounded-[20px] border border-primary/15 bg-primary/5 p-4">
              <dt className="text-sm font-medium text-muted-foreground">Lần thử refresh gần nhất</dt>
              <dd className="mt-2 text-base font-semibold text-foreground">{formatDate(status.lastRefreshAttemptAt)}</dd>
            </div>
            <div className="rounded-[20px] border border-primary/15 bg-primary/5 p-4">
              <dt className="text-sm font-medium text-muted-foreground">Cooldown Canva</dt>
              <dd className="mt-2 text-base font-semibold text-foreground">{formatDate(status.cooldownUntil)}</dd>
            </div>
          </dl>

          {status.lastRefreshError ? (
            <div className="rounded-[20px] border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              {status.lastRefreshError}
            </div>
          ) : null}

          <form action={startCanvaConnect}>
            <Button type="submit" className="shadow-[0_0_28px_rgba(41,218,245,0.24)]">
              {status.isConnected ? "Kết nối lại Canva" : "Kết nối Canva"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
