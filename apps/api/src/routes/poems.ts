import { randomUUID } from "node:crypto";
import { Router, type Router as ExpressRouter } from "express";
import multer from "multer";
import type { ApiResponse } from "@happenmcr/types";
import { prisma } from "../db.js";
import { authorizeLensUpload, authorizeLensUser } from "../lib/lens-upload-auth.js";
import { getObjectStorage, deleteLocalUpload } from "../services/storage/index.js";
import {
  detectImageMime,
  isAllowedLensImageMime,
  lensImageMaxBytes,
} from "../services/storage/lens-image.js";
import {
  isPoemReportCategory,
  notifyPoemReport,
} from "../services/poems/report-notify.js";
import { poemExcerpt, sanitizePoemHtml } from "../services/poems/sanitize.js";

const router: ExpressRouter = Router();

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

export type PoemDto = {
  id: string;
  title: string;
  author_name: string;
  body_html: string;
  excerpt: string | null;
  place: string | null;
  dedication: string | null;
  image_url: string | null;
  user_id: string | null;
  like_count: number;
  liked: boolean;
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

function toDto(
  row: {
    id: string;
    title: string;
    authorName: string;
    bodyHtml: string;
    excerpt: string | null;
    place: string | null;
    dedication: string | null;
    imageUrl: string | null;
    userId: string | null;
    createdAt: Date;
  },
  likeCount: number,
  liked: boolean,
): PoemDto {
  return {
    id: row.id,
    title: row.title,
    author_name: row.authorName,
    body_html: row.bodyHtml,
    excerpt: row.excerpt,
    place: row.place,
    dedication: row.dedication,
    image_url: row.imageUrl,
    user_id: row.userId,
    like_count: likeCount,
    liked,
    created_at: row.createdAt.toISOString(),
  };
}

router.get("/", async (req, res) => {
  try {
    const viewer = authorizeLensUser(req);
    const rows = await prisma.poem.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { _count: { select: { likes: true } } },
    });

    let likedIds = new Set<string>();
    if (viewer && rows.length > 0) {
      const likedRows = await prisma.poemLike.findMany({
        where: {
          userId: viewer.userId,
          poemId: { in: rows.map((row) => row.id) },
        },
        select: { poemId: true },
      });
      likedIds = new Set(likedRows.map((row) => row.poemId));
    }

    const body: ApiResponse<PoemDto[]> = {
      data: rows.map((row) => toDto(row, row._count.likes, likedIds.has(row.id))),
    };
    res.json(body);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      data: [],
      error: "Failed to fetch poems",
    } satisfies ApiResponse<PoemDto[]>);
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = String(req.params.id).trim();
    const viewer = authorizeLensUser(req);
    const row = await prisma.poem.findUnique({
      where: { id },
      include: { _count: { select: { likes: true } } },
    });
    if (!row) {
      res.status(404).json({ error: "Poem not found." });
      return;
    }

    let liked = false;
    if (viewer) {
      const existing = await prisma.poemLike.findUnique({
        where: { poemId_userId: { poemId: id, userId: viewer.userId } },
      });
      liked = Boolean(existing);
    }

    res.json({
      data: toDto(row, row._count.likes, liked),
    } satisfies ApiResponse<PoemDto>);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch poem." });
  }
});

router.post("/:id/like", async (req, res) => {
  try {
    const viewer = authorizeLensUser(req);
    if (!viewer) {
      res.status(401).json({ error: "Sign in to like a poem." });
      return;
    }

    const id = String(req.params.id).trim();
    const poem = await prisma.poem.findUnique({ where: { id } });
    if (!poem) {
      res.status(404).json({ error: "Poem not found." });
      return;
    }

    const existing = await prisma.poemLike.findUnique({
      where: { poemId_userId: { poemId: id, userId: viewer.userId } },
    });

    let liked: boolean;
    if (existing) {
      await prisma.poemLike.delete({ where: { id: existing.id } });
      liked = false;
    } else {
      await prisma.poemLike.create({
        data: { poemId: id, userId: viewer.userId },
      });
      liked = true;
    }

    const like_count = await prisma.poemLike.count({ where: { poemId: id } });
    res.json({
      data: { liked, like_count },
    } satisfies ApiResponse<{ liked: boolean; like_count: number }>);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update like." });
  }
});

