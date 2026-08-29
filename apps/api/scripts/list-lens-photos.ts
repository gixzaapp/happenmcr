/**
 * List MCR on Lens photos (read-only — changes nothing).
 *
 * Usage (from apps/api):
 *   pnpm list-lens-photos
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const photos = await prisma.lensPhoto.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      imageKey: true,
      caption: true,
      uploaderName: true,
      createdAt: true,
    },
  });

  if (photos.length === 0) {
    console.log("No MCR on Lens photos in the database.");
    return;
  }

  console.log(`MCR on Lens photos: ${photos.length}\n`);
  console.log("(Events and other uploads are NOT listed here.)\n");

  for (const photo of photos) {
    console.log(`ID:      ${photo.id}`);
    console.log(`Caption: ${photo.caption ?? "(none)"}`);
    console.log(`By:      ${photo.uploaderName ?? "(unknown)"}`);
    console.log(`File:    ${photo.imageKey}`);
    console.log(`Date:    ${photo.createdAt.toISOString()}`);
    console.log("");
  }

  console.log("To remove ONE photo:");
  console.log("  pnpm delete-lens-photo -- <photo-id>");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
