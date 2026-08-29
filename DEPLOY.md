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

## Host redirects (fix GSC “Duplicate without user-selected canonical”)

Nginx must send **www** and **http** to `https://happenmcr.com` in **one hop**.  
See [`deploy/nginx-host-redirects.conf.example`](deploy/nginx-host-redirects.conf.example).

Quick test:

```bash
curl -sI --max-redirs 0 http://www.happenmcr.com/ | grep -iE 'HTTP/|location:'
curl -sI --max-redirs 0 https://www.happenmcr.com/ | grep -iE 'HTTP/|location:'
```

Both should `Location: https://happenmcr.com/` (not `https://www.happenmcr.com/`).

---

## Full redeploy (API + web)

Do **not** `pm2 stop` the web app while building — that causes nginx **502**. Build first, then restart.

Always wipe `apps/web/.next` before building web. Skipping that leaves HTML referencing old `/_next/static/chunks/*.js` hashes → browser **“Application error: a client-side exception…”** / `ChunkLoadError`.

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

# Web — wipe .next so chunk hashes match the new build (keep PM2 running during build)
cd apps/web
rm -rf .next
pnpm build
cd ../..

pm2 restart happenmcr-api --update-env
PORT=3000 API_URL=http://127.0.0.1:4000 pm2 restart happenmcr-web --update-env

pm2 save
pm2 status

# Warm key routes (fresh ISR against the new build)
curl -sI "http://127.0.0.1:3000/"
curl -sI "http://127.0.0.1:3000/events/today"
curl -sI "http://127.0.0.1:3000/events/weekend"
curl -sI "http://127.0.0.1:3000/category/live-music"
curl -sI "http://127.0.0.1:3000/mcr-buzz/mcr-on-lens"
curl -sI "http://127.0.0.1:3000/mcr-buzz/mcr-on-lens/upload"
curl -sI "http://127.0.0.1:3000/mcr-buzz/mcr-on-lens/map"

# Public smoke checks
curl -sI https://happenmcr.com | head -10
curl -sI "https://happenmcr.com/events/weekend" | head -10
curl -sI "https://happenmcr.com/mcr-buzz/mcr-on-lens" | head -10
curl -s "http://127.0.0.1:4000/lens/photos" | head -c 200; echo
```

Verify no missing chunks (every referenced JS must be **200**):

```bash
HTML=$(curl -sL "https://happenmcr.com/events/weekend")
echo "$HTML" | grep -oE '/_next/static/chunks/[^"]+\.js' | sort -u | while read -r CHUNK; do
  CODE=$(curl -sI -o /dev/null -w '%{http_code}' "https://happenmcr.com$CHUNK")
  echo "$CODE  $CHUNK"
done
```

If any line is `404`, rebuild web again (`rm -rf .next && pnpm build` + restart). Hard-refresh the browser after a clean deploy.

If the API has no `/health` route, any known public API path is fine.

---

## Web-only redeploy

Same `.next` wipe — required every time, not only when something breaks.

```bash
cd /home/deploy/happenmcr
git pull
pnpm --filter @happenmcr/types build   # only if types changed

cd apps/web
rm -rf .next
pnpm build
cd ../..

PORT=3000 API_URL=http://127.0.0.1:4000 pm2 restart happenmcr-web --update-env
pm2 save

curl -sI "http://127.0.0.1:3000/events/weekend"
curl -sI "https://happenmcr.com/events/weekend" | head -10
```

---

## Safe deploy pattern (avoid 502 + chunk 404)

1. **Never** `pm2 stop happenmcr-web` before `pnpm build` finishes.
2. **Always** `rm -rf apps/web/.next` before `pnpm build` (prevents ChunkLoadError).
3. After every web build: `pm2 restart happenmcr-web` with **`PORT=3000`** and `API_URL=http://127.0.0.1:4000`.
4. Warm key routes, then confirm chunks are **200** (script in Full redeploy above).

### Emergency fix (site already showing “Application error”)

```bash
cd /home/deploy/happenmcr/apps/web
rm -rf .next
pnpm build
PORT=3000 API_URL=http://127.0.0.1:4000 pm2 restart happenmcr-web --update-env
pm2 save

curl -sI "https://happenmcr.com/"
curl -sI "https://happenmcr.com/events/today"
curl -sI "https://happenmcr.com/events/weekend"
curl -sI "https://happenmcr.com/category/live-music"
```

Then hard-refresh (Ctrl+Shift+R).
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
| `apps/api/.env` | `DATABASE_URL`, `PORT=4000`, `SITE_URL=https://happenmcr.com`, ingest/API keys, optional `UPLOADS_DIR` / `PUBLIC_UPLOADS_BASE_URL` |
| `apps/web/.env.local` | `API_URL=http://127.0.0.1:4000`, `NEXT_PUBLIC_SITE_URL=https://happenmcr.com`, **`DATABASE_URL`** (same DB as API — Auth.js), **`AUTH_SECRET`**, **`AUTH_URL=https://happenmcr.com`**, **`AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`**, **`AUTH_FACEBOOK_ID` / `AUTH_FACEBOOK_SECRET`**, **`MAPBOX_ACCESS_TOKEN`**, optional `NEXT_PUBLIC_GTM_ID` |

OAuth redirect URIs (production): `https://happenmcr.com/auth/callback/google` and `.../facebook`. Auth routes live at `/auth/*` (not `/api/auth/*` — nginx sends `/api` to Express).

**MCR on Lens** needs `MAPBOX_ACCESS_TOKEN` in `apps/web/.env.local` (Mapbox public token). Without it, location autosuggest and the map page fail.

Do not commit real secrets. Rotate any password that was pasted into chat or tickets.

---

## Quick post-deploy checklist

- [ ] `pm2 status` — both `online`
- [ ] Web listens on **3000**, API on **4000** (only one `happenmcr-web`)
- [ ] Deploy used `rm -rf apps/web/.next` before web build
- [ ] `https://happenmcr.com` → 200 (not 502)
- [ ] Chunk status script — no `404` lines
- [ ] `/events/today`, `/events/weekend`, `/category/live-music` load without client exception
- [ ] `/mcr-buzz/mcr-on-lens`, `/upload`, `/map` load
- [ ] `MAPBOX_ACCESS_TOKEN` set on web (autosuggest + map)
- [ ] Prisma migrations applied (`lens_photos` table exists)
- [ ] A sample event page + `/media/event/{id}?v=card` if images changed
