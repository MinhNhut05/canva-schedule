# Database trong dự án SileTravel — Hướng dẫn học từ cơ bản đến nâng cao

> File này dành cho intern mới joins dự án, cần hiểu DB hoạt động thế nào.

---

## Tổng quan

```
Browser/Client
    │
    ▼ (HTTP multipart/form-data)
Next.js API Routes (src/app/api/)
    │
    ▼ (Prisma Client — ORM layer)
PostgreSQL Database (bên trong Docker container)
    │
    ▼ (SQL queries thực tế)
Docker volume (pgdata/) — lưu trữ trên ổ cứng
```

---

## 1. Cơ bản — Database là gì và tại sao cần nó?

### Câu hỏi: Tại sao không lưu data vào file text/JSON?

File text/JSON có vấn đề:
- Khi nhiều người dùng đồng thời, file bị đè dữ liệu → mất dữ liệu
- Tìm kiếm chậm (phải đọc hết file)
- Không có quan hệ giữa các bản ghi
- Không có cơ chế truy cập an toàn

Database giải quyết bằng:
- **ACID** — đảm bảo dữ liệu không mất khi server crash
- **Concurrent access** — nhiều người dùng đọc/ghi không conflict
- **Query language (SQL)** — tìm kiếm nhanh bằng index
- **Relations** — kết nối dữ liệu giữa các bảng

### Trong dự án này: PostgreSQL

PostgreSQL là một database **quan hệ (relational)**, lưu data thành các bảng (table) có cấu trúc cố định. Đây là loại database phổ biến nhất cho web app.

- Local: chạy trong Docker container (xem `docker-compose.yml:1-12`)
- Port: `5435` trên máy host → `5432` trong container
- User/password: `siletravel/siletravel_dev`
- Database name: `siletravel`

---

## 2. Schema — "Bản thiết kế" của database

### Cách xem schema

Mở file `prisma/schema.prisma`. Đây là nơi định nghĩa **tất cả bảng** trong DB.

Mỗi `model` = 1 bảng. Ví dụ:

```prisma
model User {
  id           String   @id @default(cuid())
  username     String   @unique        ← không trùng nhau
  name         String
  passwordHash String
  role         String   @default("member")
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt     ← tự động cập nhật khi thay đổi

  uploads      Upload[] ← 1 User có nhiều Upload (quan hệ 1-n)

  @@map("users") ← tên bảng thực tế trong SQL
}
```

**Các trường thường dùng:**
- `@id` — khóa chính, duy nhất mỗi dòng
- `@default(...)` — giá trị mặc định khi tạo dòng mới
- `@unique` — giá trị không được trùng
- `@db.Text` — trường text không giới hạn độ dài
- `@updatedAt` — tự động cập nhật timestamp khi dòng được sửa
- `String[]` — mảng strings

### 6 models chính trong dự án

| Model | Ý nghĩa | Quan hệ |
|---|---|---|
| `User` | Người dùng (admin, member) | 1-n: User → Upload |
| `Upload` | File tài liệu đã upload | n-1: Upload → User; 1-n: Upload → CanvaArtifact |
| `CanvaArtifact` | Kết quả Canva đã generate | n-1: CanvaArtifact → Upload |
| `CanvaTemplate` | Cấu hình template Canva | độc lập |
| `CanvaToken` | OAuth token Canva | độc lập |
| `CompanyRule` | Quy tắc công ty | độc lập |

### Thứ tự đọc schema nên theo

1. `Upload` — vì đây là bảng trung tâm, có nhiều trường nhất
2. `User` — quan hệ cơ bản
3. `CanvaArtifact` — hiểu luồng tiếp theo sau upload

---

## 3. Migrations — Cách thay đổi cấu trúc database

### Vấn đề thực tế

Khi phát triển, bạn cần thay đổi schema (thêm cột, xóa bảng, đổi kiểu dữ liệu). Nếu làm thủ công:
- Bạn quên apply lên production
- Không có version control cho thay đổi
- Team members không biết thay đổi gì

**Prisma Migrate** giải quyết: mỗi lần thay đổi schema → tạo 1 migration file → apply vào DB → đảm bảo tất cả môi trường đồng nhất.

### Cấu trúc migration folder

```
prisma/migrations/
  20260322153116_init_users/
    migration.sql        ← SQL thực thi
  20260324014136_add_upload_model/
    migration.sql
  ...
```

### Ví dụ: Đọc migration SQL thực tế

```sql
-- prisma/migrations/20260322153116_init_users/migration.sql

CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
```

### Các lệnh chạy migration

