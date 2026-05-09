import * as React from "react";

import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

const variantClasses: Record<BadgeVariant, string> = {
  default:
    "border-primary/30 bg-primary/15 text-primary shadow-[0_0_20px_rgba(41,218,245,0.12)] hover:bg-primary/20",
  secondary:
    "border-border-light bg-surface-panel-glass text-muted-foreground hover:border-primary/25 hover:bg-primary/10 hover:text-foreground",
  destructive:
    "border-destructive/35 bg-destructive/10 text-destructive hover:bg-destructive/15",
  outline: "border-primary/25 bg-transparent text-muted-foreground hover:text-primary",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant;
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return React.createElement("div", {
    className: cn(
      "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] transition-premium focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
      variantClasses[variant],
      className,
    ),
    ...props,
  });
}

export { Badge };
