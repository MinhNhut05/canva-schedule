"use client";

import { useActionState } from "react";
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
    <form action={formAction}>
      <input type="hidden" name="callbackUrl" value={callbackUrl} />

      {state.error && (
        <div
          role="alert"
          style={{
            padding: "0.75rem",
            marginBottom: "1rem",
            backgroundColor: "#fee2e2",
            color: "#dc2626",
            borderRadius: "4px",
            fontSize: "0.875rem",
          }}
        >
          {state.error === "CredentialsSignin"
            ? "Sai tên đăng nhập hoặc mật khẩu"
            : state.error}
        </div>
      )}

      <div style={{ marginBottom: "1rem" }}>
        <label
          htmlFor="username"
          style={{
            display: "block",
            marginBottom: "0.25rem",
            fontWeight: 500,
            fontSize: "0.875rem",
          }}
        >
          Tên đăng nhập
        </label>
        <input
          id="username"
          name="username"
          type="text"
          required
          autoComplete="username"
          style={{
            width: "100%",
            padding: "0.5rem 0.75rem",
            border: "1px solid #d1d5db",
            borderRadius: "4px",
            fontSize: "1rem",
            boxSizing: "border-box",
          }}
        />
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <label
          htmlFor="password"
          style={{
            display: "block",
            marginBottom: "0.25rem",
            fontWeight: 500,
            fontSize: "0.875rem",
          }}
        >
          Mật khẩu
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          style={{
            width: "100%",
            padding: "0.5rem 0.75rem",
            border: "1px solid #d1d5db",
            borderRadius: "4px",
            fontSize: "1rem",
            boxSizing: "border-box",
          }}
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        style={{
          width: "100%",
          padding: "0.75rem",
          backgroundColor: isPending ? "#93c5fd" : "#2563eb",
          color: "white",
          border: "none",
          borderRadius: "4px",
          fontSize: "1rem",
          fontWeight: 500,
          cursor: isPending ? "not-allowed" : "pointer",
        }}
      >
        {isPending ? "Đang đăng nhập..." : "Đăng nhập"}
      </button>
    </form>
  );
}