```bash
# Dev (tạo migration mới nếu schema thay đổi)
npm run db:migrate

# Production/CI (chỉ apply, không tạo mới)
npm run db:migrate:deploy

# Xem trạng thái migration
npx prisma migrate status
```

### Quy trình thêm column mới (ví dụ)

```prisma
# B1: Sửa schema.prisma
model Upload {
  ...
  tourDuration String?  ← thêm dòng này
}

# B2: Chạy migration (tạo file SQL migration mới)
npm run db:migrate
# → Prisma hỏi: đặt tên migration là gì? → nhập: add_tour_duration

# B3: File được tạo:
prisma/migrations/20260xxx_add_tour_duration/migration.sql
# → Prisma auto apply vào DB

# B4: Push lên git → CI/CD production cũng chạy migrate deploy
```

---

## 4. Seed — Dữ liệu khởi tạo ban đầu

### Tại sao cần seed?

Khi setup mới, bạn cần dữ liệu ban đầu để app hoạt động:
- Admin user để đăng nhập
- Công ty quy tắc (CompanyRule) mặc định
- Canva template IDs

Seed là script chạy **sau migrate**, tạo data ban đầu.

### Cách xem seed

Mở `prisma/seed.ts`. Seed gồm 3 phần:
1. `seedCompanyRules()` — tạo 9 quy tắc mặc định
2. `seedCanvaTemplates()` — tạo 6 template Canva từ env vars
3. Upsert 3 users mẫu (admin, editor, viewer) — **xóa data cũ trước**

### Cảnh báo quan trọng

```typescript
// prisma/seed.ts:28-31
await prisma.canvaArtifact.deleteMany();
await prisma.upload.deleteMany();
await prisma.user.deleteMany();
```

**Seed KHÔNG chạy trên production** (vì nó xóa dữ liệu). Chỉ chạy:
- Local dev
- CI (vì CI tạo DB mới mỗi lần chạy)

### Cách chạy seed

```bash
# Seed chính
npm run db:seed

# Seed Canva templates (chạy riêng, không xóa data)
npm run db:seed:canva-templates
```

---

## 5. Prisma Client — Cách code tương tác với DB

### Khởi tạo client (singleton pattern)

```typescript
// src/lib/db.ts

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query"] : [],
  });

export const db = prisma;  // alias

// Giữ 1 instance duy nhất, tránh tạo connection mới mỗi request
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

Tại sao dùng globalThis? Vì Next.js hot-reload, nếu không giữ reference → tạo quá nhiều connections → DB crash.

### 4 thao tác CRUD cơ bản

```typescript
import { prisma } from "@/lib/db";

// 1. TẠO (CREATE)
const upload = await prisma.upload.create({
  data: {
    userId: "user123",
    originalFileName: "tour-trường.docx",
    sizeBytes: 1024000,
  }
});

// 2. ĐỌC (READ)
const upload = await prisma.upload.findFirst({
  where: { id: uploadId, userId },  // filter
  select: { id: true, status: true }  // chỉ lấy 2 trường này
});

// 3. CẬP NHẬT (UPDATE)
await prisma.upload.update({
  where: { id: uploadId },
  data: { status: "COMPLETED" }
});

// 4. XÓA (DELETE) — hiếm dùng trong production
await prisma.user.delete({ where: { id: userId } });
```

### Các cách query nâng cao

```typescript
// Tìm nhiều dòng, có phân trang
const uploads = await prisma.upload.findMany({
  where: { userId },
  orderBy: { createdAt: "desc" },  // mới nhất trước
  skip: 20,   // bỏ 20 dòng đầu
  take: 20,   // lấy 20 dòng tiếp
});

// Đếm số dòng (không cần lấy data)
const total = await prisma.upload.count({ where: { userId } });

// Update nhiều trường cùng lúc
await prisma.upload.update({
  where: { id },
  data: {
    status: "PROCESSING",
    aiStatus: "PROCESSING",
    errorMessage: null,
  }
});

// Upsert: tạo nếu chưa có, update nếu đã có
await prisma.companyRule.upsert({
  where: { ruleId: "RULE-01" },
  create: { ruleId: "RULE-01", name: "...", description: "..." },
  update: {}  // nếu đã có thì không làm gì
});

