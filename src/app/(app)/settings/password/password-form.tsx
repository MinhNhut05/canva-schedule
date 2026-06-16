"use client";

import { useActionState, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
  Info,
  KeyRound,
  Loader2,
  Lock,
  XCircle,
} from "lucide-react";

import { changePasswordAction } from "./actions";

type FieldKey = "current" | "new" | "confirm";
type FieldErrors = Record<FieldKey, string | null>;

const NO_ERRORS: FieldErrors = { current: null, new: null, confirm: null };

// Mirrors assertPasswordPolicy in src/lib/password.ts: ≥8 chars, ≥1 letter, ≥1 number.
function validateNewPassword(value: string): string | null {
  if (!value) return "Vui lòng nhập mật khẩu mới.";
  if (value.length < 8) return "Mật khẩu mới cần tối thiểu 8 ký tự.";
  if (!/[a-zA-Z]/.test(value) || !/[0-9]/.test(value)) {
    return "Mật khẩu mới cần gồm cả chữ cái và số.";
  }
  return null;
}

interface PwFieldProps {
  id: string;
  name: string;
  label: string;
  placeholder: string;
  autoComplete: string;
  hint?: string;
  error: string | null;
  show: boolean;
  onToggle: () => void;
  onClear: () => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
}

function PwField({
  id,
  name,
  label,
  placeholder,
  autoComplete,
  hint,
  error,
  show,
  onToggle,
  onClear,
  onBlur,
}: PwFieldProps) {
  return (
    <div className="fld">
      <label className="label" htmlFor={id}>
        {label}
      </label>
      <div className={`field has-toggle${error ? " err" : ""}`}>
        <span className="lead">
          <Lock />
        </span>
        <input
          id={id}
          name={name}
          className="input"
          type={show ? "text" : "password"}
          required
          autoComplete={autoComplete}
          placeholder={placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={`${id}-hint`}
          onInput={onClear}
          onBlur={onBlur}
        />
        <button
          type="button"
          className="peek"
          onClick={onToggle}
          aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          tabIndex={-1}
        >
          {show ? <EyeOff /> : <Eye />}
        </button>
      </div>
      {error ? (
        <p id={`${id}-hint`} className="hint err">
          <AlertTriangle /> {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="hint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function PasswordForm() {
  const [state, formAction, isPending] = useActionState(changePasswordAction, {
    success: false,
    error: null,
  });
  const [show, setShow] = useState({ current: false, new: false, confirm: false });
  const [errors, setErrors] = useState<FieldErrors>(NO_ERRORS);

  const toggle = (key: FieldKey) => setShow((prev) => ({ ...prev, [key]: !prev[key] }));
  const clear = (key: FieldKey) =>
    setErrors((prev) => (prev[key] ? { ...prev, [key]: null } : prev));
  const setError = (key: FieldKey, value: string | null) =>
    setErrors((prev) => ({ ...prev, [key]: value }));

  const handleNewBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (value) setError("new", validateNewPassword(value));
  };

  const handleConfirmBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (!value) return;
    const form = event.target.form;
    const newValue =
      (form?.elements.namedItem("newPassword") as HTMLInputElement | null)?.value ?? "";
    setError(
      "confirm",
      value !== newValue ? "Mật khẩu xác nhận chưa khớp với mật khẩu mới." : null
    );
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const form = event.currentTarget;
    const current = (form.elements.namedItem("currentPassword") as HTMLInputElement).value;
    const newPassword = (form.elements.namedItem("newPassword") as HTMLInputElement).value;
    const confirm = (form.elements.namedItem("confirmPassword") as HTMLInputElement).value;

    const next: FieldErrors = {
      current: current ? null : "Vui lòng nhập mật khẩu hiện tại.",
      new: validateNewPassword(newPassword),
      confirm: !confirm
        ? "Vui lòng nhập lại mật khẩu mới."
        : confirm !== newPassword
          ? "Mật khẩu xác nhận chưa khớp với mật khẩu mới."
          : null,
    };

    if (next.current || next.new || next.confirm) {
      event.preventDefault();
      setErrors(next);
    }
  };

  return (
    <section className="card pw-card">
      <div className="card-head">
        <span className="badge green" aria-hidden="true">
          <KeyRound />
        </span>
        <div className="ct">
          <h2>Đổi mật khẩu</h2>
          <p>
            Mật khẩu mới nên có ít nhất 8 ký tự và kết hợp chữ cái với số để giảm rủi ro truy cập
            ngoài ý muốn.
          </p>
        </div>
      </div>

      {state.success ? (
        <div className="alert ok" role="status">
          <CheckCircle2 />
          <div>
            <p className="at">Đổi mật khẩu thành công</p>
            <p className="ab">Tài khoản đã được cập nhật với thông tin truy cập mới.</p>
          </div>
        </div>
      ) : null}

      {state.error ? (
        <div className="alert bad" role="alert">
          <XCircle />
          <div>
            <p className="at">Không thể đổi mật khẩu</p>
            <p className="ab">{state.error}</p>
          </div>
        </div>
      ) : null}

      <form action={formAction} onSubmit={handleSubmit} noValidate>
        <div className="fields">
          <PwField
            id="currentPassword"
            name="currentPassword"
            label="Mật khẩu hiện tại"
            placeholder="Nhập mật khẩu hiện tại"
            autoComplete="current-password"
            error={errors.current}
            show={show.current}
            onToggle={() => toggle("current")}
            onClear={() => clear("current")}
          />
          <PwField
            id="newPassword"
            name="newPassword"
            label="Mật khẩu mới"
            placeholder="Nhập mật khẩu mới"
            autoComplete="new-password"
            hint="Tối thiểu 8 ký tự, nên gồm chữ cái và số."
            error={errors.new}
            show={show.new}
            onToggle={() => toggle("new")}
            onClear={() => clear("new")}
            onBlur={handleNewBlur}
          />
          <PwField
            id="confirmPassword"
            name="confirmPassword"
            label="Xác nhận mật khẩu mới"
            placeholder="Nhập lại mật khẩu mới"
            autoComplete="new-password"
            hint="Nhập lại đúng mật khẩu mới để xác nhận thay đổi."
            error={errors.confirm}
            show={show.confirm}
            onToggle={() => toggle("confirm")}
            onClear={() => clear("confirm")}
            onBlur={handleConfirmBlur}
          />
        </div>

        <div className="helper-note">
          <Info />
          <span>
            Sau khi cập nhật, hãy dùng mật khẩu mới cho các phiên đăng nhập tiếp theo của bạn.
          </span>
        </div>

        <div className="actions">
          <button type="submit" className="btn" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="spin" /> Đang xử lý...
              </>
            ) : (
              "Cập nhật mật khẩu"
            )}
          </button>
        </div>
      </form>
    </section>
  );
}
