/**
 * Load production env from apps/api/.env and apps/web/.env.local.
 * Used by ecosystem.config.cjs and deploy.sh — single source of truth.
 */
const fs = require("fs");
const path = require("path");

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

function loadProductionEnv(root) {
  const apiEnv = parseEnvFile(path.join(root, "apps/api/.env"));
  const webEnv = parseEnvFile(path.join(root, "apps/web/.env.local"));
  const databaseUrl = webEnv.DATABASE_URL || apiEnv.DATABASE_URL || "";
  return { apiEnv, webEnv, databaseUrl };
}

module.exports = { parseEnvFile, loadProductionEnv };
