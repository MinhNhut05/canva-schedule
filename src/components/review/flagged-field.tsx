import type * as React from "react";
import { AlertTriangle } from "lucide-react";

interface FlaggedFieldProps {
  children: React.ReactNode;
  isFlagged: boolean;
  helperText?: string;
}

export function FlaggedField({ children, isFlagged, helperText }: FlaggedFieldProps) {
  if (!isFlagged) {
    return <>{children}</>;
  }

  return (
    <div className="rv-flag">
      <span className="rv-fbadge">
        <AlertTriangle /> Cần xem lại
      </span>
      {children}
      {helperText ? (
        <div className="rv-fnote">
          <AlertTriangle />
          <span>{helperText}</span>
        </div>
      ) : null}
    </div>
  );
}
