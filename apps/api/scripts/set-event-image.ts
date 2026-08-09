/**
 * One-off: set Westlife event image to a stock Pixabay URL.
 *
 * Contabo (after git pull):
 *   cd /home/deploy/happenmcr/apps/api
 *   pnpm set-event-image
 *
 * Optional overrides:
 *   EVENT_ID=... IMAGE_URL=... pnpm set-event-image
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const EVENT_ID =
  process.env.EVENT_ID?.trim() || "cmsgv5xtr00flktut218b74u8";
const IMAGE_URL =
  process.env.IMAGE_URL?.trim() ||
  "https://cdn.pixabay.com/photo/2016/11/22/21/36/audience-1850665_1280.jpg";

async function main() {
  const before = await prisma.event.findUnique({
    where: { id: EVENT_ID },
    select: { id: true, title: true, source: true, imageUrl: true },
  });

  if (!before) {
    console.error(`Event not found: ${EVENT_ID}`);
    process.exitCode = 1;
    return;
  }

  console.log("before:", before);

  const after = await prisma.event.update({
    where: { id: EVENT_ID },
    data: { imageUrl: IMAGE_URL },
    select: { id: true, title: true, source: true, imageUrl: true },
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
