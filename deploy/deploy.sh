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

# ── 1b. Sync DATABASE_URL from API → web (one DB, no duplicate manual copy) ─
sync_web_database_url() {
  local api_env="$ROOT/apps/api/.env"
  local web_env="$ROOT/apps/web/.env.local"
  [[ -f "$api_env" ]] || return 0
  [[ -f "$web_env" ]] || touch "$web_env"
  if grep -qE '^DATABASE_URL=+.+' "$web_env" 2>/dev/null; then
    return 0
  fi
  local line
  line="$(grep -E '^DATABASE_URL=' "$api_env" | head -1 || true)"
  if [[ -n "$line" ]]; then
    green "  Syncing DATABASE_URL from apps/api/.env → apps/web/.env.local"
    printf '\n%s\n' "$line" >> "$web_env"
  fi
}
sync_web_database_url

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

green "==> Web: env check"
(
  cd "$ROOT"
  node -e "
    const { loadProductionEnv } = require('./deploy/env.cjs');
    const { webEnv, databaseUrl } = loadProductionEnv(process.cwd());
    const missing = [];
    if (!webEnv.AUTH_SECRET) missing.push('AUTH_SECRET');
    if (!webEnv.AUTH_GOOGLE_ID) missing.push('AUTH_GOOGLE_ID');
    if (!webEnv.AUTH_GOOGLE_SECRET) missing.push('AUTH_GOOGLE_SECRET');
    if (!databaseUrl) missing.push('DATABASE_URL (apps/web/.env.local or apps/api/.env)');
    if (missing.length) {
      console.error('  AUTH CONFIG FAIL — add to apps/web/.env.local:');
      missing.forEach((k) => console.error('    ' + k));
      process.exit(1);
    }
    if ((webEnv.AUTH_URL || '').includes('localhost')) {
      console.error('  AUTH CONFIG FAIL — AUTH_URL must be https://happenmcr.com on VPS');
      process.exit(1);
    }
    console.log('  Auth env OK');
  "
)

green "==> Web: clean build"
(
  cd apps/web
  rm -rf .next
  pnpm build
)

green "==> Web: database connectivity (auth adapter)"
(
  cd "$ROOT/apps/web"
  node -e "
    const path = require('path');
    const root = path.resolve(process.cwd(), '../..');
    const { loadProductionEnv } = require(path.join(root, 'deploy/env.cjs'));
    const { databaseUrl } = loadProductionEnv(root);
    process.env.DATABASE_URL = databaseUrl;
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    prisma.\$queryRaw\`SELECT 1\`
      .then(() => { console.log('  DB OK'); return prisma.\$disconnect(); })
      .catch((e) => { console.error('  DB FAIL —', e.message); process.exit(1); });
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
