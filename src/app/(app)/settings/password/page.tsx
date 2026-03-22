"use client";

import { useActionState } from "react";
import { changePasswordAction } from "./actions";

export default function PasswordChangePage() {
  const [state, formAction, isPending] = useActionState(changePasswordAction, {
    success: false,
    error: null,
  });

  return (
    <div style={{ maxWidth: "500px" }}>
      <h2
        style={{
          fontSize: "1.25rem",
          fontWeight: "bold",
          marginBottom: "1.5rem",
        }}
      >
        Đổi mật khẩu
      </h2>

      {state.success && (
        <div
          role="status"
          style={{
            padding: "0.75rem",
            marginBottom: "1rem",
            backgroundColor: "#dcfce7",
            color: "#16a34a",
            borderRadius: "4px",
            fontSize: "0.875rem",
          }}
        >
          Đổi mật khẩu thành công!
        </div>
      )}

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
          {state.error}
        </div>
      )}

      <form action={formAction}>
        <div style={{ marginBottom: "1rem" }}>
          <label
            htmlFor="currentPassword"
            style={{
              display: "block",
              marginBottom: "0.25rem",
              fontWeight: 500,
              fontSize: "0.875rem",
            }}
          >
            Mật khẩu hiện tại
          </label>
          <input
            id="currentPassword"
            name="currentPassword"
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

        <div style={{ marginBottom: "1rem" }}>
          <label
            htmlFor="newPassword"
            style={{
              display: "block",
              marginBottom: "0.25rem",
              fontWeight: 500,
              fontSize: "0.875rem",
            }}
          >
            Mật khẩu mới
          </label>
          <input
            id="newPassword"
            name="newPassword"
            type="password"
            required
            autoComplete="new-password"
            style={{
              width: "100%",
              padding: "0.5rem 0.75rem",
              border: "1px solid #d1d5db",
              borderRadius: "4px",
              fontSize: "1rem",
              boxSizing: "border-box",
            }}
          />
          <p style={{ fontSize: "0.75rem", color: "#666", marginTop: "0.25rem" }}>
            Tối thiểu 8 ký tự, bao gồm chữ cái và số
          </p>
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <label
            htmlFor="confirmPassword"
            style={{
              display: "block",
              marginBottom: "0.25rem",
              fontWeight: 500,
              fontSize: "0.875rem",
            }}
          >
            Xác nhận mật khẩu mới
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            autoComplete="new-password"
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
            padding: "0.75rem 1.5rem",
            backgroundColor: isPending ? "#93c5fd" : "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "4px",
            fontSize: "1rem",
            fontWeight: 500,
            cursor: isPending ? "not-allowed" : "pointer",
          }}
        >
          {isPending ? "Đang xử lý..." : "Đổi mật khẩu"}
        </button>
      </form>
    </div>
  );
}
