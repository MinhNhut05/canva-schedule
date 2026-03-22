# Phase 1: Capability Gate & Secure Access - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-22
**Phase:** 01-capability-gate-secure-access
**Areas discussed:** Authentication Strategy, Session & Protection UX, Canva Verification

---

## Authentication Strategy

### Auth Method

| Option | Description | Selected |
|--------|-------------|----------|
| Username/password | Admin tạo sẵn username + password cho mỗi team member. Đơn giản nhất cho internal team nhỏ (~10 users). | ✓ |
| Magic link (email) | Nhập email → nhận link đăng nhập qua email. Không cần nhớ password, nhưng phụ thuộc vào email service. | |
| OAuth (Google/Microsoft) | Đăng nhập bằng Google/Microsoft account. Tiện cho team nhưng cần setup OAuth provider. | |

**User's choice:** Username/password (Recommended)
**Notes:** None

### User Management

| Option | Description | Selected |
|--------|-------------|----------|
| Seed/manual | Tạo account trực tiếp trong database hoặc seed script. Chỉ admin/dev mới thêm được user. | ✓ |
| Admin UI page | Tạo một trang admin đơn giản để thêm/xóa user qua UI. Tiện hơn nhưng tốn thêm effort. | |
| Self-registration + approval | User tự đăng ký và chờ admin duyệt. Linh hoạt nhưng không cần thiết cho internal team nhỏ. | |

**User's choice:** Seed/manual (Recommended)
**Notes:** None

### Auth Library

| Option | Description | Selected |
|--------|-------------|----------|
| NextAuth.js | Thư viện auth phổ biến cho Next.js, hỗ trợ credentials provider sẵn. Nhiều tài liệu, cộng đồng lớn. | ✓ |
| Custom JWT + cookies | HTTP-only cookies và JWT tự viết. Kiểm soát toàn bộ nhưng cần code nhiều hơn. | |
| You decide | Claude tự chọn approach phù hợp nhất cho dự án. | |

**User's choice:** NextAuth.js (Recommended)
**Notes:** None

### Password Handling

| Option | Description | Selected |
|--------|-------------|----------|
| Hash + change password | Bcrypt/argon2 hash. Người dùng có thể đổi password sau khi login. | ✓ |
| Hash + change + forgot password | Giống trên + nếu quên password thì gửi email reset link. Cần email service. | |
| Admin-only password reset | Chỉ admin/dev mới reset password được. Đơn giản nhất cho team nhỏ. | |

**User's choice:** Hash + change password (Recommended)
**Notes:** None

---

## Session & Protection UX

### Session Duration

| Option | Description | Selected |
|--------|-------------|----------|
| 7 ngày | Session tự hết hạn sau 7 ngày kể từ lần login cuối. Phù hợp cho internal app dùng hàng tuần. | ✓ |
| 24 giờ | Session hết sau 24h. Bảo mật hơn nhưng phải login lại mỗi ngày. | |
| Không hết hạn (until logout) | Session tồn tại cho đến khi user chủ động logout. Tiện nhưng kém bảo mật. | |

**User's choice:** 7 ngày (Recommended)
**Notes:** None

### Unauthenticated Redirect

| Option | Description | Selected |
|--------|-------------|----------|
| Redirect + toast | Chuyển về trang login + thông báo ngắn "Vui lòng đăng nhập". Sau login đưa về trang đang truy cập. | ✓ |
| Silent redirect to login | Chuyển về login mà không thông báo gì. Đơn giản nhất. | |
| Show 403 page | Hiển thị trang 403 Forbidden. Không thân thiện cho user. | |

**User's choice:** Redirect + toast (Recommended)
**Notes:** None

### Login Page Design

| Option | Description | Selected |
|--------|-------------|----------|
| Simple login form | Trang login tối giản: logo công ty, form username/password, nút login. Không cần trang landing riêng. | ✓ |
| Login + branding sidebar | Trang login + mô tả ngắn về SileTravel ở bên cạnh. Chuyên nghiệp hơn. | |
| You decide | Claude tự chọn layout phù hợp. | |

**User's choice:** Simple login form (Recommended)
**Notes:** None

### Route Protection Scope

| Option | Description | Selected |
|--------|-------------|----------|
| All routes protected | Tất cả các route đều bảo vệ ngoại trừ /login. Đơn giản và an toàn cho internal app. | ✓ |
| Public home + protected features | Có trang chủ (home) công khai, các trang chức năng bảo vệ. Không cần thiết cho internal tool. | |
| Per-route protection | Chỉ bảo vệ các route cụ thể cần auth. Linh hoạt nhưng dễ miss route. | |

**User's choice:** All routes protected (Recommended)
**Notes:** None

---

## Canva Verification

### Verification Method

| Option | Description | Selected |
|--------|-------------|----------|
| Automated probe script | Tạo một script/endpoint chạy thử: kết nối API, điền data vào template thật, kiểm tra kết quả. Tự động và repeatable. | ✓ |
| Manual API test | Làm bằng tay qua Canva API docs/playground. Nhanh ban đầu nhưng không repeatable. | |
| Checklist-based manual | Viết checklist các điều kiện cần kiểm tra và verify từng cái manually. | |

**User's choice:** Automated probe script (Recommended)
**Notes:** None

### Go/No-Go Criteria

| Option | Description | Selected |
|--------|-------------|----------|
| All 3 steps pass | Script phải: 1) Kết nối Canva API thành công, 2) Điền được data vào template fields, 3) Trả về editable link. Nếu 1 bước fail → ghi blocker. | ✓ |
| API connection + template list only | Chỉ cần kết nối API và list được templates là đủ. Autofill test để sau. | |
| You decide | Claude tự xác định tiêu chí phù hợp. | |

**User's choice:** All 3 steps pass (Recommended)
**Notes:** None

### Failure Handling

| Option | Description | Selected |
|--------|-------------|----------|
| Document blocker | Ghi lại chi tiết lỗi và yêu cầu (ví dụ: cần Brand Template, cần Enterprise). Không tự động chuyển hướng khác. | ✓ |
| Auto-fallback to PDF export | Nếu Canva fail, tự động chuyển sang xuất PDF thay thế. Phức tạp hơn. | |
| You decide | Claude quyết định fallback strategy. | |

**User's choice:** Document blocker (Recommended)
**Notes:** None

### Test Template

| Option | Description | Selected |
|--------|-------------|----------|
| Real SOHA template | Dùng template thật của SOHA Travel để test. Kết quả chính xác nhất. | ✓ |
| Dummy test template | Tạo một template test đơn giản riêng để kiểm tra. Không ảnh hưởng template thật. | |
| Both | Test cả hai: real và dummy. | |

**User's choice:** Real SOHA template (Recommended)
**Notes:** None

---

## Claude's Discretion

- Exact password hashing algorithm choice (bcrypt vs argon2)
- Toast notification library/implementation
- Probe script structure and output format
- Database schema for user accounts
- Middleware implementation pattern for route protection

## Deferred Ideas

None — discussion stayed within phase scope
