import dotenv from "dotenv";
import path from "node:path";

/**
 * Load apps/api/.env and let file values win over stale PM2/shell env.
 * Import this module first: `import "./load-env.js"`.
 */
const envPath = path.resolve(process.cwd(), ".env");
const result = dotenv.config({ path: envPath, override: true });
if (result.error) {
  console.warn(`[env] could not load ${envPath}: ${result.error.message}`);
} else {
  console.info(`[env] loaded ${envPath} (override=true)`);
}

export {};
