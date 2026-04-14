# canva-schedule

Next.js 15 application for document intake, AI-assisted tour review, and Canva artifact generation.

## Stack

- Next.js 15
- TypeScript
- Prisma + PostgreSQL
- Vitest
- Playwright
- Docker + GitHub Actions

## Local development

```bash
npm ci
docker compose up -d
npx prisma migrate dev
npm run db:seed
npm run dev
```

## CI/CD

The repo includes:

- PR CI for lint, typecheck, Vitest, Playwright, production build, and Docker build
- GHCR image publishing on `main`
- Automatic staging deploy after successful `main` CI
- Manual production deploy by image tag
- Manual production rollback

See [docs/ci-cd.md](docs/ci-cd.md) for setup details.
