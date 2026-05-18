# CI/CD And Staging Handoff - 2026-04-17

## 1. Muc tieu ban dau

Muc tieu cua session nay la:

- dung CI/CD cho repo `MinhNhut05/canva-schedule`
- flow: PR -> CI -> merge `main` -> auto deploy `staging` -> sau do moi deploy `production`
- build artifact co dinh bang Docker image tag theo commit SHA, publish len GHCR
- VPS chi `pull` image va deploy, khong build lai tren server

## 2. Repo va ha tang hien tai

### Repo

- Local workspace: `/home/minhnhut_dev/projects/siletravel`
- GitHub repo: `https://github.com/MinhNhut05/canva-schedule`
- Branch deploy: `main`
- Repo la `private`
- User khong co GitHub Pro, nen khong enforce branch protection day du cho private repo bang GitHub Free

### VPS

- Host: `188.166.245.24`
- User: `root`
- SSH local key: `/home/minhnhut_dev/.ssh/id_ed25519_work`

### Registry

- Dung `GHCR`
- Image name: `ghcr.io/minhnhut05/canva-schedule`

### GitHub Secrets da set

- `VPS_HOST`
- `VPS_USER`
- `VPS_SSH_PORT`
- `VPS_SSH_KEY`
- `GHCR_PULL_USERNAME`
- `GHCR_PULL_TOKEN`
- `STAGING_ENV_FILE`
- `PRODUCTION_ENV_FILE`

## 3. Cac file CI/CD da tao trong repo

- `.github/workflows/ci.yml`
- `.github/workflows/deploy-staging.yml`
- `.github/workflows/deploy-production.yml`
- `.github/workflows/rollback-production.yml`
- `Dockerfile`
- `.dockerignore`
- `deploy/compose.yml`
- `deploy/scripts/deploy.sh`
- `deploy/scripts/smoke-check.sh`
- `deploy/scripts/rollback.sh`
- `src/app/api/health/route.ts`
- `docs/ci-cd.md`

## 4. Cac commit quan trong da duoc push

- `0712175` `chore: add dockerized ci/cd pipeline`
- `7418e7a` `chore: inline build-time envs in Dockerfile`
- `8099904` `fix: add missing canva prisma migration`
- `165d65e` `fix: add missing user role migration`
- `d6d8d79` `fix: restore Vietnamese sidebar labels`
- `661a5b2` `fix: unblock upload e2e flow`
- `fc2a480` `fix: allow docker builds without public dir`
- `d3493fe` `fix: allow migrations to reach host postgres`
- `97e679d` `fix: deploy app and migrations on shared docker network`
- `d2f34c5` `fix: trust self-hosted auth host`
- `9ec147b` `fix: use configured ai model in extraction client`

`HEAD` luc handoff: `9ec147b`

## 5. Trang thai workflow luc handoff

### GitHub Actions

Da xac nhan bang `gh run list -R MinhNhut05/canva-schedule --limit 8`:

- `24500243594` `CI` cho commit `9ec147b`: `success`
- `24500573351` `Deploy Staging`: `success`

Nghia la:

- CI da xanh
- image da build/push duoc len GHCR
- deploy staging da chay xong thanh cong o muc workflow

Nhung staging van con loi runtime/data o man hinh review.

## 6. Ha tang Docker tren VPS

### Postgres

DB container da duoc tao truoc do:

- container: `canva-schedule-db`
- image: `postgres:16-alpine`
- host bind: `127.0.0.1:5438 -> 5432`
- user: `canva_schedule`
- DB:
  - `canva_schedule_staging`
  - `canva_schedule_production`

### Docker network

Da tao shared network:

- `canva-schedule-network`

DB container da duoc connect vao network nay de app container va migration container noi thang bang hostname:

- `canva-schedule-db:5432`

### Staging app

- container name: `canva-schedule-staging`
- public URL hien tai: `http://188.166.245.24:3001`

## 7. Cac loi da gap va da xu ly xong

### 7.1 Docker build fail vi thieu `public/`

Loi:

- buildx fail vi `COPY --from=builder /app/public ./public`
- tren GitHub commit thuc te khong co thu muc `public/`

Da fix:

- them `RUN mkdir -p public` trong `Dockerfile`

### 7.2 Staging deploy fail vi `DATABASE_URL` sai

Da gap mot ban `STAGING_ENV_FILE` tren GitHub secret/VPS bi sai format host.

Da fix:

- cap nhat lai `STAGING_ENV_FILE`
- dong bo `/opt/canva-schedule/staging/.env.runtime` tren VPS

### 7.3 Migration container khong thay DB

Loi cu:

- container migrate khong truy cap duoc `host.docker.internal`
- DB lai chi bind `127.0.0.1:5438`

Da fix:

- chuyen sang dung shared Docker network
- dung `canva-schedule-db:5432`
- `deploy/scripts/deploy.sh` chay migrate bang `--network "${APP_NETWORK}"`

