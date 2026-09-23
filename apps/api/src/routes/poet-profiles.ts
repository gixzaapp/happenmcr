import { randomUUID } from "node:crypto";
import { Router, type Router as ExpressRouter } from "express";
import multer from "multer";
import type { ApiResponse } from "@happenmcr/types";
import { prisma } from "../db.js";
import { authorizeLensUpload } from "../lib/lens-upload-auth.js";
import { deleteLocalUpload, getObjectStorage } from "../services/storage/index.js";
import {
  detectImageMime,
  isAllowedLensImageMime,
  lensImageMaxBytes,
} from "../services/storage/lens-image.js";

const router: ExpressRouter = Router();

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

export type PoetProfileDto = {
  user_id: string;
  name: string;
  bio: string | null;
  image_url: string | null;
  poems: Array<{
    id: string;
    title: string;
    author_name: string;
    excerpt: string | null;
    image_url: string | null;
    like_count: number;
    created_at: string;
  }>;
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

router.get("/:userId", async (req, res) => {
  try {
    const userId = String(req.params.userId).trim();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { poetProfile: true },
    });
    if (!user) {
      res.status(404).json({ error: "Poet not found." });
      return;
    }

    const poems = await prisma.poem.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { likes: true } } },
    });

    const profile = user.poetProfile;
    const name =
      profile?.name?.trim() ||
      poems[0]?.authorName?.trim() ||
      user.name?.trim() ||
      "Poet";

    const body: ApiResponse<PoetProfileDto> = {
      data: {
        user_id: user.id,
        name,
        bio: profile?.bio ?? null,
        image_url: profile?.imageUrl ?? user.image ?? null,
        poems: poems.map((poem) => ({
          id: poem.id,
          title: poem.title,
          author_name: poem.authorName,
          excerpt: poem.excerpt,
          image_url: poem.imageUrl,
          like_count: poem._count.likes,
          created_at: poem.createdAt.toISOString(),
        })),
      },
    };
    res.json(body);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to load poet profile." });
  }
});

router.put("/:userId", (req, res, next) => {
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
    const actor = authorizeLensUpload(req);
    const userId = String(req.params.userId).trim();
    if (!actor || actor.userId !== userId) {
      res.status(401).json({ error: "Sign in to edit your profile." });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ error: "Poet not found." });
      return;
    }

    const body = (req.body ?? {}) as Record<string, unknown>;
    const name = trimString(body.name, 80);
    if (!name) {
      res.status(400).json({ error: "Add your name." });
      return;
    }
    const bio = trimString(body.bio, 800);

    const existing = await prisma.poetProfile.findUnique({ where: { userId } });
    let imageKey = existing?.imageKey ?? null;
    let imageUrl = existing?.imageUrl ?? null;

    if (req.file?.buffer?.length) {
      const detected = detectImageMime(req.file.buffer);
      if (!detected || !isAllowedLensImageMime(detected)) {
        res.status(400).json({ error: "Image must be a JPEG, PNG, or WebP file." });
        return;
      }
      const stored = await getObjectStorage().put({
        key: `poets/${randomUUID()}${EXT_BY_MIME[detected] || ".bin"}`,
        body: req.file.buffer,
        contentType: detected,
      });
      if (existing?.imageKey) {
        try {
          await deleteLocalUpload(existing.imageKey);
        } catch (error) {
          console.error("[poets] failed to delete previous portrait", error);
        }
      }
      imageKey = stored.key;
      imageUrl = stored.url;
    }

    const profile = await prisma.poetProfile.upsert({
      where: { userId },
      create: { userId, name, bio, imageKey, imageUrl },
      update: { name, bio, imageKey, imageUrl },
    });

    res.json({
      data: {
        user_id: userId,
        name: profile.name,
        bio: profile.bio,
        image_url: profile.imageUrl,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not save your profile." });
  }
});

export default router;
