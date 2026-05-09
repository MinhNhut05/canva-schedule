import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { LoginForm } from "./login-form";
import { LoginToast } from "./login-toast";

interface LoginPageProps {
  searchParams: Promise<{
    callbackUrl?: string;
    reason?: string;
    error?: string;
  }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth();
  const params = await searchParams;

  if (session?.user) {
    redirect(params.callbackUrl || "/upload");
  }

  return (
    <Card className="surface-panel-glass w-full max-w-[460px] border-semantic-light shadow-semantic-light">
      <CardHeader className="space-y-4 border-b border-semantic-light bg-surface-panel-cool/60">
        <Badge variant="outline" className="w-fit border-primary/15 bg-primary/5 text-primary">
          SileTravel workspace
        </Badge>
        <div className="space-y-2">
          <CardTitle className="text-[2rem] leading-tight text-foreground">Đăng nhập</CardTitle>
          <CardDescription className="max-w-sm text-base leading-7 text-muted-foreground">
            Truy cập không gian xử lý tài liệu để bắt đầu tải lên, rà soát nội dung và theo dõi các thiết kế Canva.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 p-6 sm:p-7">
        <div className="space-y-1">
          <p className="text-lg font-semibold text-foreground">SOHA Travel</p>
          <p className="text-sm leading-6 text-muted-foreground">
            Điểm vào an toàn cho quy trình upload, review và điều phối nội dung.
          </p>
        </div>

        <Suspense>
          <LoginToast />
        </Suspense>
        <LoginForm callbackUrl={params.callbackUrl || "/upload"} error={params.error} />
      </CardContent>
    </Card>
  );
}
