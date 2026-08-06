import type { ObjectStorage, PutObjectInput, StoredObject } from "./types.js";

/**
 * Placeholder for AWS S3.
 *
 * Next steps when you switch:
 * 1. `pnpm --filter @happenmcr/api add @aws-sdk/client-s3`
 * 2. Implement put() with PutObjectCommand
 * 3. Set STORAGE_DRIVER=s3 plus AWS_REGION, S3_BUCKET, and credentials
 * 4. Set PUBLIC_UPLOADS_BASE_URL to the bucket/CloudFront URL
 */
export function createS3ObjectStorage(): ObjectStorage {
  return {
    async put(_input: PutObjectInput): Promise<StoredObject> {
      throw new Error(
        "STORAGE_DRIVER=s3 is not implemented yet. Keep STORAGE_DRIVER=local or implement S3ObjectStorage in services/storage/s3.ts.",
      );
    },
  };
}
