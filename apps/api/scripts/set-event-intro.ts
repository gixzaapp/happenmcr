/**
 * Set HappenMCR custom intro / local tip on an event (survives re-ingest).
 *
 *   EVENT_ID=... CUSTOM_INTRO='...' LOCAL_TIP='...' pnpm set-event-intro
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const EVENT_ID = process.env.EVENT_ID?.trim() || "";
const CUSTOM_INTRO = process.env.CUSTOM_INTRO?.trim() || "";
const LOCAL_TIP = process.env.LOCAL_TIP?.trim() || "";

async function main() {
  if (!EVENT_ID) {
    console.error("Set EVENT_ID=...");
    process.exitCode = 1;
    return;
  }
  if (!CUSTOM_INTRO && !LOCAL_TIP) {
    console.error("Set CUSTOM_INTRO and/or LOCAL_TIP");
    process.exitCode = 1;
    return;
  }

  const before = await prisma.event.findUnique({
    where: { id: EVENT_ID },
    select: {
      id: true,
      title: true,
      customIntro: true,
      localTip: true,
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
      ...(CUSTOM_INTRO ? { customIntro: CUSTOM_INTRO.slice(0, 2000) } : {}),
      ...(LOCAL_TIP ? { localTip: LOCAL_TIP.slice(0, 500) } : {}),
    },
    select: {
      id: true,
      title: true,
      customIntro: true,
      localTip: true,
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
