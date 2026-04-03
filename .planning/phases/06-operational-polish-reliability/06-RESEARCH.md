# Phase 6: Operational Polish & Reliability — Research

**Gathered:** 2026-03-27
**Purpose:** Inform planning for 06-01 (UX) and 06-02 (reliability hardening)

---

## 1. What This Phase Must Deliver

Ba requirement chưa done: **UX-01**, **UX-02**, **SAFE-04**.

| Req    | Định nghĩa | Plan |
|--------|-----------|------|
| UX-01  | User thấy progress qua 5 bước: upload → extract → review → generate → done | 06-01 |
| UX-02  | User nhận error message dễ hiểu khi parsing, AI extraction, hoặc Canva generation thất bại | 06-01 |
| SAFE-04| App không crash ở volume ~10 tours/week, tôn trọng rate limit Canva/AI | 06-02 |

---

## 2. Codebase Inventory — Những Gì Đã Có

### 2.1 Reusable components & patterns sẵn có

| File | Điều cần biết | Tận dụng cho Phase 6 |
|------|--------------|----------------------|
| `src/lib/canva/client.ts` | `CanvaRateLimitError(cooldownSeconds)` parse sẵn `Retry-After` header từ 429 | Extend để write cooldown vào DB (D-10) |
| `src/lib/ai/extraction-client.ts` | `MAX_RETRIES=2`, backoff hiện tại là `attempt * 1000` (linear: 1s, 2s) | Đổi sang exponential `2^(attempt-1)*1000` (1s, 2s, 4s) — D-11 |
| `src/components/review/review-page.tsx` | `isRateLimited`, `cooldownMinutes` là **client-only state** (không persist, không global) | Phase 6 cần upgrade lên global DB cooldown |
| `src/components/review/canva-generation-panel.tsx` | Đã show rate-limit alert — nhưng chỉ local/per-user | Extend thành global cooldown banner (D-16) |
| `src/components/review/canva-result-card.tsx` | Có retry button cho FAILED artifact | Extend cho partial success state (D-18) |
| `src/app/(app)/upload/upload-form.tsx` | Error hiện tại: `<p className="text-destructive">` nhỏ + `toast.error()` | Upgrade lên persistent `Alert` component (D-06) |
| `src/app/(app)/(app)/review/[id]/actions.ts` | `generateCanva()` dùng `Promise.allSettled()` — cả 2 artifact chạy song song | OK giữ nguyên, thêm DB cooldown write vào đây |
| `src/components/app-sidebar.tsx` | Không có stepper — sidebar riêng biệt với workflow | Stepper sẽ là component độc lập, đặt trong từng workflow page |
| `src/app/(app)/layout.tsx` | Server component đơn giản: `AppSidebar` + `<main>` | Stepper KHÔNG nên đặt ở đây vì cần `uploadId` context |
| `prisma/schema.prisma` | Không có `SystemSettings` table; `CanvaToken` model có sẵn | Cần thêm table/column cho global cooldown flag |

### 2.2 Error handling hiện tại — phân tích khoảng trống

**Upload page (`upload-form.tsx`):**
- Client validation error → `setError(msg)` → `<p className="text-destructive">` nhỏ ở dưới dropzone
- Server error → `toast.error()` + `setError(msg)` → không dùng `Alert` component
- **Gap:** Không dùng shadcn `Alert` component; `toast.error()` tự dismiss → D-06 yêu cầu persistent Alert

**Review page khi AI FAILED:**
- Đã dùng `Alert` component với `AlertTitle` + `AlertDescription` + action buttons
- **Tốt:** đây là pattern chuẩn cho Phase 6

**Review page khi Canva FAILED:**
- `toast.error()` được gọi trong `handleGenerate()` và `handleRetryArtifact()`
- `CanvaResultCard` hiện show error message + retry button nhưng ở dạng Card, không phải Alert
- **Gap:** `toast.error()` auto-dismisses → D-06 yêu cầu persistent Alert cho error

**Rate limit hiện tại:**
- `ReviewPage` dùng local state `isRateLimited` + `cooldownMinutes`
- Countdown timer dùng `window.setTimeout` trừ dần từng phút
- **Critical gap:** Nếu user reload trang, cooldown mất. Nếu user khác mở trang, họ không biết có cooldown → D-10 cần global DB flag

---

## 3. Vấn Đề Kỹ Thuật Cần Hiểu Rõ Khi Plan

