import type * as React from "react";

import { cn } from "@/lib/utils";

function WarningIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4 shrink-0 text-[#F59E0B]"
    >
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
    </svg>
  );
}

interface FlaggedFieldProps {
  children: React.ReactNode;
  isFlagged: boolean;
  helperText?: string;
}

export function FlaggedField({
  children,
  isFlagged,
  helperText,
}: FlaggedFieldProps) {
  if (!isFlagged) {
    return <>{children}</>;
  }

  return (
    <div className={cn("rounded-lg border-2 border-[#F59E0B] bg-[#FFFBEB] p-3")}>
      {children}
      {helperText ? (
        <div className="mt-2 flex items-start gap-1.5">
          <WarningIcon />
          <p className="text-sm text-[#92400E]">{helperText}</p>
        </div>
      ) : null}
    </div>
  );
}