router.post("/:id/report", async (req, res) => {
  try {
    const id = String(req.params.id).trim();
    const body = (req.body ?? {}) as Record<string, unknown>;

    if (typeof body.website === "string" && body.website.trim()) {
      res.status(201).json({ data: { ok: true } });
      return;
    }

    const categoryRaw = typeof body.category === "string" ? body.category.trim() : "";
    if (!isPoemReportCategory(categoryRaw)) {
      res.status(400).json({ error: "Please choose a valid report category." });
      return;
    }

    const details = trimString(body.details, 2000);
    const reporterEmail = trimString(body.reporterEmail, 320);
    if (reporterEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reporterEmail)) {
      res.status(400).json({ error: "Please enter a valid email address." });
      return;
    }

    const poem = await prisma.poem.findUnique({ where: { id } });
    if (!poem) {
      res.status(404).json({ error: "Poem not found." });
      return;
    }

    const siteUrl = (
      process.env.SITE_URL?.trim() ||
      process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
      "https://happenmcr.com"
    ).replace(/\/$/, "");
    const poemUrl =
      trimString(body.poemUrl, 500) ||
      `${siteUrl}/mcr-buzz/poets-corner/${poem.id}`;

    const sent = await notifyPoemReport({
      poemId: poem.id,
      category: categoryRaw,
      details,
      reporterEmail,
      title: poem.title,
      authorName: poem.authorName,
      poemUrl,
    });

    if (!sent) {
      res.status(503).json({
        error: "Report could not be sent right now. Please try again later.",
      });
      return;
    }

    res.status(201).json({ data: { ok: true, id: sent.id } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to send report." });
  }
});

function handleImageUpload(err: unknown, res: import("express").Response): boolean {
  if (!err) return false;
  if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
    res.status(400).json({ error: "Image must be 5MB or smaller." });
    return true;
  }
  if (err instanceof Error && err.message === "INVALID_IMAGE_TYPE") {
    res.status(400).json({ error: "Image must be a JPEG, PNG, or WebP file." });
    return true;
  }
  res.status(400).json({ error: "Could not upload image." });
  return true;
}

async function storePoemImage(file: Express.Multer.File): Promise<{ key: string; url: string } | { error: string }> {
  const detected = detectImageMime(file.buffer);
  if (!detected || !isAllowedLensImageMime(detected)) {
    return { error: "Image must be a JPEG, PNG, or WebP file." };
  }
  const key = `poems/${randomUUID()}${EXT_BY_MIME[detected] || ".bin"}`;
  const stored = await getObjectStorage().put({
    key,
    body: file.buffer,
    contentType: detected,
  });
  return { key: stored.key, url: stored.url };
}

