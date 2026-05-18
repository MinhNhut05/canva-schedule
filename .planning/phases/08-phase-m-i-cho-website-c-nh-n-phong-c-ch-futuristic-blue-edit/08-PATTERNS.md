# Phase 8: Personal Website Visual System - Pattern Map

**Mapped:** 2026-04-22
**Files analyzed:** 11
**Analogs found:** 10 / 11

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/app/globals.css` | config | transform | `src/app/globals.css` | exact |
| `src/app/layout.tsx` | provider | request-response | `src/app/layout.tsx` | exact |
| `src/components/ui/button.tsx` | component | request-response | `src/components/ui/button.tsx` | exact |
| `src/components/ui/card.tsx` | component | request-response | `src/components/ui/card.tsx` | exact |
| `src/components/ui/badge.tsx` | component | request-response | `src/components/ui/badge.tsx` | exact |
| `src/components/ui/input.tsx` | component | request-response | `src/components/ui/input.tsx` | exact |
| `src/components/ui/textarea.tsx` | component | request-response | `src/components/ui/textarea.tsx` | exact |
| `src/components/ui/sheet.tsx` | component | request-response | `src/components/ui/sheet.tsx` | exact |
| `src/components/ui/tooltip.tsx` | component | request-response | `src/components/ui/tooltip.tsx` | exact |
| `src/components/ui/alert.tsx` | component | request-response | `src/components/ui/alert.tsx` | exact |
| `src/components/ui/alert-dialog.tsx` | component | request-response | `src/components/ui/alert-dialog.tsx` | exact |
| `tests/e2e/personal-website-visual-system.spec.ts` | test | request-response | `tests/e2e/auth.spec.ts` | role-match |
| `src/components/personal-site/*` or proof route | component | request-response | `src/components/app-sidebar.tsx` | partial |

## Pattern Assignments

### `src/app/globals.css` (config, transform)

**Analog:** `src/app/globals.css`

**Imports + token bridge pattern** (lines 1-49):
```css
@import "tailwindcss";

:root {
  --background: 210 40% 98%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 222.2 84% 4.9%;
  --primary: 217 91% 60%;
  --primary-foreground: 210 40% 98%;
  --secondary: 0 0% 100%;
  --secondary-foreground: 222.2 47.4% 11.2%;
  --muted: 210 40% 96.1%;
  --muted-foreground: 215 16% 46.9%;
  --accent: 217 91% 60%;
  --accent-foreground: 210 40% 98%;
  --destructive: 0 84% 60%;
  --destructive-foreground: 210 40% 98%;
  --border: 214.3 31.8% 83.9%;
  --input: 214.3 31.8% 83.9%;
  --ring: 217 91% 60%;
  --radius: 0.5rem;
}

@theme inline {
  --color-background: hsl(var(--background));
  --color-foreground: hsl(var(--foreground));
  --color-card: hsl(var(--card));
  --color-card-foreground: hsl(var(--card-foreground));
  --color-popover: hsl(var(--popover));
  --color-popover-foreground: hsl(var(--popover-foreground));
  --color-primary: hsl(var(--primary));
  --color-primary-foreground: hsl(var(--primary-foreground));
  --color-secondary: hsl(var(--secondary));
  --color-secondary-foreground: hsl(var(--secondary-foreground));
  --color-muted: hsl(var(--muted));
  --color-muted-foreground: hsl(var(--muted-foreground));
  --color-accent: hsl(var(--accent));
  --color-accent-foreground: hsl(var(--accent-foreground));
  --color-destructive: hsl(var(--destructive));
  --color-destructive-foreground: hsl(var(--destructive-foreground));
  --color-border: hsl(var(--border));
  --color-input: hsl(var(--input));
  --color-ring: hsl(var(--ring));
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}
```

**Global base styling pattern** (lines 51-59):
```css
* {
  border-color: hsl(var(--border));
}

body {
  background: hsl(var(--background));
  color: hsl(var(--foreground));
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
}
```

**Copy from this file:** keep the `:root` token section + `@theme inline` bridge shape intact; Phase 8 should replace values, add font tokens, and add premium surface/effect globals without changing the overall CSS contract.

---

### `src/app/layout.tsx` (provider, request-response)

**Analog:** `src/app/layout.tsx`

**Metadata + global CSS import pattern** (lines 0-8):
```tsx
import type { Metadata } from "next";
import { Toaster } from "sonner";

import "./globals.css";

export const metadata: Metadata = {
  title: "SileTravel",
  description: "SOHA Travel - Tour Program to Canva Design",
};
```

**Root shell pattern** (lines 10-22):
```tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
```

**Copy from this file:** preserve root metadata export, `./globals.css` import, `<html lang="vi">`, and the global `<Toaster />`. Phase 8 font wiring should extend this pattern with `next/font/google` variables rather than replacing the shell shape.

---

### `src/components/ui/button.tsx` (component, request-response)

**Analog:** `src/components/ui/button.tsx`

**Imports + variant map pattern** (lines 0-25):
```tsx
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
    "bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring",
  secondary:
    "bg-secondary text-secondary-foreground hover:bg-muted focus-visible:ring-ring",
  outline:
    "border border-input bg-background hover:bg-muted focus-visible:ring-ring",
  destructive:
    "bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-ring",
  ghost: "hover:bg-muted hover:text-foreground focus-visible:ring-ring",
  link: "text-primary underline-offset-4 hover:underline focus-visible:ring-ring",
};
```

**Shared button utility pattern** (lines 27-58):
```tsx
const sizeClasses: Record<ButtonSize, string> = {
  default: "h-10 px-4 py-2",
  sm: "h-9 rounded-md px-3",
  lg: "h-11 rounded-md px-8",
  icon: "size-10",
};

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
```

**ForwardRef wrapper pattern** (lines 60-86):
```tsx
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
```

**Copy from this file:** keep `variantClasses` + `sizeClasses` + `buttonVariants()` architecture. Phase 8 should restyle class strings only, preserving `asChild`, `forwardRef`, focus-visible behavior, and disabled behavior.

---

### `src/components/ui/card.tsx` (component, request-response)

**Analog:** `src/components/ui/card.tsx`

**Base container pattern** (lines 0-15):
```tsx
import * as React from "react";

import { cn } from "@/lib/utils";

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-xl border bg-card text-card-foreground shadow-sm",
        className,
      )}
      {...props}
    />
  ),
);
```

**Subcomponent composition pattern** (lines 18-55):
```tsx
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
));

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3 ref={ref} className={cn("text-xl font-semibold leading-none tracking-tight", className)} {...props} />
));

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
));
```

**Copy from this file:** keep the multi-export primitive family (`Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`) and ref-safe wrapper structure. Phase 8 should update radius, shadow, border, spacing, and title typography in-place.

---

### `src/components/ui/badge.tsx` (component, request-response)

**Analog:** `src/components/ui/badge.tsx`

**Variant map pattern** (lines 0-12):
```tsx
import * as React from "react";

import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

const variantClasses: Record<BadgeVariant, string> = {
  default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/90",
  secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-muted",
  destructive:
    "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/90",
  outline: "text-foreground",
};
```

**Thin wrapper pattern** (lines 18-29):
```tsx
function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
```

**Copy from this file:** preserve the compact variant-based API; Phase 8 should map this to thin editorial-tech tags by changing only token-driven classes, not component shape.

---

### `src/components/ui/input.tsx` (component, request-response)

**Analog:** `src/components/ui/input.tsx`

**ForwardRef input pattern** (lines 0-20):
```tsx
import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
```

**Copy from this file:** keep the single-wrapper pattern, file-input subselectors, and focus-visible contract. Phase 8 should only soften radius/token styling and keep inputs visually quieter than buttons/cards.

---

### `src/components/ui/textarea.tsx` (component, request-response)

**Analog:** `src/components/ui/textarea.tsx`

**Textarea slot pattern** (lines 0-17):
```tsx
import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}
```

**Copy from this file:** use this newer slot-based textarea shape if Phase 8 includes textarea restyling alongside inputs; keep `aria-invalid` and focus-ring behavior.

---

### `src/components/ui/sheet.tsx` (component, request-response)

**Analog:** `src/components/ui/sheet.tsx`

**Radix composition pattern** (lines 0-12):
```tsx
"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";

import { cn } from "@/lib/utils";

const Sheet = DialogPrimitive.Root;
const SheetTrigger = DialogPrimitive.Trigger;
const SheetClose = DialogPrimitive.Close;
const SheetPortal = DialogPrimitive.Portal;
```

**Overlay + content pattern** (lines 12-54):
```tsx
const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn("fixed inset-0 z-50 bg-black/50", className)}
    {...props}
  />
));

const SheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  SheetContentProps
>(({ className, children, side = "right", ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed z-50 bg-background p-6 shadow-lg transition ease-in-out",
        sideClasses[side],
        className,
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </SheetPortal>
));
```

**Copy from this file:** keep the Radix exports and `sideClasses` structure. Phase 8 nav overlay styling should change overlay opacity, blur, border, and surfaces without changing behavior wiring.

---

### `src/components/ui/tooltip.tsx` (component, request-response)

**Analog:** `src/components/ui/tooltip.tsx`

**Provider + content pattern** (lines 7-18, 32-54):
```tsx
function TooltipProvider({
  delayDuration = 0,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...props}
    />
  )
}
```

```tsx
function TooltipContent({
  className,
  sideOffset = 0,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          "z-50 w-fit origin-(--radix-tooltip-content-transform-origin) animate-in rounded-md bg-foreground px-3 py-1.5 text-xs text-balance text-background fade-in-0 zoom-in-95 ...",
          className
        )}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow className="z-50 size-2.5 ... bg-foreground fill-foreground" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )
}
```

**Copy from this file:** preserve data-slot attributes and portal structure; Phase 8 should only retone tooltip surfaces to the dark premium system.

---

### `src/components/ui/alert.tsx` (component, request-response)

**Analog:** `src/components/ui/alert.tsx`

**Variant pattern** (lines 4-15):
```tsx
type AlertVariant = "default" | "destructive";

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
}

const variantClasses: Record<AlertVariant, string> = {
  default:
    "border-border bg-card text-card-foreground",
  destructive:
    "border-destructive/50 bg-destructive/5 text-destructive",
};
```

**Accessible alert wrapper** (lines 17-29):
```tsx
const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <div
      ref={ref}
      role="alert"
      className={cn(
        "relative w-full rounded-lg border px-4 py-3 text-sm",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  ),
);
```

**Copy from this file:** keep `role="alert"`, variant map, and the `AlertTitle`/`AlertDescription` split. Phase 8 shared empty/error states should restyle this primitive, not replace it.

---

### `src/components/ui/alert-dialog.tsx` (component, request-response)

**Analog:** `src/components/ui/alert-dialog.tsx`

**Cross-primitive reuse pattern** (lines 3-7):
```tsx
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
```

**Overlay + content pattern** (lines 14-44):
```tsx
const AlertDialogOverlay = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out ...",
      className,
    )}
    {...props}
  />
));

const AlertDialogContent = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>
>(({ className, ...props }, ref) => (
  <AlertDialogPortal>
    <AlertDialogOverlay />
    <AlertDialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 ... sm:rounded-lg",
        className,
      )}
      {...props}
    />
  </AlertDialogPortal>
));
```

**Action button reuse pattern** (lines 101-123):
```tsx
const AlertDialogAction = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Action>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Action
    ref={ref}
    className={cn(buttonVariants(), className)}
    {...props}
  />
));

const AlertDialogCancel = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Cancel>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Cancel
    ref={ref}
    className={cn(buttonVariants({ variant: "outline" }), className)}
    {...props}
  />
));
```

**Copy from this file:** keep the composition where dialog actions inherit button styling through `buttonVariants()`. Phase 8 destructive confirmation styling should flow from button/dialog primitives together.

---

### `tests/e2e/personal-website-visual-system.spec.ts` (test, request-response)

**Analog:** `tests/e2e/auth.spec.ts`

**Playwright suite structure** (lines 0-15):
```ts
import { test, expect } from "@playwright/test";

test.describe("Authentication Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test("unauthenticated visit to /dashboard redirects to /login with callbackUrl and reason", async ({
    page,
  }) => {
    await page.goto("/dashboard");
```

**Assertion style pattern** (lines 20-35):
```ts
await expect(page).toHaveURL(/\/login/);
const url = new URL(page.url());
expect(url.searchParams.get("reason")).toBe("auth-required");
expect(url.searchParams.get("callbackUrl")).toContain("/dashboard");

const toast = page.getByText("Vui lòng đăng nhập");
await expect(toast).toBeVisible({ timeout: 10000 });
```

**Copy from this file:** use `import { test, expect }`, `test.describe`, plain `await page.goto(...)`, and `await expect(...)` style. Phase 8 e2e spec should mirror this structure for surface split, font contract, primitive variants, and focus/hover smoke checks.

---

### `src/components/personal-site/*` or proof route (component, request-response)

**Analog:** `src/components/app-sidebar.tsx`

**Client component + primitive imports pattern** (lines 0-15):
```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
```

**Consumer-side primitive composition pattern** (lines 190-214):
```tsx
<Sheet open={open} onOpenChange={setOpen}>
  <SheetTrigger asChild>
    <Button
      variant="outline"
      size="icon"
      className="focus-visible:ring-2 focus-visible:ring-primary"
      aria-label="Mở điều hướng"
    >
      <MenuIcon />
    </Button>
  </SheetTrigger>
  <SheetContent side="left" className="w-60 p-0 sm:max-w-60">
    <SheetTitle className="sr-only">Điều hướng ứng dụng</SheetTitle>
    <SheetDescription className="sr-only">
      Mở thanh điều hướng để chuyển giữa bảng điều khiển và tải tài liệu.
    </SheetDescription>
```

**Copy from this file:** if planner chooses a proof surface, compose it from shared primitives in a client component like this, using variant props and small `className` overrides instead of bespoke raw elements.

---

## Shared Patterns

### Semantic token bridge
**Source:** `/home/minhnhut_dev/projects/siletravel/.claude/worktrees/agent-a9d0a3c3/src/app/globals.css`
**Apply to:** `src/app/globals.css`, all restyled primitives
```css
:root { ...semantic HSL variables... }

@theme inline {
  --color-background: hsl(var(--background));
  --color-foreground: hsl(var(--foreground));
  --color-primary: hsl(var(--primary));
  --color-border: hsl(var(--border));
  --radius-lg: var(--radius);
}
```
Use the exact same two-layer contract: semantic CSS vars first, Tailwind `@theme inline` bridge second.

### Root shell wiring
**Source:** `/home/minhnhut_dev/projects/siletravel/.claude/worktrees/agent-a9d0a3c3/src/app/layout.tsx`
**Apply to:** `src/app/layout.tsx`
```tsx
import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";
```
Add font variables here, but do not remove global CSS import or toaster mount.

### Primitive variant architecture
**Source:** `/home/minhnhut_dev/projects/siletravel/.claude/worktrees/agent-a9d0a3c3/src/components/ui/button.tsx`, `/src/components/ui/badge.tsx`, `/src/components/ui/alert.tsx`
**Apply to:** button, badge, alert, alert-dialog
```tsx
const variantClasses: Record<Variant, string> = {
  default: "...",
  secondary: "...",
  destructive: "...",
};
```
Keep variant maps as the styling control point; do not scatter Phase 8 design classes across consumers.

### Focus-visible and disabled states
**Source:** `/home/minhnhut_dev/projects/siletravel/.claude/worktrees/agent-a9d0a3c3/src/components/ui/button.tsx` lines 53-57, `/src/components/ui/input.tsx` lines 9-15, `/src/components/ui/textarea.tsx` lines 8-13
**Apply to:** all interactive primitives
```tsx
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50
```
Phase 8 visual system must preserve visible focus and disabled semantics while retheming colors/radius/glow.

### Radix wrapper preservation
**Source:** `/home/minhnhut_dev/projects/siletravel/.claude/worktrees/agent-a9d0a3c3/src/components/ui/sheet.tsx`, `/src/components/ui/tooltip.tsx`, `/src/components/ui/alert-dialog.tsx`
**Apply to:** sheet, tooltip, alert-dialog
```tsx
const Sheet = DialogPrimitive.Root;
...
<SheetPortal>
  <SheetOverlay />
  <DialogPrimitive.Content ... />
</SheetPortal>
```
Keep Radix behavior wrappers intact; only restyle surfaces, overlay opacity, blur, borders, and motion.

### Playwright smoke-test style
**Source:** `/home/minhnhut_dev/projects/siletravel/.claude/worktrees/agent-a9d0a3c3/tests/e2e/auth.spec.ts`
**Apply to:** `tests/e2e/personal-website-visual-system.spec.ts`
```ts
import { test, expect } from "@playwright/test";

test.describe("...", () => {
  test("...", async ({ page }) => {
    await page.goto("...");
    await expect(page.locator("...")).toBeVisible();
  });
});
```

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/components/personal-site/*` exact proof components | component | request-response | No existing `personal-site` or visual-system showcase component family exists yet; use shared primitive consumer pattern plus Phase 8 docs as source of truth. |

## Metadata

**Analog search scope:** `/home/minhnhut_dev/projects/siletravel/.claude/worktrees/agent-a9d0a3c3/src/app`, `/home/minhnhut_dev/projects/siletravel/.claude/worktrees/agent-a9d0a3c3/src/components/ui`, `/home/minhnhut_dev/projects/siletravel/.claude/worktrees/agent-a9d0a3c3/src/components`, `/home/minhnhut_dev/projects/siletravel/.claude/worktrees/agent-a9d0a3c3/tests/e2e`, `/home/minhnhut_dev/projects/siletravel/.claude/worktrees/agent-a9d0a3c3/.planning/phases/03-structured-ai-extraction-rules-human-review`
**Files scanned:** 15
**Pattern extraction date:** 2026-04-22
