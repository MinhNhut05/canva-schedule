import Image from "next/image";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { MonitorDot } from "lucide-react";
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
    <div className="card">
      <div className="card-brand">
        <Image src="/front-flow/soha-logo.png" alt="SOHA Travel" width={51} height={36} priority />
        <span className="nm">SOHA Travel</span>
      </div>

      <div className="badge-ws">
        <MonitorDot /> SOHA workspace
      </div>

      <h2>Đăng nhập</h2>
      <p className="sub">
        Truy cập không gian xử lý tài liệu để bắt đầu tải lên, rà soát nội dung và theo dõi các thiết kế Canva.
      </p>

      <Suspense>
        <LoginToast />
      </Suspense>

      <LoginForm callbackUrl={params.callbackUrl || "/upload"} error={params.error} />

      <p className="helper">
        Cần cấp quyền truy cập? <b>Liên hệ quản trị viên của bạn.</b>
      </p>
    </div>
  );
}
