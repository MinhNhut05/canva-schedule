"use client";

import { useEffect } from "react";
import { toast } from "sonner";

interface LoginToastProps {
  reason?: string;
}

export function LoginToast({ reason }: LoginToastProps) {
  useEffect(() => {
    if (reason === "auth-required") {
      toast.info("Vui lòng đăng nhập");
    }
  }, [reason]);

  return null;
}
