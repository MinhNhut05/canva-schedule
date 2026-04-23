import * as React from "react";
import { Slot } from "@radix-ui/react-slot";

import { cn } from "@/lib/utils";

type ButtonVariant =
  | "default"
  | "secondary"
  | "outline"
  | "destructive"
  | "ghost"
  | "link";
type ButtonSize = "default" | "sm" | "lg" | "icon";

const variantClasses: Record<ButtonVariant, string> = {
  default:
    "bg-primary text-primary-foreground shadow-semantic-light transition-premium hover:-translate-y-[1px] hover:bg-primary/95 hover:glow-accent focus-visible:ring-ring",
  secondary:
    "border border-border-light bg-surface-panel-glass text-foreground shadow-semantic-light transition-premium hover:-translate-y-[1px] hover:bg-surface-panel focus-visible:ring-ring",
  outline:
    "border border-border-light bg-transparent text-foreground transition-premium hover:bg-surface-panel-cool focus-visible:ring-ring",
  destructive:
    "bg-destructive text-destructive-foreground shadow-semantic-light transition-premium hover:-translate-y-[1px] hover:bg-destructive/90 focus-visible:ring-ring",
  ghost:
    "text-foreground transition-premium hover:bg-surface-panel-cool hover:text-foreground focus-visible:ring-ring",
  link: "text-primary underline-offset-4 transition-premium hover:text-primary/80 hover:underline focus-visible:ring-ring",
};

const sizeClasses: Record<ButtonSize, string> = {
  default: "h-10 px-4 py-2",
  sm: "h-9 px-3",
  lg: "h-11 px-8",
  icon: "size-10",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
}

interface ButtonVariantsOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}

function buttonVariants({
  variant = "default",
  size = "default",
  className,
}: ButtonVariantsOptions = {}) {
  return cn(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
    variantClasses[variant],
    sizeClasses[size],
    className,
  );
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "default",
      asChild = false,
      type = "button",
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        className={buttonVariants({ variant, size, className })}
        ref={ref}
        type={type}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
