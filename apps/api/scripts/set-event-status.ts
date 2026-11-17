/**
 * Set event status: scheduled | postponed | cancelled.
 *
 * Contabo (after git pull):
 *   cd /home/deploy/happenmcr/apps/api
 *   EVENT_ID=... STATUS=postponed pnpm set-event-status
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ALLOWED = new Set(["scheduled", "postponed", "cancelled"]);

const EVENT_ID = process.env.EVENT_ID?.trim() || "";
const STATUS = process.env.STATUS?.trim().toLowerCase() || "";

async function main() {
  if (!EVENT_ID) {
    console.error("Set EVENT_ID=...");
    process.exitCode = 1;
    return;
  }
  if (!ALLOWED.has(STATUS)) {
    console.error("Set STATUS=scheduled|postponed|cancelled");
    process.exitCode = 1;
    return;
  }

  const before = await prisma.event.findUnique({
    where: { id: EVENT_ID },
    select: { id: true, title: true, source: true, status: true, startTime: true },
  });

  if (!before) {
    console.error(`Event not found: ${EVENT_ID}`);
    process.exitCode = 1;
    return;
  }

  console.log("before:", before);

  const after = await prisma.event.update({
    where: { id: EVENT_ID },
    data: { status: STATUS },
    select: { id: true, title: true, source: true, status: true, startTime: true },
  });

  console.log("after:", after);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
