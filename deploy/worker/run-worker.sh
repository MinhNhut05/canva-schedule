#!/usr/bin/env bash
# Wrapper that runs the Canva auto-share worker under a virtual framebuffer (Xvfb).
#
# Invoked by canva-share-worker.service. All app/bot env vars are injected by
# systemd via EnvironmentFile=, so this script only sets up the display + PATH and
# execs the worker. Can also be run by hand for a one-off dry run.
set -euo pipefail

# Repo checkout that contains scripts/canva-share-worker.ts + node_modules.
APP_DIR="${WORKER_APP_DIR:-/opt/canva-schedule/worker/app}"
cd "$APP_DIR"

# systemd starts services with a minimal PATH; make sure pnpm (corepack shim) and
# the usual locations are reachable. Adjust if pnpm lives elsewhere.
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:${HOME:-/root}/.local/share/pnpm:${PATH:-}"

# Headed Chromium needs a display. xvfb-run allocates a free virtual screen,
# sets DISPLAY for the child, and tears it down on exit.
exec xvfb-run -a --server-args="-screen 0 1280x1024x24 -ac" pnpm canva:share-worker
