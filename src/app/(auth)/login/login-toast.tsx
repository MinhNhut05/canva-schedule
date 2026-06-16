"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Clock, X } from "lucide-react";

export function LoginToast() {
  const reason = useSearchParams().get("reason");
  const [open, setOpen] = useState(true);

  if (!reason || !open) {
    return null;
  }

  return (
    <div className="toast" role="status">
      <Clock className="lead" />
      <span className="body">Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.</span>
      <button type="button" className="x" onClick={() => setOpen(false)} aria-label="Đóng">
        <X />
      </button>
    </div>
  );
}
