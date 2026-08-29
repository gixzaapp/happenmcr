/**
 * PM2 process definitions for production.
 * Always start via: pm2 startOrReload deploy/ecosystem.config.cjs --update-env
 * Run as the deploy user only — never root.
 *
 * Env is loaded from apps/api/.env + apps/web/.env.local (see deploy/env.cjs).
 */
const path = require("path");
const { loadProductionEnv } = require("./env.cjs");

const ROOT = process.env.HAPPENMCR_ROOT || "/home/deploy/happenmcr";
const { apiEnv, webEnv, databaseUrl } = loadProductionEnv(ROOT);

const webEnvMerged = {
  NODE_ENV: "production",
  PORT: "3000",
  API_URL: webEnv.API_URL || "http://127.0.0.1:4000",
  AUTH_URL: webEnv.AUTH_URL || "https://happenmcr.com",
  NEXT_PUBLIC_SITE_URL: webEnv.NEXT_PUBLIC_SITE_URL || "https://happenmcr.com",
  NEXT_PUBLIC_API_URL: webEnv.NEXT_PUBLIC_API_URL || "https://happenmcr.com/api",
  DATABASE_URL: databaseUrl,
  AUTH_SECRET: webEnv.AUTH_SECRET || "",
  AUTH_GOOGLE_ID: webEnv.AUTH_GOOGLE_ID || "",
  AUTH_GOOGLE_SECRET: webEnv.AUTH_GOOGLE_SECRET || "",
  AUTH_FACEBOOK_ID: webEnv.AUTH_FACEBOOK_ID || "",
  AUTH_FACEBOOK_SECRET: webEnv.AUTH_FACEBOOK_SECRET || "",
  MAPBOX_ACCESS_TOKEN: webEnv.MAPBOX_ACCESS_TOKEN || "",
  NEXT_PUBLIC_GTM_ID: webEnv.NEXT_PUBLIC_GTM_ID || "",
};

module.exports = {
  apps: [
    {
      name: "happenmcr-api",
      cwd: path.join(ROOT, "apps/api"),
      script: "pnpm",
      args: "start",
      interpreter: "none",
      env: {
        NODE_ENV: "production",
        ...apiEnv,
      },
    },
    {
      name: "happenmcr-web",
      cwd: path.join(ROOT, "apps/web"),
      script: "pnpm",
      args: "start",
      interpreter: "none",
      env: webEnvMerged,
    },
  ],
};
