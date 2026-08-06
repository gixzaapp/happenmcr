import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ObjectStorage, PutObjectInput, StoredObject } from "./types.js";

function uploadsDir(): string {
  return path.resolve(
    process.env.UPLOADS_DIR?.trim() || path.join(process.cwd(), "uploads"),
  );
}

/**
 * Public base URL for uploaded files (no trailing slash).
 * Production (nginx /api → Express): https://happenmcr.com/api/uploads
 * Local: http://localhost:4000/uploads
 */
export function publicUploadsBaseUrl(): string {
  const configured = process.env.PUBLIC_UPLOADS_BASE_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");

  const site = process.env.SITE_URL?.trim().replace(/\/$/, "");
  if (site) return `${site}/api/uploads`;

  const port = Number(process.env.PORT) || 4000;
  return `http://localhost:${port}/uploads`;
}

export function createLocalObjectStorage(): ObjectStorage {
  const root = uploadsDir();

  return {
    async put(input: PutObjectInput): Promise<StoredObject> {
      const absolute = path.join(root, input.key);
      await mkdir(path.dirname(absolute), { recursive: true });
      await writeFile(absolute, input.body);

      return {
        key: input.key,
        url: `${publicUploadsBaseUrl()}/${input.key.replace(/\\/g, "/")}`,
        contentType: input.contentType,
        size: input.body.byteLength,
      };
    },
  };
}

export function localUploadsAbsoluteDir(): string {
  return uploadsDir();
}
