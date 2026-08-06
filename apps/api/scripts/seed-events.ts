import { PrismaClient } from "@prisma/client";
import { getTodayRange, getWeekendRange } from "../src/lib/dates.js";

const prisma = new PrismaClient();

const today = getTodayRange();
const weekend = getWeekendRange();

const samples = [
  {
    title: "Northern Quarter Lunch Market",
    description: "Street food around Stevenson Square.",
    startTime: new Date(today.start.getTime() + 12 * 60 * 60 * 1000),
    endTime: new Date(today.start.getTime() + 15 * 60 * 60 * 1000),
    venueName: "Stevenson Square",
    venueAddress: "Northern Quarter, Manchester",
    lat: 53.4831,
    lon: -2.2369,
    category: "food",
    tags: ["market", "food"],
    source: "seed",
    isFree: true,
  },
  {
    title: "Canal Street Weekend Party",
    description: "Live DJs along Canal Street.",
    startTime: new Date(weekend.start.getTime() + 20 * 60 * 60 * 1000),
    endTime: new Date(weekend.start.getTime() + 23 * 60 * 60 * 1000),
    venueName: "Canal Street",
    venueAddress: "Gay Village, Manchester",
    lat: 53.4774,
    lon: -2.2361,
    category: "nightlife",
    tags: ["music", "nightlife"],
    source: "seed",
    isFree: false,
    ticketUrl: "https://example.com/tickets",
  },
  {
    title: "Free Gallery Afternoon",
    description: "Drop-in exhibition at HOME.",
    startTime: new Date(weekend.start.getTime() + 36 * 60 * 60 * 1000),
    endTime: new Date(weekend.start.getTime() + 40 * 60 * 60 * 1000),
    venueName: "HOME",
    venueAddress: "2 Tony Wilson Place, Manchester",
    lat: 53.4735,
    lon: -2.2471,
    category: "arts",
    tags: ["gallery", "arts"],
    source: "seed",
    isFree: true,
  },
];

await prisma.event.deleteMany({ where: { source: "seed" } });
const created = await prisma.event.createMany({ data: samples });
console.log(JSON.stringify({ created: created.count }));
await prisma.$disconnect();
