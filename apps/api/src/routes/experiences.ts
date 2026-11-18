import { Router, type Router as ExpressRouter } from "express";
import type { ApiResponse } from "@happenmcr/types";
import {
  fetchViatorManchesterExperiences,
  type ViatorExperienceDto,
} from "../services/sources/viator.js";

const router: ExpressRouter = Router();

const CATEGORIES = new Set([
  "walking-city-tours",
  "stadium-sports",
  "food-drink",
  "sightseeing-attractions",
  "unique-experiences",
  "free-things-to-do",
]);

/**
 * GET /experiences
 * Query: category? — optional Things to Do category filter
 *
 * Live Viator Manchester products (Basic Access). Manual picks stay on the web.
 */
router.get("/", async (req, res) => {
  const categoryRaw =
    typeof req.query.category === "string" ? req.query.category.trim() : "";
  const category =
    categoryRaw && CATEGORIES.has(categoryRaw) ? categoryRaw : null;

  const { experiences, error } = await fetchViatorManchesterExperiences();
  const filtered: ViatorExperienceDto[] = category
    ? experiences.filter((item) => item.category === category)
    : experiences;

  const body: ApiResponse<ViatorExperienceDto[]> & {
    meta?: { provider: string; total: number; error?: string };
  } = {
    data: filtered,
    meta: {
      provider: "viator",
      total: filtered.length,
      ...(error ? { error } : {}),
    },
  };

  // Always 200 with data[] — page merges manual picks when Viator key/API fails.
  // meta.error surfaces Invalid API Key / upstream failures for ops logs.
  res.json(body);
});

export default router;
