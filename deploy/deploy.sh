#!/usr/bin/env bash
# HappenMCR production deploy — run as deploy only:
#   cd ~/happenmcr && ./deploy/deploy.sh
set -euo pipefail

ROOT="/home/deploy/happenmcr"
WEB_PORT=3000
API_PORT=4000
DEPLOY_USER="deploy"

red() { printf '\033[31m%s\033[0m\n' "$*"; }
green() { printf '\033[32m%s\033[0m\n' "$*"; }

die() { red "ERROR: $*"; exit 1; }

# ── 1. Must run as deploy (never root) ─────────────────────────────────────
if [[ "$(id -un)" != "$DEPLOY_USER" ]]; then
  die "Run as $DEPLOY_USER, not $(id -un). Example: su - deploy -c 'cd ~/happenmcr && ./deploy/deploy.sh'"
fi

cd "$ROOT"

# ── 2. Fix root-owned files from past mistaken deploys ───────────────────
if find "$ROOT/node_modules" -user root 2>/dev/null | head -1 | grep -q .; then
  red "WARN: root-owned node_modules detected — ask root to run:"
  red "  chown -R deploy:deploy $ROOT"
  die "Fix permissions before continuing."
fi

# ── 3. Warn if another user's PM2 holds our ports ─────────────────────────
port_owner() {
  local port=$1
  ss -lntp 2>/dev/null | grep ":${port} " | grep -oP 'pid=\K[0-9]+' | head -1
}

for port in "$WEB_PORT" "$API_PORT"; do
  pid="$(port_owner "$port")"
  if [[ -n "$pid" ]]; then
    owner="$(ps -o user= -p "$pid" 2>/dev/null | tr -d ' ' || true)"
    if [[ -n "$owner" && "$owner" != "$DEPLOY_USER" ]]; then
      die "Port $port is held by pid $pid (user $owner). As root: pm2 kill && fuser -k ${port}/tcp"
    fi
  fi
done

green "==> git pull"
git pull --ff-only

green "==> pnpm install"
pnpm install

green "==> build types"
pnpm --filter @happenmcr/types build

green "==> API: migrate + build"
(
  cd apps/api
  pnpm exec prisma migrate deploy
  pnpm exec prisma generate
  pnpm build
)

green "==> Web: clean build"
(
  cd apps/web
  rm -rf .next
  pnpm build
)

green "==> PM2 start/reload"
pm2 startOrReload "$ROOT/deploy/ecosystem.config.cjs" --update-env
pm2 save

sleep 4

# ── 4. Smoke tests (fail deploy if broken) ───────────────────────────────
green "==> Smoke tests"
fail=0

check() {
  local label=$1 url=$2
  local code
  code="$(curl -sI -o /dev/null -w '%{http_code}' "$url" || echo "000")"
  if [[ "$code" =~ ^(200|308)$ ]]; then
    green "  OK $code  $label"
  else
    red "  FAIL $code  $label"
    fail=1
  fi
}

check "API today"        "http://127.0.0.1:${API_PORT}/events/today"
check "API lens"         "http://127.0.0.1:${API_PORT}/lens/photos"
check "Web home"         "http://127.0.0.1:${WEB_PORT}/"
check "Web category"     "http://127.0.0.1:${WEB_PORT}/category/live-music"
check "Web MCR on Lens"  "http://127.0.0.1:${WEB_PORT}/mcr-buzz/mcr-on-lens"

pm2 status

if [[ "$fail" -ne 0 ]]; then
  die "Smoke tests failed. Run: pm2 logs happenmcr-web --lines 50"
fi

green "Deploy OK. Hard-refresh browser (Ctrl+Shift+R)."