### 3.1 Stepper: Placement Problem

**Quyết định (D-02):** Stepper hiện ở top của mọi workflow page (upload, review).

**Vấn đề:** `(app)/layout.tsx` là shared layout nhưng không có `uploadId` context. Stepper cần biết:
- Đang ở page nào (`/upload` vs `/review/[id]`)
- Status của upload hiện tại (để biết step nào active, step nào error)

**Giải pháp đúng:** Stepper là **page-level component** — được render bên trong `UploadForm` và `ReviewPage`, không phải trong shared layout. Mỗi page truyền props:
- `/upload` → `activeStep="upload"` (bước 1)
- `/review/[id]` → `activeStep` được tính từ `upload.aiStatus`, `upload.reviewStatus`, và `artifacts`

**Step mapping logic:**
```
/upload page:
  - Mặc định: step 1 "Tai len" active
  - Đang processing: step 1 (có spinner nhỏ bên trong stepper)

/review/[id] page:
  - aiStatus = PROCESSING              → step 2 "Trich xuat" active
  - aiStatus = FAILED                  → step 2 "Trich xuat" có error icon (D-04)
  - aiStatus = READY_FOR_REVIEW        → step 3 "Duyet" active
  - reviewStatus = APPROVED            → step 4 "Tao Canva" active
  - reviewStatus = APPROVED + có FAILED artifact → step 4 có warning icon
  - tất cả artifacts = SUCCEEDED       → step 5 "Hoan thanh" active
```

**D-03 (clickable completed steps):** Khi đang ở review page:
- "Tai len" (step 1) → click → `router.push("/upload")`
- "Trich xuat", "Duyet" (steps 2-3) đã qua → hiện nhưng không navigate (same page)
- Current + future steps → không clickable

**D-05 (responsive):** `md:` breakpoint — desktop hiện text labels, mobile hiện icons/numbers only. Có thể dùng Tailwind `hidden md:inline` cho text.

### 3.2 Global Cooldown: DB Design

**D-10:** Cooldown apply cho ALL users, persist trong DB.

**Phân tích schema hiện tại:**
- `CanvaToken` model có `expiresAt` — có thể thêm `cooldownUntil DateTime?` vào đây (semantic fit: cùng về Canva API state)
- Hoặc tạo `SystemSettings` model mới (`key: String @unique`, `value: String`) — linh hoạt hơn

**Khuyến nghị cho planner:** Thêm `cooldownUntil DateTime?` vào `CanvaToken` model là đơn giản nhất vì không cần table mới. `CanvaToken` đã là "Canva API state" model. Có thể update bằng `prisma.canvaToken.updateFirst()`.

**Flow khi trigger rate limit:**
1. `canvaFetch()` throws `CanvaRateLimitError(cooldownSeconds)`
2. `generateArtifact()` catch → write `cooldownUntil = now() + cooldownSeconds` vào DB
3. Return `{ isRateLimited: true, cooldownSeconds }` về action
4. `generateCanva()` action return lên `ReviewPage`
5. `ReviewPage` nhận → hiện global banner (D-16)

**Flow khi check cooldown trước generation:**
1. `generateCanva()` action bắt đầu → query `canvaToken.cooldownUntil`
2. Nếu `cooldownUntil > now()` → return `{ success: false, isRateLimited: true, cooldownSeconds: remaining }`
3. `ReviewPage` disable Generate button + hiện banner
4. **SSR initial state:** Page component tính `initialCooldown` từ DB và pass vào `ReviewPage` props

**Countdown UI (D-16):** Thay vì giữ nguyên `window.setTimeout` per-minute, cần:
- Nhận `cooldownUntil: Date | null` thay vì `cooldownMinutes: number`
- Tính `remainingMinutes = Math.ceil((cooldownUntil - Date.now()) / 60000)`
- `setInterval` mỗi 30s để recompute (chính xác hơn khi tab background)

### 3.3 AI Extraction Timeout (D-15 — 30s)

**Hiện tại:** Không có timeout. Nếu OpenAI API hang, user chờ vô hạn.

**Implement:** `AbortController` + `Promise.race()` trong `callExtractionApi`:
```typescript
// Trong vòng for loop của callExtractionApi:
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 30_000);
try {
  const completion = await client.chat.completions.create({
    ...,
    signal: controller.signal,
  });
} finally {
  clearTimeout(timeoutId);
}
```
Khi abort, OpenAI SDK throw `AbortError` — cần catch và throw Error với message tiếng Việt: *"AI phản hồi quá chậm (30 giây). Vui lòng thử lại."*

