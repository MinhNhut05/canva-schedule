# Canva auto-share worker — VPS runbook

The web app runs in Docker. The **auto-share worker** is different: it
drives a real Google Chrome through the Canva web UI via Chrome DevTools Protocol (CDP), so it runs as a **systemd service on the VPS host** under Xvfb — not in a container.

## Architecture

```
Cloudflare (canva.com)
  ↑ cf_clearance survives because login + share use the SAME Chrome profile
  ↕ (same --user-data-dir + --remote-debugging-port)
Chrome --user-data-dir=<profile> --remote-debugging-port=9222
  ↑ (SSH -X / VNC login once/month)
  |
  └─ CDP ──► share-bot.ts (tsx scripts/canva-share-worker.ts) → sets "anyone·edit" → writes public URL → DB
```

The login script (`pnpm canva:bot-login`) and the worker share **one Chrome user profile directory**.
Because the session fingerprint (cookies, cf_clearance, IP, UA) is identical across login and share, Cloudflare
sees a regular browser and almost never challenges the bot.

**When does re-login matter?** Only when Cloudflare expires cf_clearance (~1/month) or flags the IP.
The worker logs a hint when that happens.

## Layout

```
/opt/canva-schedule/worker/
├── app/                         # git checkout (this codebase)
├── chrome-profile/               # persistent Chrome user profile (logged-in once / monthly)
│   └── Default/
├── .env.runtime                # DATABASE_URL + app secrets (same as staging)
└── .worker.env                 # CANVA_SHARE_DRY_RUN + CANVA_BOT_CHROME_PROFILE_DIR
    (no STORAGE_STATE_PATH or USER_AGENT needed)
```

## 1. Prerequisites (Debian/Ubuntu VPS)

```bash
# Node 22 + corepack/pnpm 11.2.2
node -v   # expect v22.x
corepack enable && corepack prepare pnpm@11.2.2 --activate

# Google Chrome (the actual bot browser — Chromium bundled with Playwright won't work for Canva)
# Option A: Chrome from Debian (stable)
sudo apt-get install -y google-chrome-stable
# Option B: .deb from Google (always latest)
wget -q -O /tmp/chrome.deb https://dl.google.com/linux/direct/google-chrome-stable_current_x86_64.deb
sudo apt-get install -y /tmp/chrome.deb

# Xvfb (virtual display) + fonts
sudo apt-get install -y xvfb fonts-liberation fonts-noto-color-emoji git

# A way to SEE Chrome during the FIRST interactive login (X11 forwarding is fine):
#   ssh -X canva@<vps>   (or a VNC server)
```

## 2. Checkout + install

```bash
sudo mkdir -p /opt/canva-schedule/worker
sudo chown "$USER" /opt/canva-schedule/worker
cd /opt/canva-schedule/worker
git clone <your-repo> app
cd app && pnpm install --frozen-lockfile && pnpm exec prisma generate
```

## 3. Env files

```bash
cd /opt/canva-schedule/worker

# DATABASE_URL must point to the DB reachable from the host (container host bridge or published port)
cp /path/to/.env .env.runtime
chmod 600 .env.runtime

cat > .worker.env <<'EOF'
CANVA_SHARE_DRY_RUN=true          # start with dry-run; switch to false when ready
CANVA_BOT_CHROME_PROFILE_DIR=/opt/canva-schedule/worker/chrome-profile
CANVA_BOT_CHROME_PORT=9222
CANVA_SHARE_WORKER_POLL_MS=15000
EOF
chmod 600 .worker.env
```

## 4. One-time bot login (from the VPS, with X11 forwarding)

```bash
cd /opt/canva-schedule/worker/app

# The script auto-detects CANVA_BOT_CHROME_PROFILE_DIR from env or defaults to /opt/…/chrome-profile
CANVA_BOT_CHROME_PROFILE_DIR=/opt/canva-schedule/worker/chrome-profile \
  pnpm canva:bot-login
```

- Chrome opens. Log in with the Canva account that creates designs (Continue with Google / email+password).
- If Cloudflare shows "Verify you are human", tick the challenge then log in normally.
- Press Enter when you reach the Canva home page.
- The script prints `CANVA_BOT_CHROME_PROFILE_DIR=…` — **add that to `.worker.env`** if it differs from the default.

## 5. Install the systemd service

```bash
cd /opt/canva-schedule/worker
cp app/deploy/worker/run-worker.sh ./run-worker.sh && chmod 700 ./run-worker.sh
sudo cp app/deploy/worker/canva-share-worker.service /etc/systemd/system/
sudoedit /etc/systemd/system/canva-share-worker.service  # set User=canva, check paths
sudo systemctl daemon-reload
sudo systemctl enable --now canva-share-worker
```

## 6. Verify

```bash
# Watch the worker log
journalctl -u canva-share-worker -f

# Switch to real sharing
sudo sed -i 's/CANVA_SHARE_DRY_RUN=true/CANVA_SHARE_DRY_RUN=false/' /opt/canva-schedule/worker/.worker.env
sudo systemctl restart canva-share-worker

# Create a design in the app → worker should pick it up and set "anyone·edit" → link appears in a DIFFERENT Canva account.
```

## Operations

| Task | Command |
|------|---------|
| Watch logs | `journalctl -u canva-share-worker -f` |
| Restart worker | `sudo systemctl restart canva-share-worker` |
| Update code | `cd /opt/canva-schedule/worker/app && git pull && pnpm install --frozen-lockfile && sudo systemctl restart canva-share-worker` |
| Re-login (cf_clearance expired / "Just a moment" challenge) | SSH in with X11 forwarding, run step 4 again |
| Switch DB (staging ↔ prod) | Edit `.env.runtime` DATABASE_URL then `systemctl restart canva-share-worker` |
