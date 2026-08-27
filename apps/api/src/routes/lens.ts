import { Router, type Router as ExpressRouter } from "express";
import multer from "multer";
import type { ApiResponse } from "@happenmcr/types";
import { prisma } from "../db.js";
import {
  deleteLocalUpload,
  getObjectStorage,
} from "../services/storage/index.js";
import {
  buildLensImageKey,
  detectImageMime,
  isAllowedLensImageMime,
  lensImageMaxBytes,
} from "../services/storage/lens-image.js";
import { isLensReportCategory } from "../services/lens/report-categories.js";
import { notifyLensPhotoReport } from "../services/lens/report-notify.js";

const router: ExpressRouter = Router();

export type LensPhotoDto = {
  id: string;
  image_url: string;
  caption: string | null;
  description: string | null;
  location: string | null;
  lat: number | null;
  lng: number | null;
  created_at: string;
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: lensImageMaxBytes(), files: 1 },
  fileFilter(_req, file, cb) {
    if (isAllowedLensImageMime(file.mimetype)) {
      cb(null, true);
      return;
    }
    cb(new Error("INVALID_IMAGE_TYPE"));
  },
});

function trimString(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > max) return null;
  return trimmed;
}

function parseCoord(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string" || !value.trim()) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function toDto(row: {
  id: string;
  imageUrl: string;
  caption: string | null;
  description: string | null;
  location: string | null;
  lat: number | null;
  lng: number | null;
  createdAt: Date;
}): LensPhotoDto {
  return {
    id: row.id,
    image_url: row.imageUrl,
    caption: row.caption,
    description: row.description,
    location: row.location,
    lat: row.lat,
    lng: row.lng,
    created_at: row.createdAt.toISOString(),
  };
}

router.get("/photos", async (_req, res) => {
  try {
    const rows = await prisma.lensPhoto.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    const body: ApiResponse<LensPhotoDto[]> = { data: rows.map(toDto) };
    res.json(body);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      data: [],
      error: "Failed to fetch lens photos",
    } satisfies ApiResponse<LensPhotoDto[]>);
  }
});

function trimOptionalString(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > max) return null;
  return trimmed;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

router.post("/photos/:id/report", async (req, res) => {
  try {
    const id = String(req.params.id).trim();
    if (!id) {
      res.status(400).json({ error: "Photo id is required." });
      return;
    }

    const body = (req.body ?? {}) as Record<string, unknown>;

    if (typeof body.website === "string" && body.website.trim()) {
      res.status(201).json({ data: { ok: true } });
      return;
    }

    const categoryRaw = typeof body.category === "string" ? body.category.trim() : "";
    if (!isLensReportCategory(categoryRaw)) {
      res.status(400).json({ error: "Please choose a valid report category." });
      return;
    }

    const details = trimOptionalString(body.details, 2000);
    const reporterEmailRaw = trimOptionalString(body.reporterEmail, 320);
    if (reporterEmailRaw && !isValidEmail(reporterEmailRaw)) {
      res.status(400).json({ error: "Please enter a valid email address." });
      return;
    }

    const existing = await prisma.lensPhoto.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "Photo not found." });
      return;
    }

    const siteUrl = (
      process.env.SITE_URL?.trim() ||
      process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
      "https://happenmcr.com"
    ).replace(/\/$/, "");
    const feedUrl =
      trimOptionalString(body.feedUrl, 500) || `${siteUrl}/mcr-buzz/mcr-on-lens`;

    const sent = await notifyLensPhotoReport({
      photoId: existing.id,
      category: categoryRaw,
      details,
      reporterEmail: reporterEmailRaw,
      photoTitle: existing.caption?.trim() || "Manchester photo",
      photoUrl: existing.imageUrl,
      location: existing.location,
      feedUrl,
    });

    if (!sent) {
      res.status(503).json({
        error: "Report could not be sent right now. Please try again later.",
      });
      return;
    }

    res.status(201).json({
      data: { ok: true, id: sent.id },
    } satisfies ApiResponse<{ ok: true; id: string }>);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to send report." });
  }
});

router.delete("/photos/:id", async (req, res) => {
  try {
    const id = String(req.params.id).trim();
    if (!id) {
      res.status(400).json({ error: "Photo id is required." });
      return;
    }

    const existing = await prisma.lensPhoto.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "Photo not found." });
      return;
    }

    await prisma.lensPhoto.delete({ where: { id } });

    try {
      await deleteLocalUpload(existing.imageKey);
    } catch (error) {
      console.error("[lens] failed to delete upload file", existing.imageKey, error);
    }

    res.json({
      data: { ok: true, id },
    } satisfies ApiResponse<{ ok: true; id: string }>);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete photo." });
  }
});

router.post("/photos", (req, res, next) => {
  upload.single("image")(req, res, (err: unknown) => {
    if (!err) {
      next();
      return;
    }

    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        res.status(400).json({ error: "Image must be 5MB or smaller." });
        return;
      }
      res.status(400).json({ error: "Could not upload image." });
      return;
    }

    if (err instanceof Error && err.message === "INVALID_IMAGE_TYPE") {
      res.status(400).json({
        error: "Image must be a JPEG, PNG, or WebP file.",
      });
      return;
    }

    res.status(400).json({ error: "Could not upload image." });
  });
}, async (req, res) => {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;

    // Honeypot
    if (typeof body.website === "string" && body.website.trim()) {
      res.status(201).json({ data: { ok: true } });
      return;
    }

    const file = req.file;
    if (!file?.buffer?.length) {
      res.status(400).json({ error: "Please choose a photo to upload." });
      return;
    }

    const detected = detectImageMime(file.buffer);
    if (!detected || !isAllowedLensImageMime(detected)) {
      res.status(400).json({
        error: "Image must be a JPEG, PNG, or WebP file.",
      });
      return;
    }

    const caption = trimString(body.caption, 120);
    const description = trimString(body.description, 1000);
    const location = trimString(body.location, 300);
    const lat = parseCoord(body.lat);
    const lng = parseCoord(body.lng);
    const key = buildLensImageKey(detected);
    const stored = await getObjectStorage().put({
      key,
      body: file.buffer,
      contentType: detected,
    });

    const row = await prisma.lensPhoto.create({
      data: {
        imageKey: stored.key,
        imageUrl: stored.url,
        caption,
        description,
        location,
        lat,
        lng,
      },
    });

    const response: ApiResponse<LensPhotoDto> = { data: toDto(row) };
    res.status(201).json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to upload photo." });
  }
});

export default router;