### 7.4 Login dung thong tin nhung van bi ket o `/login`

Loi staging log:

- `UntrustedHost`

Da fix:

- them `trustHost: true` trong `src/lib/auth.config.ts`

### 7.5 Re-extract AI bi 404 tren staging, local thi chay

Chan doan:

- local co thay doi chua commit trong `src/lib/ai/extraction-client.ts`
- code local dung `process.env.AI_MODEL` va fallback `cx/gpt-5.4`
- `main` tren GitHub luc do van hardcode model cu, dan den AI gateway tra `404`

Da fix:

- commit `9ec147b` dua thay doi nay len `main`

Da xac nhan:

- `CI` xanh
- `Deploy Staging` xanh cho commit do

## 8. Tinh trang moi nhat cua staging khi user test

User da test tren URL review va gap man hinh:

- `Application error: a server-side exception has occurred...`
- `Digest: 1181982243`

Toi da doc log staging tren VPS:

```text
Error: Missing active Canva template for ONE_DAY_ITINERARY. Run prisma db seed or configure via admin panel.
digest: '1181982243'
```

Log duoc lay bang:

```bash
ssh -F /dev/null -i ~/.ssh/id_ed25519_work root@188.166.245.24 \
  "docker logs canva-schedule-staging --tail=250"
```

## 9. Nguyen nhan hien tai cua loi `Digest: 1181982243`

Day la blocker moi nhat, va la nguyen nhan truc tiep gay crash route review.

### 9.1 Bang `canva_templates` tren staging dang rong

Da query truc tiep Postgres staging:

```sql
select id, "tourDuration", "artifactType", "templateId", "isActive", "createdAt"
from canva_templates
order by "createdAt" desc;
```

Ket qua: **khong co dong nao**

### 9.2 Runtime env tren staging co day du `CANVA_TEMPLATE_*`

Da xac nhan tren VPS:

- `CANVA_TEMPLATE_1DAY_ITINERARY=EAHFbrlKx9s`
- `CANVA_TEMPLATE_1DAY_MENU=EAHFaiGyTyQ`
- `CANVA_TEMPLATE_2DAY_ITINERARY=EAHFavTKu_k`
- `CANVA_TEMPLATE_2DAY_MENU=EAHFaunQ-m8`

Nghia la:

- env da co
- nhung bang `canva_templates` chua duoc backfill

### 9.3 Deploy hien tai chi migrate, khong seed

`deploy/scripts/deploy.sh` hien chi lam:

- `docker login`
- `docker compose pull`
- `npx prisma migrate deploy`
- `docker compose up -d`
- smoke check

Khong co buoc nao chay:

- `prisma db seed`
- hoac script backfill `canva_templates`

### 9.4 Admin UI templates khong tao moi row neu bang rong

Co man hinh admin templates tai:

- `src/app/(app)/admin/templates/page.tsx`
- `src/app/(app)/admin/templates/actions.ts`

Nhung code hien tai chi:

- list cac record dang co
- update row theo `id`

Khong co action `create`

Vi vay:

- neu `canva_templates` dang rong
- admin panel hien tai khong tu tao 4 row mac dinh duoc

## 10. Ket luan ve loi hien tai

Sau khi fix AI model, re-extract da di qua duoc nut chan cu.

Blocker moi nhat khong phai CI, khong phai deploy, khong phai AI 404 nua.

Blocker hien tai la:

- staging review route can `ONE_DAY_ITINERARY`
- `resolveTemplate()` nem loi vi khong tim thay active template trong DB
- bang `canva_templates` tren staging rong
- deploy script khong seed table nay
- admin UI hien tai cung khong tao row moi khi bang rong

## 11. Cach xu ly tiep toi khuyen nghi

### Khuyen nghi 1 - dung script backfill template khong pha du lieu

Day la cach nen lam tiep.

Tao mot script rieng de:

- doc 4 env:
  - `CANVA_TEMPLATE_1DAY_ITINERARY`
  - `CANVA_TEMPLATE_1DAY_MENU`
  - `CANVA_TEMPLATE_2DAY_ITINERARY`
  - `CANVA_TEMPLATE_2DAY_MENU`
- upsert 4 dong vao `canva_templates`
- gan `fieldMapping` mac dinh tu `src/lib/canva/field-map.ts`
- khong xoa `users`
- khong xoa `uploads`
- khong xoa `canva_artifacts`

Sau do:

- chay script do tren staging
- verify lai route review

### Khuyen nghi 2 - khong nen chay thang `prisma db seed` tren staging neu can giu du lieu

Ly do:

`prisma/seed.ts` hien dang:

- `await seedCanvaTemplates(prisma);`
- sau do `deleteMany()` tren:
  - `canvaArtifact`
  - `upload`
  - `user`
- roi seed lai `admin/editor/viewer`

Nghia la chay `prisma db seed` se reset du lieu lien quan.

