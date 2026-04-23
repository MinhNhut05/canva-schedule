import * as React from "react";

import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

const variantClasses: Record<BadgeVariant, string> = {
  default:
    "border-border-light bg-surface-panel-cool text-foreground/90 hover:bg-surface-panel",
  secondary:
    "border-border-light bg-surface-panel-glass text-muted-foreground hover:bg-surface-panel",
  destructive:
    "border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/15",
  outline: "border-border-light bg-transparent text-muted-foreground",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant;
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.08em] transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}

export { Badge };
