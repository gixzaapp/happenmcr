import "dotenv/config";
import { runVenueScrapers } from "../src/services/scrapers/index.js";

const events = await runVenueScrapers();
console.log(
  JSON.stringify(
    {
      scraped: events.length,
      sources: [...new Set(events.map((event) => event.source))],
      sample: events.slice(0, 3),
    },
    null,
    2,
  ),
);
