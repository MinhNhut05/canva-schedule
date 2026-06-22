#!/usr/bin/env bash
# Wrapper that runs the Canva auto-share worker under a virtual framebuffer (Xvfb).
#
# Invoked by canva-share-worker.service. All app/bot env vars are injected by
# systemd via EnvironmentFile=, so this script sets up the display + PATH, starts a
# real Google Chrome on the logged-in profile with remote debugging, then execs the
# worker (which attaches to that Chrome over CDP).
#
# Using the SAME profile dir as `pnpm canva:bot-login` keeps the browser fingerprint
# stable across login + share, so cf_clearance survives and Cloudflare is far less
# likely to challenge the bot.
set -euo pipefail

# Repo checkout that contains scripts/canva-share-worker.ts + node_modules.
APP_DIR="${WORKER_APP_DIR:-/opt/canva-schedule/worker/app}"
cd "$APP_DIR"

# systemd starts services with a minimal PATH; make sure pnpm (corepack shim) and
# the usual locations are reachable. Adjust if pnpm lives elsewhere.
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:${HOME:-/root}/.local/share/pnpm:${PATH:-}"

CHROME_PORT="${CANVA_BOT_CHROME_PORT:-9222}"
CHROME_PROFILE_DIR="${CANVA_BOT_CHROME_PROFILE_DIR:-/opt/canva-schedule/worker/chrome-profile}"
CHROME_BIN="${CANVA_BOT_CHROME_PATH:-/usr/bin/google-chrome}"

# Everything below runs inside one virtual display so Chrome (headed) + the worker
# share the same DISPLAY. xvfb-run allocates a free screen and tears it down on exit.
exec xvfb-run -a --server-args="-screen 0 1280x1024x24 -ac" bash -c '
  set -euo pipefail
  # Start the real Chrome on the logged-in profile with remote debugging.
  "'"$CHROME_BIN"'" \
    --remote-debugging-port='"$CHROME_PORT"' \
    --user-data-dir='"$CHROME_PROFILE_DIR"' \
    --no-first-run --no-default-browser-check --disable-gpu \
    about:blank >/tmp/canva-chrome.log 2>&1 &
  CHROME_PID=$!
  trap "kill $CHROME_PID 2>/dev/null || true" EXIT

  # Wait for the CDP endpoint to come up before starting the worker.
  for i in $(seq 1 30); do
    if curl -fsS "http://127.0.0.1:'"$CHROME_PORT"'/json/version" >/dev/null 2>&1; then break; fi
    sleep 1
  done

  exec pnpm canva:share-worker
'
