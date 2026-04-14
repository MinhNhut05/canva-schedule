# CI/CD for `canva-schedule`

## Chosen architecture

- GitHub Actions is the CI/CD engine.
- Docker image is built in CI, tagged by commit SHA, and pushed to GHCR.
- Staging deploys automatically after a successful `main` pipeline.
- Production deploys manually by image tag.
- Rollback uses the previously deployed image tag recorded on the VPS.
- The VPS never builds the app from source. It only pulls a specific image and runs it.

## Why GHCR instead of Docker Hub

- GHCR fits GitHub Actions directly and can publish with `GITHUB_TOKEN`.
- GHCR package permissions can stay aligned with the GitHub repo.
- Docker Hub free plans are more likely to run into pull-rate friction.
- For a private GitHub repo, GHCR is the lower-friction default.

## Required GitHub secrets

Create these repository secrets before enabling the workflows:

- `VPS_HOST`: public IP or hostname of the VPS
- `VPS_USER`: SSH user with permission to write under `/opt/canva-schedule` and run Docker
- `VPS_SSH_KEY`: private SSH key for that user
- `VPS_SSH_PORT`: optional, defaults to `22`
- `GHCR_PULL_USERNAME`: GitHub username used by the VPS to pull private images
- `GHCR_PULL_TOKEN`: GitHub token with `read:packages`
- `STAGING_ENV_FILE`: full multi-line `.env` content for staging
- `PRODUCTION_ENV_FILE`: full multi-line `.env` content for production

`STAGING_ENV_FILE` and `PRODUCTION_ENV_FILE` should include the same application variables you already keep in `.env`, but split per environment. At minimum:

- `AUTH_SECRET`
- `DATABASE_URL`
- `AI_API_URL`
- `AI_API_KEY`
- `CANVA_CLIENT_ID`
- `CANVA_CLIENT_SECRET`
- `CANVA_ACCESS_TOKEN`
- `CANVA_REFRESH_TOKEN`
- `CANVA_TEMPLATE_1DAY_ITINERARY`
- `CANVA_TEMPLATE_1DAY_MENU`
- `CANVA_TEMPLATE_2DAY_ITINERARY`
- `CANVA_TEMPLATE_2DAY_MENU`

Use different `DATABASE_URL` values for staging and production. On one VPS, that usually means separate databases on the same PostgreSQL server.
If the database runs in a separate container on the VPS host, point the app at `host.docker.internal` and expose the DB port only on loopback.

## VPS prerequisites

Install these once on the VPS:

- Docker Engine
- Docker Compose plugin
- a deploy user in the `docker` group

The workflows create and update these directories automatically:

- `/opt/canva-schedule/staging`
- `/opt/canva-schedule/production`

The staging app listens on host port `3001`.
The production app listens on host port `3000`.

If you use Nginx or Caddy, point:

- staging domain to `127.0.0.1:3001`
- production domain to `127.0.0.1:3000`

## CI flow

`CI` runs on every PR to `main` and on every push to `main`.

It executes:

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
- `npm run test:e2e` with PostgreSQL service, `prisma migrate deploy`, and `prisma db seed`
- Docker image build

On `main`, the same workflow also pushes:

- `ghcr.io/<owner>/canva-schedule:<commit-sha>`
- `ghcr.io/<owner>/canva-schedule:latest`

## CD flow

### Staging

- Trigger: successful `CI` run for a push to `main`
- Workflow: `.github/workflows/deploy-staging.yml`
- Result: VPS pulls `ghcr.io/<owner>/canva-schedule:<commit-sha>`, runs `prisma migrate deploy`, restarts staging, and waits for container health

### Production

- Trigger: manual `workflow_dispatch`
- Workflow: `.github/workflows/deploy-production.yml`
- Input: `image_tag`
- Result: VPS pulls that exact image tag, runs `prisma migrate deploy`, restarts production, and waits for container health

## Rollback

Workflow: `.github/workflows/rollback-production.yml`

Two modes:

- Leave `image_tag` blank to roll back to the previous production image recorded on the server
- Set `image_tag` explicitly to deploy any older SHA-tagged image

## Health check

The app now exposes `GET /api/health`.

It returns:

- app status
- DB connectivity status
- environment name
- deployed version

Docker health checks use this endpoint, and deploy scripts block until the container becomes healthy.

## Branch protection to set manually

After the repo is pushed to GitHub and `main` exists, configure branch protection for `main`:

- require a pull request before merging
- block direct pushes
- require status checks:
  - `Validate`
  - `E2E`
  - `Docker Build`
- allow squash merge
- optionally disable merge commits

For a single-maintainer private repo, do not require an approval yet. GitHub does not let the PR author satisfy their own required review, so turning that on too early just blocks you. Add `1` required approval as soon as a second reviewer is real.

## First-time GitHub bootstrap

If your local repo is still on `master`, rename it before pushing:

```bash
git branch -M main
git remote add origin https://github.com/MinhNhut05/canva-schedule.git
git push -u origin main
```

Then:

1. Add the repository secrets listed above.
2. Open the `CI` workflow once from GitHub Actions and confirm it runs on the new repo.
3. Configure branch protection for `main`.
4. Merge to `main` and let staging deploy automatically.
5. Promote a tested SHA to production with `Deploy Production`.
