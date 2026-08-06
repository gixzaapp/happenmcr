/**
 * List recent event submissions.
 *
 * Usage (from apps/api):
 *   pnpm exec tsx scripts/list-submissions.ts
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.eventSubmission.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      title: true,
      startTime: true,
      venueName: true,
      isFree: true,
      ticketUrl: true,
      promoImageUrl: true,
      contactEmail: true,
      status: true,
      createdAt: true,
    },
  });

  if (rows.length === 0) {
    console.log("No event submissions found.");
    return;
  }

  console.log(`Found ${rows.length} submission(s):\n`);
  for (const row of rows) {
    console.log("─".repeat(60));
    console.log(`ID:        ${row.id}`);
    console.log(`Title:     ${row.title}`);
    console.log(`When:      ${row.startTime.toISOString()}`);
    console.log(`Venue:     ${row.venueName}`);
    console.log(`Pricing:   ${row.isFree ? "Free" : "Paid"}`);
    console.log(`URL:       ${row.ticketUrl ?? "(none)"}`);
    console.log(`Image:     ${row.promoImageUrl ?? "(none)"}`);
    console.log(`Contact:   ${row.contactEmail}`);
    console.log(`Status:    ${row.status}`);
    console.log(`Created:   ${row.createdAt.toISOString()}`);
  }
  console.log("─".repeat(60));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
