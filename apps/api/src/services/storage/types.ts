export type PutObjectInput = {
  /** Storage key, e.g. `event-submissions/abc.jpg` */
  key: string;
  body: Buffer;
  contentType: string;
};

export type StoredObject = {
  key: string;
  /** Public URL for the object */
  url: string;
  contentType: string;
  size: number;
};

/**
 * Swappable object storage.
 * Local disk today; implement S3ObjectStorage and set STORAGE_DRIVER=s3 later.
 */
export interface ObjectStorage {
  put(input: PutObjectInput): Promise<StoredObject>;
}
