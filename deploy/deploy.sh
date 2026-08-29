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
  if [[ ! -f .env.local ]]; then
    red "WARN: apps/web/.env.local missing — auth/login will fail"
  elif ! grep -qE '^AUTH_SECRET=+.+' .env.local 2>/dev/null; then
    red "WARN: AUTH_SECRET not set in apps/web/.env.local — login will fail"
  elif ! grep -qE '^AUTH_GOOGLE_ID=+.+' .env.local 2>/dev/null; then
    red "WARN: AUTH_GOOGLE_ID not set in apps/web/.env.local — Google login will fail"
  elif ! grep -qE '^DATABASE_URL=+.+' .env.local 2>/dev/null; then
    red "WARN: DATABASE_URL not set in apps/web/.env.local — copy from apps/api/.env (Auth.js needs Postgres)"
  fi
  if grep -qE '^AUTH_URL=http://localhost' .env.local 2>/dev/null; then
    red "WARN: AUTH_URL is localhost in .env.local — use https://happenmcr.com on VPS"
  fi
  rm -rf .next
  pnpm build
)

green "==> Web: database connectivity (auth adapter)"
(
  cd apps/web
  node -e "
    require('dotenv').config({ path: '.env.local' });
    if (!process.env.DATABASE_URL) {
      console.error('  DB FAIL — DATABASE_URL missing in apps/web/.env.local');
      console.error('  Copy the same DATABASE_URL line from apps/api/.env');
      process.exit(1);
    }
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    prisma.\$queryRaw\`SELECT 1\`
      .then(() => { console.log('  DB OK'); return prisma.\$disconnect(); })
      .catch((e) => { console.error('  DB FAIL — check DATABASE_URL in apps/web/.env.local'); console.error(e.message); process.exit(1); });
  "
)

green "==> PM2 start/reload"
pm2 startOrReload "$ROOT/deploy/ecosystem.config.cjs" --update-env
pm2 restart happenmcr-web --update-env
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

# Every referenced JS chunk must exist — missing chunks → "Application error" on click
verify_chunks() {
  local label=$1 path=$2
  local html chunk code
  html="$(curl -sL "http://127.0.0.1:${WEB_PORT}${path}" || true)"
  while IFS= read -r chunk; do
    [[ -z "$chunk" ]] && continue
    code="$(curl -sI -o /dev/null -w '%{http_code}' -g "http://127.0.0.1:${WEB_PORT}${chunk}" || echo "000")"
    if [[ "$code" != "200" ]]; then
      red "  MISSING CHUNK $code  ${chunk}  (page: ${path})"
      fail=1
    fi
  done < <(echo "$html" | grep -oE '/_next/static/chunks/[^"]+\.js' | sort -u)
  if [[ "$fail" -eq 0 ]]; then
    green "  OK chunks  ${label}"
  fi
}

check "API today"        "http://127.0.0.1:${API_PORT}/events/today"
check "API lens"         "http://127.0.0.1:${API_PORT}/lens/photos"
check "Web home"         "http://127.0.0.1:${WEB_PORT}/"
check "Web category"     "http://127.0.0.1:${WEB_PORT}/category/live-music"
check "Web MCR on Lens"  "http://127.0.0.1:${WEB_PORT}/mcr-buzz/mcr-on-lens"
check "Web events today" "http://127.0.0.1:${WEB_PORT}/events/today"

verify_chunks "home" "/"
verify_chunks "events/today" "/events/today"
verify_chunks "category" "/category/live-music"

pm2 status

if [[ "$fail" -ne 0 ]]; then
  die "Smoke tests failed. Run: pm2 logs happenmcr-web --lines 50"
fi

green "Deploy OK. Hard-refresh browser (Ctrl+Shift+R)."
