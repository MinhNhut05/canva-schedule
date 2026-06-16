# Canva auto-share worker — VPS runbook (host systemd + Xvfb)

The web app deploys to the VPS as a Docker container. The **auto-share worker** is
different: it drives a **headed** Chromium through the Canva web UI, so it runs as a
**systemd service on the VPS host** under a virtual display (`Xvfb`), not in a
container. This makes the interactive bot login and the persistent session far
easier to manage.

## Why login must happen ON the VPS

Cloudflare's `cf_clearance` cookie is bound to **User-Agent + IP**. The
`storageState` captured on your laptop is invalid from the VPS IP → Canva returns
`403 / "Just a moment"`. Therefore the bot **must be logged in from the VPS itself**
so the saved cookies + UA match the VPS IP. A `403` later almost always means the
session/IP/UA drifted → re-login from the VPS.

## Layout

```
/opt/canva-schedule/worker/
├── app/                         # repo checkout (this codebase)
├── run-worker.sh                # xvfb-run wrapper (from deploy/worker/)
├── .env.runtime                 # same as the staging app runtime env
├── .worker.env                  # CANVA_BOT_* + CANVA_SHARE_DRY_RUN
├── canva-bot.storage-state.json # bot session (created on the VPS, chmod 600)
└── worker.log                   # optional; default logs go to journald
```

## 1. Prerequisites (Debian/Ubuntu VPS)

```bash
# Node 22 + corepack/pnpm 11.2.2
node -v   # expect v22.x  (install via nodesource if missing)
corepack enable && corepack prepare pnpm@11.2.2 --activate

# Xvfb + fonts, Google Chrome (for the login flow), git
sudo apt-get update
sudo apt-get install -y xvfb fonts-liberation fonts-noto-color-emoji git
# Google Chrome stable (the login script attaches to real Chrome via CDP)
wget -qO /tmp/chrome.deb https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo apt-get install -y /tmp/chrome.deb

# A way to SEE Chrome during the interactive Google login. Either:
#  a) SSH X11 forwarding:  ssh -X user@vps   (then DISPLAY is set), or
#  b) a VNC server (e.g. x11vnc/TigerVNC) + a lightweight desktop.
```

## 2. Checkout + install

```bash
sudo mkdir -p /opt/canva-schedule/worker
sudo chown "$USER":"$USER" /opt/canva-schedule/worker
cd /opt/canva-schedule/worker
git clone <REPO_URL> app
cd app
pnpm install --frozen-lockfile
pnpm exec prisma generate
# Playwright's bundled Chromium (used for the actual share automation) + libs
pnpm exec playwright install --with-deps chromium
```

## 3. Env files

```bash
cd /opt/canva-schedule/worker

# (a) Reuse the staging runtime env. DATABASE_URL must be reachable FROM THE HOST
#     (e.g. 127.0.0.1:<published-port> or the docker network address of postgres).
cp /opt/canva-schedule/staging/.env.runtime ./.env.runtime   # adjust DATABASE_URL if needed
chmod 600 ./.env.runtime

# (b) Worker-specific overrides
cat > ./.worker.env <<'EOF'
CANVA_SHARE_DRY_RUN=true
CANVA_BOT_HEADLESS=false
CANVA_BOT_STORAGE_STATE_PATH=/opt/canva-schedule/worker/canva-bot.storage-state.json
CANVA_BOT_USER_AGENT=
CANVA_SHARE_WORKER_POLL_MS=15000
EOF
chmod 600 ./.worker.env
```

## 4. Bot login FROM the VPS (interactive, one-time / monthly)

With a display available (X11-forward or VNC):

```bash
cd /opt/canva-schedule/worker/app
CANVA_BOT_STORAGE_STATE_PATH=/opt/canva-schedule/worker/canva-bot.storage-state.json \
  pnpm canva:bot-login
```

- A real Chrome window opens. Complete the Google → Canva login.
- Press Enter when prompted; the script writes `canva-bot.storage-state.json` and
  prints `CANVA_BOT_USER_AGENT=...` (a **Linux** UA).
- Copy that UA into `.worker.env` (`CANVA_BOT_USER_AGENT=...`) and `chmod 600` the
  session file. The cookies are now bound to the VPS IP + this UA.

## 5. Install the systemd service

```bash
cd /opt/canva-schedule/worker
cp app/deploy/worker/run-worker.sh ./run-worker.sh && chmod 700 ./run-worker.sh
sudo cp app/deploy/worker/canva-share-worker.service /etc/systemd/system/
sudoedit /etc/systemd/system/canva-share-worker.service   # set User=<deploy user>, check paths
sudo systemctl daemon-reload
sudo systemctl enable --now canva-share-worker
```

## 6. Verify

```bash
# Dry run first (.worker.env has CANVA_SHARE_DRY_RUN=true):
journalctl -u canva-share-worker -f
#   → should claim PENDING jobs and log a dry-run (no Canva window write).

# Then enable real sharing:
sudo sed -i 's/^CANVA_SHARE_DRY_RUN=true/CANVA_SHARE_DRY_RUN=false/' /opt/canva-schedule/worker/.worker.env
sudo systemctl restart canva-share-worker
#   → generate a real design in the app, watch the worker set "anyone with link",
#     then confirm a DIFFERENT Canva account can open the captured /design/<id>/<token>/edit link.
```

## Operations

- **Logs:** `journalctl -u canva-share-worker -f`
- **Restart:** `sudo systemctl restart canva-share-worker`
- **Update code:** `cd /opt/canva-schedule/worker/app && git pull && pnpm install --frozen-lockfile && sudo systemctl restart canva-share-worker`
- **Monthly re-login:** repeat step 4 from the VPS before the session expires.
- **Seeing `403` / "Just a moment":** the session/UA/IP drifted → re-login from the
  VPS (step 4) and update `CANVA_BOT_USER_AGENT`.
- **Staging vs production:** this runbook targets **staging** (point `.env.runtime`
  `DATABASE_URL` at the staging DB). For production, repeat under
  `/opt/canva-schedule/worker-prod/` with the production DB + a separate session.
