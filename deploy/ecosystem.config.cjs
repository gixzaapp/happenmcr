/**
 * PM2 process definitions for production.
 * Always start via: pm2 startOrReload deploy/ecosystem.config.cjs --update-env
 * Run as the deploy user only — never root.
 */
module.exports = {
  apps: [
    {
      name: "happenmcr-api",
      cwd: "/home/deploy/happenmcr/apps/api",
      script: "pnpm",
      args: "start",
      interpreter: "none",
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "happenmcr-web",
      cwd: "/home/deploy/happenmcr/apps/web",
      script: "pnpm",
      args: "start",
      interpreter: "none",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
        API_URL: "http://127.0.0.1:4000",
      },
    },
  ],
};
