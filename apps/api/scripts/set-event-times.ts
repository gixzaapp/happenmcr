/**
 * Set event start/end times as Europe/London wall clock.
 *
 * Contabo (after git pull):
 *   cd /home/deploy/happenmcr/apps/api
 *   EVENT_ID=... START="2026-11-26T11:00" END="2026-11-26T19:00" pnpm set-event-times
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { parseLondonDateTime } from "../src/lib/dates.js";

const prisma = new PrismaClient();

const EVENT_ID = process.env.EVENT_ID?.trim() || "";
const START = process.env.START?.trim() || "";
const END = process.env.END?.trim() || "";

async function main() {
  if (!EVENT_ID) {
    console.error("Set EVENT_ID=...");
    process.exitCode = 1;
    return;
  }
  if (!START) {
    console.error('Set START="YYYY-MM-DDTHH:mm" (Manchester / UK local time)');
    process.exitCode = 1;
    return;
  }

  const startTime = parseLondonDateTime(START);
  if (!startTime) {
    console.error(`Invalid START: ${START}`);
    process.exitCode = 1;
    return;
  }

  let endTime: Date | null = null;
  if (END) {
    endTime = parseLondonDateTime(END);
    if (!endTime) {
      console.error(`Invalid END: ${END}`);
      process.exitCode = 1;
      return;
    }
  }

  const before = await prisma.event.findUnique({
    where: { id: EVENT_ID },
    select: {
      id: true,
      title: true,
      startTime: true,
      endTime: true,
    },
  });

  if (!before) {
    console.error(`Event not found: ${EVENT_ID}`);
    process.exitCode = 1;
    return;
  }

  console.log("before:", before);

  const after = await prisma.event.update({
    where: { id: EVENT_ID },
    data: {
      startTime,
      endTime,
    },
    select: {
      id: true,
      title: true,
      startTime: true,
      endTime: true,
    },
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
