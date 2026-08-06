import { createLocalObjectStorage } from "./local.js";
import { createS3ObjectStorage } from "./s3.js";
import type { ObjectStorage } from "./types.js";

export type { ObjectStorage, PutObjectInput, StoredObject } from "./types.js";
export { localUploadsAbsoluteDir, publicUploadsBaseUrl } from "./local.js";

let cached: ObjectStorage | null = null;

export function getObjectStorage(): ObjectStorage {
  if (cached) return cached;

  const driver = (process.env.STORAGE_DRIVER || "local").trim().toLowerCase();

  switch (driver) {
    case "s3":
      cached = createS3ObjectStorage();
      break;
    case "local":
    default:
      cached = createLocalObjectStorage();
      break;
  }

  return cached;
}
