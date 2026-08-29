/**
 * Delete ONE MCR on Lens photo by id (database row + its upload file).
 *
 * Usage (from apps/api):
 *   pnpm list-lens-photos                    # get the id first
 *   pnpm delete-lens-photo -- clxxxxxxxxxxxx
 *
 * Nothing is deleted unless you pass a photo id.
 * Does not touch events, submissions, or other uploads.
 */
import "dotenv/config";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function uploadsDir(): string {
  return path.resolve(
    process.env.UPLOADS_DIR?.trim() || path.join(process.cwd(), "uploads"),
  );
}

async function deleteLocalUpload(key: string): Promise<void> {
  const absolute = path.join(uploadsDir(), key);
  try {
    await unlink(absolute);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== "ENOENT") throw error;
  }
}

async function main() {
  const id = process.argv.slice(2).find((arg) => !arg.startsWith("-"))?.trim();

  if (!id) {
    console.log("Usage: pnpm delete-lens-photo -- <photo-id>");
    console.log("");
    console.log("Run pnpm list-lens-photos first to see ids.");
    process.exit(1);
  }

  const photo = await prisma.lensPhoto.findUnique({
    where: { id },
    select: {
      id: true,
      imageKey: true,
      caption: true,
      uploaderName: true,
    },
  });

  if (!photo) {
    console.error(`No lens photo found with id: ${id}`);
    console.log("Run pnpm list-lens-photos to see valid ids.");
    process.exit(1);
  }

  console.log("Will delete this MCR on Lens photo only:\n");
  console.log(`  ID:      ${photo.id}`);
  console.log(`  Caption: ${photo.caption ?? "(none)"}`);
  console.log(`  By:      ${photo.uploaderName ?? "(unknown)"}`);
  console.log(`  File:    ${photo.imageKey}`);
  console.log("");

  await prisma.lensPhoto.delete({ where: { id: photo.id } });

  try {
    await deleteLocalUpload(photo.imageKey);
    console.log("Removed database row and upload file.");
  } catch (error) {
    console.log("Removed database row.");
    console.warn("Upload file could not be deleted:", error);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
