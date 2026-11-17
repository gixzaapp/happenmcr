/**
 * One-off: purge cross-source duplicate events (same title + venue + London day).
 *
 *   cd /home/deploy/happenmcr/apps/api
 *   pnpm dedupe-events
 */
import "dotenv/config";
import { purgeDuplicateEvents } from "../src/services/aggregator.js";

async function main() {
  const purged = await purgeDuplicateEvents();
  console.log(`Purged ${purged} duplicate event(s).`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
