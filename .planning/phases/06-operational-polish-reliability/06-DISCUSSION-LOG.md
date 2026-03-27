# Phase 6: Operational Polish & Reliability - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-27
**Phase:** 06-operational-polish-reliability
**Areas discussed:** Step progress display, Error & recovery UX, Volume & rate limit, Completion state, Mobile experience, Vietnamese wording consistency

---

## Step Progress Display

| Option | Description | Selected |
|--------|-------------|----------|
| Stepper bar | Thanh ngang 5 buoc (Upload -> Extract -> Review -> Generate -> Done). Buoc hien tai highlighted, buoc da qua co checkmark. | ✓ |
| Sidebar status indicators | Trang thai tren sidebar — item active highlight, buoc xong co icon check. | |
| Per-page status only | Moi page tu hien thi trang thai cua minh (badge/text). | |

**User's choice:** Stepper bar (Recommended)
**Notes:** User wants clear end-to-end workflow progress visibility.

### Follow-up: Stepper visibility

| Option | Description | Selected |
|--------|-------------|----------|
| Always visible | Stepper hien o dau moi page trong workflow. | ✓ |
| Review page only | Chi hien stepper tren review page. | |

**User's choice:** Always visible

### Follow-up: Step count

| Option | Description | Selected |
|--------|-------------|----------|
| 5 steps | Tai len -> Trich xuat -> Duyet -> Tao Canva -> Hoan thanh | ✓ |
| 3 steps (compact) | Tai len -> Duyet & Chinh sua -> Tao Canva | |

**User's choice:** 5 steps

### Follow-up: Step interactivity

| Option | Description | Selected |
|--------|-------------|----------|
| Clickable completed steps | Click buoc da hoan thanh de quay lai xem. | ✓ |
| Display only | Stepper chi hien thi, khong navigate. | |

**User's choice:** Clickable completed steps

---

## Error & Recovery UX

| Option | Description | Selected |
|--------|-------------|----------|
| Inline Alert for errors | Giu toast cho success/info, dung persistent inline Alert cho errors. | ✓ |
| Actionable toasts | Toast cho errors + action button (Thu lai). | |
| Toast + error panel | Toast bao nhanh + persistent error panel duoi page. | |

**User's choice:** Inline Alert for errors (Recommended)

### Follow-up: Error message detail

| Option | Description | Selected |
|--------|-------------|----------|
| Specific + recovery hint | Moi loai loi co message rieng + huong dan cu the + action button. | ✓ |
| Category-based messages | Chia theo 3 loai: user error, system error, network error. | |
| You decide | Claude tu quyet dinh. | |

**User's choice:** Specific + recovery hint

### Follow-up: Error scope

| Option | Description | Selected |
|--------|-------------|----------|
| All 3 failure points | Parsing, AI extraction, Canva generation — moi diem co error Alert rieng. | ✓ |
| Canva + AI only | Chi focus 2 diem hay loi nhat. | |

**User's choice:** All 3 failure points

### Follow-up: Stepper error state

| Option | Description | Selected |
|--------|-------------|----------|
| Error icon on stepper step | Buoc bi loi hien icon warning mau do tren stepper + tooltip. | ✓ |
| No error state on stepper | Stepper chi show progress, khong show errors. | |

**User's choice:** Error icon on stepper step

---

## Volume & Rate Limit

| Option | Description | Selected |
|--------|-------------|----------|
| Global cooldown | Canva rate limit -> cooldown cho TAT CA users. | ✓ |
| Per-user cooldown | Moi user co cooldown rieng. | |
| You decide | Claude tu chon. | |

**User's choice:** Global cooldown

### Follow-up: AI hardening

| Option | Description | Selected |
|--------|-------------|----------|
| Retry + manual fallback | Giu retry 2 lan + exponential backoff + manual Thu lai button. | ✓ |
| Server-side queue | BullMQ queue cho requests. | |
| You decide | Claude tu chon. | |

**User's choice:** Retry + manual fallback

### Follow-up: Canva hardening

| Option | Description | Selected |
|--------|-------------|----------|
| Backoff + DB cooldown flag | Server-side exponential backoff + global cooldown flag trong DB. | ✓ |
| Server auto-retry only | Them retry tu dong 1 lan o server. | |
| You decide | Claude tu chon. | |