Neu chi muon them template, day la cach qua nang va de mat du lieu test hien tai.

## 12. Local va staging dang khong hoan toan giong nhau

Day la canh bao quan trong nhat cho session tiep theo.

`git status --short` hien con rat nhieu thay doi local chua commit, vi du:

- `prisma/schema.prisma`
- `prisma/seed.ts`
- `src/app/(app)/review/[id]/actions.ts`
- `src/app/(app)/review/[id]/page.tsx`
- `src/components/review/review-actions.tsx`
- `src/components/review/review-page.tsx`
- `src/lib/ai/extraction-prompt.ts`
- `src/lib/canva/client.ts`
- `src/lib/canva/payload.ts`
- `src/lib/review/draft.ts`
- nhieu test files va `public/`

Co nghia la:

- local "chay muot" khong dong nghia `main` tren GitHub dang giong local
- bat ky hanh vi "local ok, staging loi" deu phai nghi ngay den dirty worktree nay

Nguoi tiep theo khong duoc gia dinh repo dang clean.

## 13. Username test tren staging

Toi da seed user test tren staging truoc do:

- `admin / password123`
- `editor / password123`
- `viewer / password123`

## 14. Cac lenh huu ich de dieu tra tiep

### Kiem tra run gan nhat

```bash
gh run list -R MinhNhut05/canva-schedule --limit 8
gh run view -R MinhNhut05/canva-schedule 24500243594
gh run view -R MinhNhut05/canva-schedule 24500573351
```

### Xem log staging app

```bash
ssh -F /dev/null -i ~/.ssh/id_ed25519_work root@188.166.245.24 \
  "docker logs canva-schedule-staging --tail=250"
```

### Kiem tra env runtime tren staging

```bash
ssh -F /dev/null -i ~/.ssh/id_ed25519_work root@188.166.245.24 \
  "grep -E '^AI_|^CANVA_TEMPLATE_|^DATABASE_URL=' /opt/canva-schedule/staging/.env.runtime"
```

### Kiem tra bang `canva_templates`

```bash
ssh -F /dev/null -i ~/.ssh/id_ed25519_work root@188.166.245.24 \
  "docker exec -i canva-schedule-db psql -U canva_schedule -d canva_schedule_staging \
   -At -F \$'\\t' \
   -c \"select id, \\\"tourDuration\\\", \\\"artifactType\\\", \\\"templateId\\\", \\\"isActive\\\" from canva_templates order by \\\"createdAt\\\" desc;\""
```

### Kiem tra container staging

```bash
ssh -F /dev/null -i ~/.ssh/id_ed25519_work root@188.166.245.24 "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Image}}'"
```

## 15. Viec can lam tiep trong chat moi

Thu tu nen lam:

1. Doc file handoff nay.
2. Xac nhan lai `git status` vi local dang dirty.
3. Khong fix AI nua; AI 404 da qua.
4. Xu ly `canva_templates` rong tren staging.
5. Uu tien viet script backfill template khong pha du lieu thay vi chay `prisma db seed`.
6. Deploy len staging.
7. Test lai flow:
   - login
   - upload
   - re-extract
   - review
   - generate Canva
8. Khi staging on dinh moi tinh toi production.

## 16. Prompt de mo chat moi

Co the paste nguyen prompt duoi day vao chat moi:

```text
Doc file /home/minhnhut_dev/projects/siletravel/docs/ci-cd-handoff-2026-04-17.md truoc, xem do la source of truth.

Repo hien tai la /home/minhnhut_dev/projects/siletravel, branch main, nhung worktree dang dirty va local khong hoan toan giong staging.

Dung fix tiep theo huong AI 404 nua. CI va Deploy Staging cho commit 9ec147b da xanh. Blocker hien tai la runtime error tren staging o route review, digest 1181982243. Log tren VPS bao: "Missing active Canva template for ONE_DAY_ITINERARY. Run prisma db seed or configure via admin panel."

Canva template env vars da co tren staging runtime, nhung bang canva_templates dang rong. Deploy script hien chi migrate, khong seed. Admin templates page hien chi edit record co san, khong tao record moi khi bang rong.

Yeu cau:
1. Khong revert cac thay doi local unrelated.
2. Doc handoff file roi tu xac nhan lai trang thai bang lenh thuc te.
3. Uu tien tao cach backfill/upsert 4 Canva templates vao canva_templates mot cach khong xoa users/uploads/artifacts.
4. Sau do deploy lai staging va test flow review/generate Canva.
5. Neu can commit, commit nho, ro rang, va giai thich dung blocker hien tai.

Neu can truy cap VPS:
- host: 188.166.245.24
- user: root
- ssh key local: /home/minhnhut_dev/.ssh/id_ed25519_work

Neu can xem GitHub Actions:
- repo: MinhNhut05/canva-schedule
- CI run da xanh: 24500243594
- Deploy Staging da xanh: 24500573351
```

