---
phase: 08-phase-m-i-cho-website-c-nh-n-phong-c-ch-futuristic-blue-edit
reviewed: 2026-04-23T00:00:00Z
depth: standard
files_reviewed: 13
files_reviewed_list:
  - /home/minhnhut_dev/projects/siletravel/.claude/worktrees/agent-af2e2b99/src/app/layout.tsx
  - /home/minhnhut_dev/projects/siletravel/.claude/worktrees/agent-af2e2b99/src/app/globals.css
  - /home/minhnhut_dev/projects/siletravel/.claude/worktrees/agent-af2e2b99/src/components/ui/button.tsx
  - /home/minhnhut_dev/projects/siletravel/.claude/worktrees/agent-af2e2b99/src/components/ui/card.tsx
  - /home/minhnhut_dev/projects/siletravel/.claude/worktrees/agent-af2e2b99/src/components/ui/badge.tsx
  - /home/minhnhut_dev/projects/siletravel/.claude/worktrees/agent-af2e2b99/src/components/ui/input.tsx
  - /home/minhnhut_dev/projects/siletravel/.claude/worktrees/agent-af2e2b99/src/components/ui/textarea.tsx
  - /home/minhnhut_dev/projects/siletravel/.claude/worktrees/agent-af2e2b99/src/components/ui/sheet.tsx
  - /home/minhnhut_dev/projects/siletravel/.claude/worktrees/agent-af2e2b99/src/components/ui/tooltip.tsx
  - /home/minhnhut_dev/projects/siletravel/.claude/worktrees/agent-af2e2b99/src/components/ui/alert.tsx
  - /home/minhnhut_dev/projects/siletravel/.claude/worktrees/agent-af2e2b99/src/components/ui/alert-dialog.tsx
  - /home/minhnhut_dev/projects/siletravel/.claude/worktrees/agent-af2e2b99/src/components/app-sidebar.tsx
  - /home/minhnhut_dev/projects/siletravel/.claude/worktrees/agent-af2e2b99/src/app/(app)/history/page.tsx
findings:
  critical: 0
  high: 1
  medium: 2
  low: 1
  total: 4
status: issues_found
---

# Phase 08: Code Review Report

**Reviewed:** 2026-04-23T00:00:00Z
**Depth:** standard
**Files Reviewed:** 13
**Status:** issues_found

## Summary

Đã review các file UI/layout/navigation/history thuộc Phase 08 theo scope được cung cấp, tập trung vào bug, security, và code quality. Phần lớn UI primitives sạch, nhỏ gọn, và không thấy dấu hiệu injection/XSS hay hardcoded secret.

Các vấn đề đáng chú ý tập trung ở `history/page.tsx`: có một authorization gap (lộ dữ liệu lịch sử của người dùng khác) và một input parsing bug với query param `page` có thể làm vỡ truy vấn Prisma khi nhận giá trị không hợp lệ. Ngoài ra có một số type-safety issues mức độ thấp-trung bình trong các component forwardRef.

Lưu ý: file scope `/home/minhnhut_dev/projects/siletravel/.claude/worktrees/agent-af2e2b99/tests/e2e/personal-website-visual-system.spec.ts` không tồn tại trong worktree tại thời điểm review, nên không thể review file đó.

## High

### HI-01: History page trả về toàn bộ uploads cho mọi user đã đăng nhập

**File:** `/home/minhnhut_dev/projects/siletravel/.claude/worktrees/agent-af2e2b99/src/app/(app)/history/page.tsx:27-48`

**Issue:** Sau khi xác thực, page gọi `prisma.upload.findMany()` và `prisma.upload.count()` mà không filter theo `session.user.id` hoặc role. Nếu route này dành cho member thường, bất kỳ user đã đăng nhập nào cũng có thể xem lịch sử upload của tất cả người dùng khác.

**Impact:** Authorization gap. Đây là kiểu data exposure (rò rỉ dữ liệu) ở tầng application logic, có thể làm lộ tên file, thời gian tạo, trạng thái Canva artifact, và metadata tour của user khác.

**Suggested fix:** Chỉ query dữ liệu thuộc về current user, trừ khi role `admin` được phép xem toàn bộ.

```ts
const where = session.user.role === "admin"
  ? {}
  : { userId: session.user.id };

const [rows, totalCount] = await Promise.all([
  prisma.upload.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip,
    take: PAGE_SIZE,
    select: {
      id: true,
      originalFileName: true,
      createdAt: true,
      tourDuration: true,
      canvaArtifacts: {
        select: {
          artifactType: true,
          status: true,
          designId: true,
        },
        orderBy: { artifactType: "asc" },
      },
    },
  }),
  prisma.upload.count({ where }),
]);
```

## Medium

### MD-01: Query param `page` không được validate, có thể tạo `NaN` và làm hỏng truy vấn

**File:** `/home/minhnhut_dev/projects/siletravel/.claude/worktrees/agent-af2e2b99/src/app/(app)/history/page.tsx:23-26`

**Issue:** `const currentPage = Math.max(1, Number(params.page ?? 1));` không xử lý trường hợp `params.page` là chuỗi không phải số như `abc`, `1x`, hoặc giá trị quá lớn/không hữu hạn. Khi đó `Number(...)` có thể trả `NaN`, và `Math.max(1, NaN)` vẫn là `NaN`. `skip` sau đó cũng thành `NaN`.

**Impact:** Có thể gây runtime error hoặc Prisma validation error khi user truy cập URL với query param không hợp lệ, làm page fail thay vì degrade gracefully.

**Suggested fix:** Parse page number defensively và fallback về `1` nếu invalid.

```ts
const rawPage = Number.parseInt(params.page ?? "1", 10);
const currentPage = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
const skip = (currentPage - 1) * PAGE_SIZE;
```

### MD-02: `CardTitle` khai báo sai kiểu ref cho phần tử `h3`

**File:** `/home/minhnhut_dev/projects/siletravel/.claude/worktrees/agent-af2e2b99/src/components/ui/card.tsx:26-31`

**Issue:** `CardTitle` render ra `<h3>` nhưng generic của `forwardRef` lại dùng `HTMLParagraphElement`. Đây là type mismatch trong TypeScript.

**Impact:** Làm sai type contract của component, dễ gây bug khi caller truyền ref và kỳ vọng đúng DOM type. Đây là type-safety issue, không phải crash ngay nhưng có thể gây lỗi ngầm ở runtime integration hoặc IDE autocomplete sai.

**Suggested fix:** Đổi ref type sang `HTMLHeadingElement` để khớp với phần tử thực tế.

```ts
const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-xl font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));
```

## Low

### LW-01: `AlertTitle` cũng có type mismatch tương tự với heading ref

**File:** `/home/minhnhut_dev/projects/siletravel/.claude/worktrees/agent-af2e2b99/src/components/ui/alert.tsx:33-38`

**Issue:** `AlertTitle` render ra `<h5>` nhưng `forwardRef` lại khai báo `HTMLParagraphElement`.

**Impact:** Type contract không chính xác, làm giảm maintainability và có thể gây sai lệch khi dùng ref trong tương lai.

**Suggested fix:** Đồng bộ ref type với heading element thực tế.

```ts
const AlertTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5 ref={ref} className={cn("mb-1 font-semibold leading-none tracking-tight", className)} {...props} />
));
```

---

_Reviewed: 2026-04-23T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