**User's choice:** Backoff + DB cooldown flag

### Follow-up: Concurrent generation

| Option | Description | Selected |
|--------|-------------|----------|
| No limit — cooldown suffices | ~10 tours/tuan kho co contention. Global cooldown du bao ve. | ✓ |
| Serialized generation | Chi 1 generation chay tai 1 thoi diem. | |

**User's choice:** No limit — cooldown suffices

### Follow-up: Error logging

| Option | Description | Selected |
|--------|-------------|----------|
| Console logs only | Console/server logs nhu hien tai. Du cho ~10 tours/tuan. | ✓ |
| DB error tracking | Bang ErrorLog trong DB de track loi. | |
| You decide | Claude tu chon. | |

**User's choice:** Console logs only

### Follow-up: Request timeouts

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, add timeouts | AI extraction 30s, Canva polling 2 phut. Tra loi ro rang khi timeout. | ✓ |
| No explicit timeout | Khong can timeout — retry va backoff du. | |
| You decide | Claude tu chon. | |

**User's choice:** Yes, add timeouts

### Follow-up: Cooldown UI

| Option | Description | Selected |
|--------|-------------|----------|
| Banner + disabled button | Banner mau vang + countdown + nut Generate disabled. | ✓ |
| Disabled button only | Chi disable nut Generate. | |
| You decide | Claude tu design. | |

**User's choice:** Banner + disabled button

---

## Completion State

| Option | Description | Selected |
|--------|-------------|----------|
| Success banner + CTAs | Banner xanh "Hoan thanh!" + 2 link cards + nut "Tao tour moi" va "Xem lich su". Stepper step cuoi co checkmark. | ✓ |
| Minimal — badge + stepper | Badge "Hoan thanh" + stepper step 5 la done. | |
| You decide | Claude tu design. | |

**User's choice:** Success banner + CTAs

### Follow-up: Partial success

| Option | Description | Selected |
|--------|-------------|----------|
| Partial success state | Hien partial success message. Artifact OK hien result, artifact fail hien retry. | ✓ |
| All-or-nothing | Coi nhu fail toan bo neu 1 trong 2 bi loi. | |

**User's choice:** Partial success state

---

## Mobile Experience

| Option | Description | Selected |
|--------|-------------|----------|
| Desktop-first responsive | Desktop-first, mobile chi can khong vo layout. Stepper collapse nho hon. | ✓ |
| Desktop only | Khong care mobile. | |
| Mobile-optimized | Mobile-friendly: stepper doc, buttons full-width. | |

**User's choice:** Desktop-first responsive

### Follow-up: Stepper mobile

| Option | Description | Selected |
|--------|-------------|----------|
| Compact stepper on mobile | Step numbers + icons only, an text labels. Full labels tren desktop. | ✓ |
| Vertical stepper on mobile | Stepper doc tren mobile, ngang tren desktop. | |
| You decide | Claude tu design. | |

**User's choice:** Compact stepper on mobile

---

## Vietnamese Wording Consistency

| Option | Description | Selected |
|--------|-------------|----------|
| Centralized messages file | Tao constants file (messages.ts) chua tat ca labels va messages Phase 6. | ✓ |
| Inline text — review only | Inline text nhu hien tai, chi review wording Phase 6. | |
| You decide | Claude tu chon. | |

**User's choice:** Centralized messages file

### Follow-up: Stepper labels

| Option | Description | Selected |
|--------|-------------|----------|
| Use these 5 labels | "Tai len", "Trich xuat", "Duyet", "Tao Canva", "Hoan thanh" | ✓ |
| Custom labels | User muon custom labels khac. | |

**User's choice:** Use these 5 labels

### Follow-up: Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Phase 6 only | Chi centralize text cho Phase 6 components moi. | ✓ |
| Entire app refactor | Centralize toan bo app text. | |

**User's choice:** Phase 6 only

---

## Claude's Discretion

- Stepper component implementation (CSS, animation, breakpoint)
- Exact error message variations per failure scenario
- DB schema for global cooldown flag
- Exponential backoff implementation
- Timeout approach (AbortController, Promise.race, etc.)
- Success banner visual design
- Messages file structure and exports

## Deferred Ideas

None — discussion stayed within phase scope