// Quan hệ: lấy upload + kèm artifacts
const upload = await prisma.upload.findFirst({
  where: { id: uploadId },
  include: { canvaArtifacts: true }  ← lấy luôn các CanvaArtifact liên quan
});
```

---

## 6. Luồng dữ liệu thực tế trong app

### Flow 1: Upload file

```
Browser → POST /api/uploads
  → auth() kiểm tra session
  → prisma.upload.create()   ← tạo dòng mới (status: PENDING)
  → validateFile() check file
  → runExtractionPipeline() xử lý AI
  → prisma.upload.update()    ← cập nhật COMPLETED/FAILED
  → trả response về browser
```

Code thực tế: `src/app/api/uploads/route.ts:47-119`

### Flow 2: Review & approve

```
Browser → load /review/[id]
  → auth() kiểm tra session
  → prisma.upload.findFirst() lấy nội dung
  → hiển thị form chỉnh sửa

User sửa field → saveDraftField()
  → prisma.upload.findFirst() lấy structuredDraft cũ
  → merge giá trị mới
  → prisma.upload.update() cập nhật structuredDraft

User approve → approveDraft()
  → prisma.upload.update() đổi reviewStatus = "APPROVED"
```

### Flow 3: Tạo Canva artifact

```
User nhấn "Generate Canva"
  → kiểm tra reviewStatus === "APPROVED"
  → getDraft() lấy structuredDraft
  → resolveTemplatePair() tìm template Canva phù hợp
  → buildArtifactPayload() xây payload
  → canva API call (bên ngoài DB)
  → prisma.canvaArtifact.upsert() lưu kết quả
```

---

## 7. Nâng cao — Migrations chi tiết và CI/CD

### Xem migration history

```bash
# Xem tất cả migration đã chạy
npx prisma migrate status

# Reset DB (xoá tất cả, chạy lại từ đầu) — CẨN THẬN!
npx prisma migrate reset
```

### Migration trong CI/CD pipeline

```
Git push → GitHub Actions CI
  → lint, typecheck, test
  → prisma migrate deploy    ← chạy migration
  → prisma db seed           ← seed data (trên CI DB mới)
  → test:e2e
  → docker build

Merge main → CD Staging
  → prisma migrate deploy    ← chạy trên VPS staging

Manual trigger → CD Production
  → prisma migrate deploy    ← chạy trên VPS production
```

### Những lưu ý khi thay đổi schema

1. **Không sửa migration đã apply** — chỉ tạo migration mới
2. **Test local trước** — chạy `npm run db:migrate` → kiểm tra app hoạt động
3. **Preview data loss** — `npx prisma migrate diff` để xem thay đổi
4. **Null vs empty** — cân nhắc `String?` (nullable) vs `String` (required)
5. **Index** — thêm index cho trường thường query (`where` clause)

---

## 8. Troubleshooting thường gặp

### Lỗi "Can't reach database"

```
Error: P1001: Can't reach database server
```

→ Docker container chưa chạy:
```bash
docker compose up -d
```

### Lỗi "Migration is out of date"

```bash
# Xem migration nào chưa apply
npx prisma migrate status

# Force apply pending migrations
npx prisma migrate deploy
```

### Lỗi "Unique constraint failed"

→ Đang tạo dòng trùng username/email mà đã có `@unique`. Kiểm tra trước bằng:
```typescript
const existing = await prisma.user.findUnique({ where: { username } });
if (existing) return { error: "User đã tồn tại" };
```

### Xem query đang chạy (debug)

Trong dev mode, Prisma log tất cả SQL ra terminal:
```
prisma:query SELECT * FROM "uploads" WHERE ...
```

Nếu không thấy, check `src/lib/db.ts:9` — phải có `log: ["query"]`.

---

## Checklist tự kiểm tra hiểu DB

- [ ] Giải thích được Prisma là gì, tại sao dùng thay vì viết SQL thuần
- [ ] Vẽ được 6 models và mối quan hệ giữa chúng
- [ ] Mô tả được flow: upload → process → review → approve → generate Canva
- [ ] Biết cách tạo migration mới khi thêm field
- [ ] Biết cách chạy seed và hiểu tại sao seed không chạy trên production
- [ ] Hiểu singleton pattern trong `src/lib/db.ts`
- [ ] Giải thích được `$disconnect` trong seed file (cleanup)

---

## Cách đặt câu hỏi khi học

Khi gặp khái niệm/chỗ code lạ, hỏi theo format:

1. **Cái gì?** — Khái niệm/chỗ này làm gì?
2. **Tại sao?** — Tại sao dùng cách này thay vì cách khác?
3. **Ở đâu?** — File/function nào chứa logic này?
4. **Điều gì sai nếu không có?** — Nếu không có thì会发生 gì?

Cách hỏi này giúp bạn hiểu sâu, không chỉ nhớ surface-level.