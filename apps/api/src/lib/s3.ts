import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { GetObjectCommand } from '@aws-sdk/client-s3';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'video/mp4',
  'video/quicktime'
]);

const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB

export function getS3Config() {
  const bucket = process.env.S3_BUCKET;
  const region = process.env.S3_REGION ?? 'us-east-1';
  const endpoint = process.env.S3_ENDPOINT; // set for R2 / MinIO

  if (!bucket) {
    throw new Error('Missing required environment variable: S3_BUCKET');
  }

  return { bucket, region, endpoint };
}

export function createS3Client() {
  const { region, endpoint } = getS3Config();

  return new S3Client({
    region,
    ...(endpoint ? { endpoint, forcePathStyle: true } : {})
  });
}

export function isAllowedMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.has(mimeType);
}

export function buildS3Key(userId: string, filename: string): string {
  const ext = filename.includes('.') ? filename.split('.').pop() : 'bin';
  const rand = Math.random().toString(36).slice(2, 10);
  return `uploads/${userId}/${Date.now()}-${rand}.${ext}`;
}

/**
 * Generate a presigned POST policy for direct browser-to-S3 uploads.
 * Returns { url, fields } that the client POSTs to with the file as `file`.
 */
export async function createUploadPresignedPost(
  userId: string,
  filename: string,
  mimeType: string,
  sizeBytes: number
) {
  if (!isAllowedMimeType(mimeType)) {
    throw new Error(`Unsupported file type: ${mimeType}`);
  }

  if (sizeBytes > MAX_FILE_SIZE_BYTES) {
    throw new Error(`File too large (max ${MAX_FILE_SIZE_BYTES / 1024 / 1024} MB)`);
  }

  const { bucket } = getS3Config();
  const client = createS3Client();
  const key = buildS3Key(userId, filename);

  const { url, fields } = await createPresignedPost(client, {
    Bucket: bucket,
    Key: key,
    Conditions: [
      { 'Content-Type': mimeType },
      ['content-length-range', 1, MAX_FILE_SIZE_BYTES]
    ],
    Fields: { 'Content-Type': mimeType },
    Expires: 300 // 5 minutes
  });

  return { url, fields, key };
}

/**
 * Generate a short-lived presigned GET URL for viewing a media asset.
 */
export async function createDownloadPresignedUrl(key: string, expiresIn = 3600): Promise<string> {
  const { bucket } = getS3Config();
  const client = createS3Client();

  return getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: bucket, Key: key }),
    { expiresIn }
  );
}

/**
 * Delete an object from S3/R2.
 */
export async function deleteS3Object(key: string): Promise<void> {
  const { bucket } = getS3Config();
  const client = createS3Client();
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}
