"use client";

import { useActionState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loginAction } from "./actions";

interface LoginFormProps {
  callbackUrl: string;
  error?: string;
}

export function LoginForm({ callbackUrl, error }: LoginFormProps) {
  const [state, formAction, isPending] = useActionState(loginAction, {
    error: error || null,
  });

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />

      {state.error ? (
        <Alert variant="destructive" className="rounded-[20px] border-destructive/35 bg-destructive/5">
          <AlertDescription>
            {state.error === "CredentialsSignin"
              ? "Sai tên đăng nhập hoặc mật khẩu. Vui lòng kiểm tra lại thông tin truy cập."
              : state.error}
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <label htmlFor="username" className="text-sm font-semibold text-foreground">
          Tên đăng nhập
        </label>
        <Input
          id="username"
          name="username"
          type="text"
          required
          autoComplete="username"
          className="h-12 rounded-2xl border-semantic-light bg-white text-slate-950 placeholder:text-slate-500"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-semibold text-foreground">
          Mật khẩu
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="h-12 rounded-2xl border-semantic-light bg-white text-slate-950 placeholder:text-slate-500"
        />
      </div>

      <div className="rounded-[20px] border border-semantic-light bg-primary/5 p-4">
        <p className="text-sm leading-6 text-muted-foreground">
          Sau khi đăng nhập, bạn sẽ vào thẳng luồng tải tài liệu để bắt đầu xử lý nhanh hơn.
        </p>
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className="glow-accent focus-ring-premium transition-premium hover-lift-subtle h-12 w-full"
      >
        {isPending ? "Đang đăng nhập..." : "Vào không gian làm việc"}
      </Button>
    </form>
  );
}
