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
    "bg-primary text-primary-foreground shadow-[0_0_30px_rgba(41,218,245,0.24)] transition-premium hover:-translate-y-[1px] hover:bg-accent-soft hover:glow-accent focus-visible:ring-ring",
  secondary:
    "border border-primary/20 bg-surface-panel-glass text-foreground shadow-semantic-light transition-premium hover:-translate-y-[1px] hover:border-primary/35 hover:bg-primary/10 focus-visible:ring-ring",
  outline:
    "border border-primary/25 bg-surface-panel-glass/60 text-foreground transition-premium hover:border-primary/45 hover:bg-primary/10 hover:text-primary focus-visible:ring-ring",
  destructive:
    "bg-destructive text-destructive-foreground shadow-[0_0_26px_rgba(244,63,94,0.18)] transition-premium hover:-translate-y-[1px] hover:bg-destructive/90 focus-visible:ring-ring",
  ghost:
    "text-foreground transition-premium hover:bg-primary/10 hover:text-primary focus-visible:ring-ring",
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
    "inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-premium disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
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
