import { Router } from 'express';
import { Queue } from 'bullmq';
import { prisma } from '../lib/db';
import { getRedisUrl } from '../lib/redis';

export const adminRouter = Router();

/**
 * POST /api/admin/reconcile-scheduled-posts
 *
 * Finds all posts with status='scheduled' whose scheduledFor is in the past,
 * re-enqueues each one via BullMQ, and persists a ReconciliationRun record.
 */
adminRouter.post('/reconcile-scheduled-posts', async (req, res) => {
  if (!req.user?.isAdmin) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  const run = await prisma.reconciliationRun.create({
    data: { status: 'running' }
  });

  const now = new Date();

  const missed = await prisma.scheduledPost.findMany({
    where: {
      status: 'scheduled',
      scheduledFor: { lte: now }
    },
    select: { id: true }
  });

  const queue = new Queue('publish-posts', { connection: { url: getRedisUrl() } });

  const results: Array<{ postId: string; jobId: string | null; error: string | null }> = [];

  for (const post of missed) {
    try {
      const job = await queue.add(
        'publish',
        { postId: post.id },
        { jobId: `reconcile-${post.id}` }
      );
      results.push({ postId: post.id, jobId: job.id ?? null, error: null });
    } catch (err) {
      results.push({
        postId: post.id,
        jobId: null,
        error: err instanceof Error ? err.message : String(err)
      });
    }
  }

  await queue.close();

  const errorCount = results.filter((r) => r.error !== null).length;
  const enqueuedCount = results.length - errorCount;

  const finished = await prisma.reconciliationRun.update({
    where: { id: run.id },
    data: {
      status: errorCount > 0 && enqueuedCount === 0 ? 'failed' : 'completed',
      finishedAt: new Date(),
      foundCount: missed.length,
      enqueuedCount,
      errorCount,
      notes: errorCount > 0 ? `${errorCount} post(s) failed to enqueue` : null
    }
  });

  res.json({
    runId: finished.id,
    count: enqueuedCount,
    results
  });
});

