import { Router } from 'express';
import { prisma } from '../lib/db';
import { createUploadPresignedPost, createDownloadPresignedUrl, deleteS3Object } from '../lib/s3';

export const mediaRouter = Router();

/**
 * POST /api/media/upload-url
 * Body: { filename: string; mimeType: string; sizeBytes: number }
 * Returns a presigned POST policy the client uses to upload directly to S3/R2.
 */
mediaRouter.post('/upload-url', async (req, res) => {
  const { filename, mimeType, sizeBytes } = req.body ?? {};

  if (!filename || !mimeType || typeof sizeBytes !== 'number') {
    res.status(400).json({ error: 'filename, mimeType, and sizeBytes are required' });
    return;
  }

  try {
    const { url, fields, key } = await createUploadPresignedPost(
      req.user!.id,
      filename,
      mimeType,
      sizeBytes
    );

    res.json({ url, fields, key });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to generate upload URL' });
  }
});

/**
 * POST /api/media/complete-upload
 * Body: { key: string; mimeType: string; sizeBytes: number }
 * Called after the client has finished uploading to S3.
 * Persists a MediaAsset record and returns it.
 */
mediaRouter.post('/complete-upload', async (req, res) => {
  const { key, mimeType, sizeBytes } = req.body ?? {};

  if (!key || !mimeType || typeof sizeBytes !== 'number') {
    res.status(400).json({ error: 'key, mimeType, and sizeBytes are required' });
    return;
  }

  const asset = await prisma.mediaAsset.create({
    data: {
      s3Key: key,
      mimeType,
      sizeBytes,
      userId: req.user!.id
    }
  });

  res.json({ asset: { id: asset.id, key: asset.s3Key, mimeType: asset.mimeType, sizeBytes: asset.sizeBytes, createdAt: asset.createdAt } });
});

/**
 * GET /api/media
 * Returns all media assets for the current user, with short-lived download URLs.
 */
mediaRouter.get('/', async (req, res) => {
  const assets = await prisma.mediaAsset.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: 'desc' }
  });

  const media = await Promise.all(
    assets.map(async (a) => ({
      id: a.id,
      key: a.s3Key,
      mimeType: a.mimeType,
      sizeBytes: a.sizeBytes,
      createdAt: a.createdAt,
      url: await createDownloadPresignedUrl(a.s3Key)
    }))
  );

  res.json({ media });
});

/**
 * DELETE /api/media/:id
 * Deletes the S3 object and removes the MediaAsset record.
 */
mediaRouter.delete('/:id', async (req, res) => {
  const asset = await prisma.mediaAsset.findFirst({
    where: { id: req.params.id, userId: req.user!.id }
  });

  if (!asset) {
    res.status(404).json({ error: 'Media asset not found' });
    return;
  }

  await deleteS3Object(asset.s3Key);
  await prisma.mediaAsset.delete({ where: { id: asset.id } });

  res.json({ ok: true });
});

