"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { ArrowRight, Eye, EyeOff, Loader2, Lock, TriangleAlert, User } from "lucide-react";
import { loginAction } from "./actions";

interface LoginFormProps {
  callbackUrl: string;
  error?: string;
}

export function LoginForm({ callbackUrl, error }: LoginFormProps) {
  const [state, formAction, isPending] = useActionState(loginAction, {
    error: error || null,
  });
  const [show, setShow] = useState(false);
  const [shake, setShake] = useState(false);
  const prevPending = useRef(false);

  useEffect(() => {
    if (prevPending.current && !isPending && state.error) {
      setShake(true);
      const id = setTimeout(() => setShake(false), 450);
      prevPending.current = isPending;
      return () => clearTimeout(id);
    }
    prevPending.current = isPending;
  }, [isPending, state.error]);

  const hasError = Boolean(state.error);

  return (
    <form action={formAction} noValidate>
      <input type="hidden" name="callbackUrl" value={callbackUrl} />

      {hasError ? (
        <div className={`alert${shake ? " shake" : ""}`} role="alert">
          <TriangleAlert />
          <span className="body">
            {state.error === "CredentialsSignin"
              ? "Sai tên đăng nhập hoặc mật khẩu. Vui lòng kiểm tra lại thông tin truy cập."
              : state.error}
          </span>
        </div>
      ) : null}

      <div>
        <label className="label" htmlFor="username">
          Tên đăng nhập
        </label>
        <div className={`field${hasError ? " err" : ""}`}>
          <span className="lead">
            <User />
          </span>
          <input
            id="username"
            name="username"
            className="input"
            type="text"
            required
            autoComplete="username"
            placeholder="Nhập tên đăng nhập"
            disabled={isPending}
          />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="password">
          Mật khẩu
        </label>
        <div className={`field has-toggle${hasError ? " err" : ""}`}>
          <span className="lead">
            <Lock />
          </span>
          <input
            id="password"
            name="password"
            className="input"
            type={show ? "text" : "password"}
            required
            autoComplete="current-password"
            placeholder="Nhập mật khẩu"
            disabled={isPending}
          />
          <button
            type="button"
            className="peek"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            tabIndex={-1}
          >
            {show ? <EyeOff /> : <Eye />}
          </button>
        </div>
      </div>

      <button className="btn" type="submit" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="spin" /> Đang đăng nhập...
          </>
        ) : (
          <>
            Vào không gian làm việc <ArrowRight />
          </>
        )}
      </button>
    </form>
  );
}
