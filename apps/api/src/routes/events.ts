import { Router, type Router as ExpressRouter } from "express";
import type { Prisma } from "@prisma/client";
import type {
  ApiResponse,
  CategoryEventsResponse,
  Event as EventDto,
} from "@happenmcr/types";
import { categoryMatchesSlug, slugifyCategory } from "@happenmcr/types";
import { prisma } from "../db.js";
import { getDayRange, getTodayRange, getWeekendRange } from "../lib/dates.js";
import { toEventDto } from "../lib/mappers.js";
import { eventMatchesQuery } from "../lib/search.js";

const router: ExpressRouter = Router();

async function listEvents(where?: Prisma.EventWhereInput): Promise<EventDto[]> {
  const events = await prisma.event.findMany({
    where,
    orderBy: { startTime: "asc" },
  });
  return events.map(toEventDto);
}

router.get("/", async (_req, res) => {
  try {
    const data = await listEvents();
    const body: ApiResponse<EventDto[]> = { data };
    res.json(body);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ data: [], error: "Failed to fetch events" } satisfies ApiResponse<EventDto[]>);
  }
});

router.get("/today", async (_req, res) => {
  try {
    const { start, end } = getTodayRange();
    const data = await listEvents({
      startTime: { gte: start, lte: end },
    });
    const body: ApiResponse<EventDto[]> = { data };
    res.json(body);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ data: [], error: "Failed to fetch today's events" } satisfies ApiResponse<EventDto[]>);
  }
});

router.get("/weekend", async (_req, res) => {
  try {
    const { start, end } = getWeekendRange();
    const data = await listEvents({
      startTime: { gte: start, lte: end },
    });
    const body: ApiResponse<EventDto[]> = { data };
    res.json(body);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ data: [], error: "Failed to fetch weekend events" } satisfies ApiResponse<EventDto[]>);
  }
});

router.get("/free", async (_req, res) => {
  try {
    const data = await listEvents({ isFree: true });
    const body: ApiResponse<EventDto[]> = { data };
    res.json(body);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ data: [], error: "Failed to fetch free events" } satisfies ApiResponse<EventDto[]>);
  }
});

router.get("/search", async (req, res) => {
  try {
    const q = String(req.query.q ?? "").trim();
    if (!q) {
      const body: ApiResponse<EventDto[]> = { data: [] };
      res.json(body);
      return;
    }

    const events = await listEvents();
    const data = events.filter((event) => eventMatchesQuery(event, q));
    const body: ApiResponse<EventDto[]> = { data };
    res.json(body);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      data: [],
      error: "Failed to search events",
    } satisfies ApiResponse<EventDto[]>);
  }
});

router.get("/date/:ymd", async (req, res) => {
  try {
    const ymd = String(req.params.ymd).trim();
    const range = getDayRange(ymd);
    if (!range) {
      res.status(400).json({
        data: [],
        error: "Invalid date. Use YYYY-MM-DD.",
      } satisfies ApiResponse<EventDto[]>);
      return;
    }

    const data = await listEvents({
      startTime: { gte: range.start, lte: range.end },
    });
    const body: ApiResponse<EventDto[]> = { data };
    res.json(body);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      data: [],
      error: "Failed to fetch events for date",
    } satisfies ApiResponse<EventDto[]>);
  }
});

router.get("/category/:slug", async (req, res) => {
  try {
    const slug = String(req.params.slug).trim().toLowerCase();
    if (!slug) {
      res.status(404).json({
        data: [],
        error: "Category not found",
      } satisfies CategoryEventsResponse);
      return;
    }

    const events = await listEvents({
      category: { not: null },
    });

    let categoryName: string | null = null;
    const data = events.filter((event) => {
      if (!event.category) return false;
      if (!categoryMatchesSlug(event.category, slug)) return false;
      categoryName ??= event.category;
      return true;
    });

    if (!categoryName) {
      res.status(404).json({
        data: [],
        error: "Category not found",
      } satisfies CategoryEventsResponse);
      return;
    }

    const body: CategoryEventsResponse = {
      data,
      category: { slug: slugifyCategory(categoryName), name: categoryName },
    };
    res.json(body);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      data: [],
      error: "Failed to fetch category events",
    } satisfies CategoryEventsResponse);
  }
});

router.get("/:id", async (req, res) => {
  try {
    const event = await prisma.event.findUnique({
      where: { id: String(req.params.id) },
    });

    if (!event) {
      res.status(404).json({ error: "Event not found" });
      return;
    }

    const body: ApiResponse<EventDto> = { data: toEventDto(event) };
    res.json(body);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch event" });
  }
});

export default router;
