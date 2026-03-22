"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

export function LoginToast() {
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason");
  const shown = useRef(false);

  useEffect(() => {
    if (reason === "auth-required" && !shown.current) {
      shown.current = true;
      // Small delay to ensure Toaster is mounted
      setTimeout(() => {
        toast.info("Vui lòng đăng nhập");
      }, 100);
    }
  }, [reason]);

  return null;
}
