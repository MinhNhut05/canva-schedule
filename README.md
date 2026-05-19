# Canva Schedule

Next.js 15 application for document intake, AI-assisted review, and Canva artifact generation.

## Overview

Canva Schedule turns PDF, DOCX, and Excel inputs into a verified content pipeline for generating Canva-ready outputs. The app focuses on reliable extraction, human review, and reproducible deployment.

## Highlights

- Document intake with PDF, DOCX, and Excel parsing
- AI-assisted extraction review with structured validation
- Canva OAuth integration and automated artifact generation
- Prisma-backed persistence for scheduling data and history
- Unit, integration, and end-to-end coverage with Vitest and Playwright
- Docker and GitHub Actions delivery pipeline

## Stack

- Next.js 15
- TypeScript
- Prisma + PostgreSQL
- OpenAI
- Canva OAuth / API
- Zod
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