**Lưu ý:** `AbortError` không phải `OpenAI.APIError` nên cần handle riêng trong `callExtractionApi`.

### 3.4 Canva Polling Timeout (D-15 — 2 phút)

**Tìm trong adapter:** Cần xem `src/lib/canva/adapter.ts` để biết polling mechanism hiện tại. Pattern điển hình:
- Nếu dùng autofill async job → có polling loop
- Nếu dùng copy template → không cần timeout (synchronous)

**Planner cần:** Đọc `adapter.ts` để biết chính xác polling pattern trước khi thiết kế timeout.

### 3.5 Exponential Backoff Upgrade (D-11)

**Hiện tại trong `extraction-client.ts`:**
```typescript
await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
// attempt=1 → 1000ms, attempt=2 → 2000ms (linear)
```

**D-11 yêu cầu:** 1s, 2s, 4s (exponential)
```typescript
await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
// attempt=1 → 1000ms, attempt=2 → 2000ms, attempt=3 → 4000ms
```

Với `MAX_RETRIES=2` (3 attempts total), tổng wait time tối đa = 1+2+4 = 7s trước khi fail.

### 3.6 Completion State (D-17, D-18)

**Điều kiện trigger:**
- D-17 (full success): `artifacts.every(a => a.status === "SUCCEEDED")` — cả 2 artifact thành công
- D-18 (partial success): `artifacts.some(a => a.status === "SUCCEEDED") && artifacts.some(a => a.status === "FAILED")`

**Hiện tại:** Không có completion UI đặc biệt. `ReviewPage` chỉ hiện `CanvaResultCard` grid.

**Cần thêm:**
- `CompletionBanner` component (green, D-17) với CTA "Tao tour moi" → `/upload` và "Xem lich su" → `/history`
- Logic trong `ReviewPage` để detect và render banner thay thế (hoặc bên trên) result cards

### 3.7 Messages File (D-21 to D-23)

**Tạo mới:** `src/lib/messages.ts`
- Stepper labels: 5 step names
- Error messages cho mỗi failure point (upload, AI, Canva)
- Cooldown banner text
- Completion/partial success messages

**Scope:** Chỉ cho Phase 6 components mới. Không refactor text đang có.

---

## 4. Plan Split Analysis

### Plan 06-01: UX Layer (End-to-end feedback + Error UX)
**Scope:**
- Tạo `WorkflowStepper` component (5 steps, error state, clickable, responsive)
- Tạo `src/lib/messages.ts` (centralized text)
- Upgrade `UploadForm` error: `toast.error()` → persistent `Alert`
- Upgrade `ReviewPage` Canva error: `toast.error()` → persistent `Alert`
- Thêm `CompletionBanner` component (D-17)
- Thêm partial success display logic (D-18)
- Integrate stepper vào `UploadForm` và `ReviewPage`

**Files chính cần touch:**
- `src/components/workflow-stepper.tsx` (new)
- `src/lib/messages.ts` (new)
- `src/app/(app)/upload/upload-form.tsx` (upgrade error UX)
- `src/components/review/review-page.tsx` (stepper, error alerts, completion state)
- `src/components/review/canva-generation-panel.tsx` (global cooldown banner update)

### Plan 06-02: Backend Reliability (Cooldown DB + Timeouts + Backoff)
**Scope:**
- Prisma schema: thêm cooldown field (vào `CanvaToken` hoặc `SystemSettings` model mới)
- `generateCanva()` action: check global cooldown trước, write cooldown khi gặp 429
- `callExtractionApi()`: thêm 30s timeout + exponential backoff
- Canva `adapter.ts`: thêm 2-minute polling timeout (xem code trước)
- `ReviewPage` nhận `initialCooldown` từ SSR props (query từ DB trên page load)

**Files chính cần touch:**
- `prisma/schema.prisma` (cooldown field)
- `src/lib/ai/extraction-client.ts` (timeout + backoff)
- `src/lib/canva/adapter.ts` (polling timeout)
- `src/app/(app)/review/[id]/actions.ts` (check + write global cooldown)
- `src/app/(app)/review/[id]/page.tsx` (query initial cooldown, pass to ReviewPage)
- `src/components/review/review-page.tsx` (nhận `initialCooldown` prop)

