# HappenMCR — Contabo deploy

Deployment notes for the production VPS (`happenmcr.com`).  
App lives at `/home/deploy/happenmcr` (adjust if your path differs).  
Process manager: **PM2** (`happenmcr-api`, `happenmcr-web`).  
Postgres: **Docker** (no OS `postgres` user).  
Proxy: **nginx** → web `:3000`, API usually under `/api` → `:4000`.

| Service | Port | PM2 name |
|---------|------|----------|
| Next.js web | **3000** | `happenmcr-web` |
| Express API | **4000** | `happenmcr-api` |

Web SSR must call the API on loopback: `API_URL=http://127.0.0.1:4000`.

---

## Full redeploy (API + web)

Do **not** `pm2 stop` the web app while building — that causes nginx **502**. Build first, then restart.

```bash
cd /home/deploy/happenmcr

git pull
pnpm install

pnpm --filter @happenmcr/types build

# API
cd apps/api
pnpm exec prisma migrate deploy
pnpm exec prisma generate
pnpm build
cd ../..

# Web (keep old process running during build)
cd apps/web
pnpm build
cd ../..

pm2 restart happenmcr-api --update-env
PORT=3000 API_URL=http://127.0.0.1:4000 pm2 restart happenmcr-web --update-env

pm2 save
pm2 status

# Smoke checks
curl -sI http://127.0.0.1:4000/health | head -5
curl -sI http://127.0.0.1:3000 | head -5
curl -sI https://happenmcr.com | head -10
```

If the API has no `/health` route, any known public API path is fine.

---

## Web-only redeploy

```bash
cd /home/deploy/happenmcr
git pull
pnpm --filter @happenmcr/types build   # only if types changed

cd apps/web
pnpm build
cd ../..

PORT=3000 API_URL=http://127.0.0.1:4000 pm2 restart happenmcr-web --update-env
pm2 save

curl -sI https://happenmcr.com | head -10
```

---

## Safe deploy pattern (avoid 502 + chunk 404)

1. **Never** `pm2 stop happenmcr-web` before `pnpm build` finishes.
2. After every web build: `pm2 restart happenmcr-web` with **`PORT=3000`**.
3. If listing pages show *“Application error”* / `ChunkLoadError` (stale ISR HTML → missing JS):

```bash
cd /home/deploy/happenmcr/apps/web
rm -rf .next/cache
pnpm build
PORT=3000 API_URL=http://127.0.0.1:4000 pm2 restart happenmcr-web --update-env

# Warm key routes
curl -sI "https://happenmcr.com/events/today"
curl -sI "https://happenmcr.com/events/weekend"
curl -sI "https://happenmcr.com/"
```

Confirm the page chunk is **200**, not 404:

```bash
CHUNK=$(curl -sL "https://happenmcr.com/events/today" \
  | grep -oE '/_next/static/chunks/app/\(site\)/events/\(browse\)/today/page-[^"]+\.js' \
  | head -1)
echo "$CHUNK"
curl -sI "https://happenmcr.com$CHUNK" | head -5
```

---

## Web stuck on port 4000 (`EADDRINUSE :::4000`)

The API owns **4000**. If web starts with `PORT=4000` it will crash-loop.

```bash
ss -lntp | grep -E '3000|4000'
pm2 delete happenmcr-web

PORT=3000 API_URL=http://127.0.0.1:4000 pm2 start pnpm \
  --name happenmcr-web \
  --cwd /home/deploy/happenmcr/apps/web \
  -- start

pm2 save
pm2 env happenmcr-web | grep -E 'PORT|API_URL'
```

Ensure `apps/web/.env.local` (if present) does **not** set `PORT=4000`.

---

## Postgres

There is **no** `sudo -u postgres` on this VPS (Docker only).

### Open with host `psql` (preferred)

Prisma’s `DATABASE_URL` includes `?schema=public` — **strip that** for `psql`:

```bash
cd /home/deploy/happenmcr/apps/api

# Read URL from .env, strip Prisma-only querystring
DB_URL=$(grep -E '^DATABASE_URL=' .env | cut -d= -f2- | tr -d '"' | sed 's/?.*//')
psql "$DB_URL"
```

### Or via Docker

```bash
docker ps | grep -i postgres
docker exec -it happenmcr-postgres psql -U postgres -d happenmcr
```

Exit: `\q`.

### One-off event image (Prisma — handles `?schema=public`)

```bash
cd /home/deploy/happenmcr/apps/api
pnpm set-event-image

# Optional overrides
EVENT_ID=... IMAGE_URL='https://...' pnpm set-event-image
```

Script: `apps/api/scripts/set-event-image.ts`  
Default: Westlife `cmsgv5xtr00flktut218b74u8` → Pixabay concert crowd image.

Stock CDNs (`cdn.pixabay.com`, `images.unsplash.com`) are allowed in the web app even when `source` is still a scraper. Re-ingest preserves those overrides in the API aggregator.

After changing an event image, hard-refresh the event page (and ensure web was rebuilt with the stock-CDN allowlist).

---

## Useful PM2 / nginx

```bash
pm2 status
pm2 logs happenmcr-web --lines 50
pm2 logs happenmcr-api --lines 50

sudo nginx -t && sudo systemctl reload nginx
```

---

## Env reminders

| App | Important vars |
|-----|----------------|
| `apps/api/.env` | `DATABASE_URL`, `PORT=4000`, `SITE_URL=https://happenmcr.com`, ingest/API keys |
| `apps/web/.env.local` | `API_URL=http://127.0.0.1:4000`, `NEXT_PUBLIC_SITE_URL=https://happenmcr.com`, optional `NEXT_PUBLIC_GTM_ID` |

Do not commit real secrets. Rotate any password that was pasted into chat or tickets.

---

## Quick post-deploy checklist

- [ ] `pm2 status` — both `online`
- [ ] Web listens on **3000**, API on **4000**
- [ ] `https://happenmcr.com` → 200 (not 502)
- [ ] `/events/today` loads without ChunkLoadError
- [ ] A sample event page + `/media/event/{id}?v=card` if images changed