router.patch("/:id", (req, res, next) => {
  upload.single("image")(req, res, (err: unknown) => {
    if (handleImageUpload(err, res)) return;
    next();
  });
}, async (req, res) => {
  try {
    const actor = authorizeLensUpload(req);
    if (!actor) {
      res.status(401).json({ error: "Sign in to edit a poem." });
      return;
    }

    const id = String(req.params.id).trim();
    const existing = await prisma.poem.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "Poem not found." });
      return;
    }
    if (existing.userId !== actor.userId) {
      res.status(403).json({ error: "You can only edit your own poems." });
      return;
    }

    const body = (req.body ?? {}) as Record<string, unknown>;
    const title = trimString(body.title, 140);
    const authorName = trimString(body.authorName, 80);
    const rawHtml = typeof body.bodyHtml === "string" ? body.bodyHtml : "";
    const bodyHtml = sanitizePoemHtml(rawHtml).slice(0, 20000);
    const excerpt = poemExcerpt(bodyHtml);
    if (!title || !authorName || !excerpt) {
      res.status(400).json({ error: "Add a title, your name, and the poem." });
      return;
    }

    let imageKey = existing.imageKey;
    let imageUrl = existing.imageUrl;
    if (req.file?.buffer?.length) {
      const stored = await storePoemImage(req.file);
      if ("error" in stored) {
        res.status(400).json({ error: stored.error });
        return;
      }
      if (existing.imageKey) {
        try {
          await deleteLocalUpload(existing.imageKey);
        } catch (error) {
          console.error("[poems] failed to delete previous image", error);
        }
      }
      imageKey = stored.key;
      imageUrl = stored.url;
    }

    const row = await prisma.poem.update({
      where: { id },
      data: {
        title,
        authorName,
        bodyHtml,
        excerpt,
        place: trimString(body.place, 160),
        dedication: trimString(body.dedication, 160),
        imageKey,
        imageUrl,
      },
    });

    const like_count = await prisma.poemLike.count({ where: { poemId: id } });
    res.json({ data: toDto(row, like_count, true) } satisfies ApiResponse<PoemDto>);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not update the poem. Try again." });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const actor = authorizeLensUser(req);
    if (!actor) {
      res.status(401).json({ error: "Sign in to delete a poem." });
      return;
    }

    const id = String(req.params.id).trim();
    const existing = await prisma.poem.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "Poem not found." });
      return;
    }
    if (existing.userId !== actor.userId) {
      res.status(403).json({ error: "You can only delete your own poems." });
      return;
    }

    await prisma.poem.delete({ where: { id } });
    if (existing.imageKey) {
      try {
        await deleteLocalUpload(existing.imageKey);
      } catch (error) {
        console.error("[poems] failed to delete image", error);
      }
    }

    res.json({ data: { ok: true, id } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not delete the poem." });
  }
});

router.post("/", (req, res, next) => {
  upload.single("image")(req, res, (err: unknown) => {
    if (!err) {
      next();
      return;
    }
    if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
      res.status(400).json({ error: "Image must be 5MB or smaller." });
      return;
    }
    if (err instanceof Error && err.message === "INVALID_IMAGE_TYPE") {
      res.status(400).json({ error: "Image must be a JPEG, PNG, or WebP file." });
      return;
    }
    res.status(400).json({ error: "Could not upload image." });
  });
}, async (req, res) => {
  try {
    const author = authorizeLensUpload(req);
    if (!author) {
      res.status(401).json({ error: "Sign in to share a poem." });
      return;
    }

    const body = (req.body ?? {}) as Record<string, unknown>;
    if (typeof body.website === "string" && body.website.trim()) {
      res.status(201).json({ data: { ok: true } });
      return;
    }

    const title = trimString(body.title, 140);
    const authorName = trimString(body.authorName, 80);
    const rawHtml = typeof body.bodyHtml === "string" ? body.bodyHtml : "";
    const bodyHtml = sanitizePoemHtml(rawHtml).slice(0, 20000);
    const excerpt = poemExcerpt(bodyHtml);
    if (!title || !authorName || !excerpt) {
      res.status(400).json({
        error: "Add a title, your name, and the poem.",
      });
      return;
    }

    const place = trimString(body.place, 160);
    const dedication = trimString(body.dedication, 160);

    let imageKey: string | null = null;
    let imageUrl: string | null = null;
    const file = req.file;
    if (file?.buffer?.length) {
      const stored = await storePoemImage(file);
      if ("error" in stored) {
        res.status(400).json({ error: stored.error });
        return;
      }
      imageKey = stored.key;
      imageUrl = stored.url;
    }

    const row = await prisma.poem.create({
      data: {
        title,
        authorName,
        bodyHtml,
        excerpt,
        place,
        dedication,
        imageKey,
        imageUrl,
        userId: author.userId,
      },
    });

    res.status(201).json({
      data: toDto(row, 0, false),
    } satisfies ApiResponse<PoemDto>);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not save the poem. Try again." });
  }
});

export default router;