---

## 5. Dependencies & Sequencing

```
06-01 (UX) và 06-02 (Reliability) có thể implement theo bất kỳ thứ tự nào.
Tuy nhiên nên làm 06-02 trước hoặc song song vì:
- Global cooldown state (từ DB) cần có để 06-01 UI render đúng initial state
- Nếu làm 06-01 trước thì phải mock cooldown state tạm thời

Khuyến nghị: 06-02 → 06-01
```

**Internal dependency trong 06-01:**
1. Tạo `messages.ts` trước
2. Tạo `WorkflowStepper` component
3. Integrate stepper vào pages
4. Upgrade error UX (upload form, review page)
5. Thêm completion state

**Internal dependency trong 06-02:**
1. Schema migration (cooldown field) trước
2. Sau đó upgrade action layer (check/write cooldown)
3. Sau đó upgrade extraction client (timeout + backoff)
4. Sau đó upgrade adapter (polling timeout)
5. Cuối cùng: wire initial cooldown vào page props

---

## 6. Key Risks & Open Questions

### Risk 1: Canva adapter polling mechanism chưa confirmed
**Cần đọc:** `src/lib/canva/adapter.ts` để xác nhận:
- Có polling loop không? Hay là synchronous copy-design?
- Nếu không có polling, thì D-15 (2-minute timeout) có thể chỉ là timeout cho toàn bộ `generateArtifact()` call

### Risk 2: DB migration cho cooldown field
- Dùng `prisma db push` (không phải `migrate dev`) để tránh bị block — theo quyết định Phase 05-01
- Field phải nullable vì ban đầu không có cooldown

### Risk 3: Stepper cần upload context trên review page
- `ReviewPage` đã nhận `upload` prop với `aiStatus`, `reviewStatus`
- `canvaArtifacts` cũng được pass → đủ để tính active step
- Không cần context API hay global state — props đã đủ

### Risk 4: UploadForm error upgrade — toast còn lại
- D-06 chỉ đổi error sang Alert, **giữ toast cho success/info**
- Upload form hiện dùng `toast.success("Tải tài liệu thành công...")` → giữ nguyên
- Chỉ đổi `toast.error()` → `Alert` component

### Risk 5: Global cooldown countdown accuracy
- Hiện tại countdown dùng `window.setTimeout(60_000)` — có thể drift nếu tab background
- Phase 6 nên dùng target timestamp (`cooldownUntil: Date`) thay vì minutes counter
- `ReviewPage` cần nhận `cooldownUntil` prop từ SSR và tính lại client-side

---

## 7. What the Planner Needs to Confirm

Trước khi viết plan file, agent planning cần đọc thêm:

1. **`src/lib/canva/adapter.ts`** — Để biết chính xác polling mechanism và design timeout cho 06-02
2. **`src/app/(app)/review/[id]/page.tsx`** — Để biết cách page hiện tại query artifacts và pass props, từ đó thêm `initialCooldown` query

Những quyết định để planner tự quyết:
- Cooldown field: `CanvaToken.cooldownUntil` vs `SystemSettings` table riêng (context file ghi "DB flag in settings table" nhưng để planner decide schema)
- Exact Tailwind breakpoint cho stepper compact mode (D-05 ghi "md breakpoint")
- Animation/transition trên stepper (context để planner decide)
- Structure của `messages.ts` (named exports vs default export object)

---

## 8. Summary

| Hạng mục | Trạng thái |
|---------|-----------|
| Step progress (UX-01) | Cần tạo mới `WorkflowStepper` + integrate vào 2 pages |
| Error UX (UX-02) | Cần upgrade `UploadForm` + `ReviewPage` từ toast → Alert |
| Rate limit global (SAFE-04) | Cần DB field + action layer check/write + UI banner |
| AI timeout | Cần thêm `AbortController` 30s vào `extraction-client.ts` |
| Canva timeout | Cần xác nhận polling pattern trong `adapter.ts` trước |
| Exponential backoff | Đơn giản — 1 line thay đổi trong `extraction-client.ts` |
| Completion state | Cần thêm `CompletionBanner` + detection logic trong `ReviewPage` |
| Messages file | Tạo mới `src/lib/messages.ts` |
| DB schema | 1 field mới nullable — dùng `db push` |

---

*Phase: 06-operational-polish-reliability*
*Research completed: 2026-03-27*
