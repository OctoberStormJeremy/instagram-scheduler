import dotenv from 'dotenv';
import { Worker } from 'bullmq';
import { withStartupLock } from './lib/startup-lock';
import { getRedisUrl } from './lib/config';
import { prisma } from './lib/db';
import { publishToInstagram, buildPublicMediaUrl } from './lib/publish';

dotenv.config();

/**
 * On startup, find any posts that should have been published while the worker
 * was offline and re-enqueue them via BullMQ so they are retried promptly.
 */
async function reconcileMissedScheduledPosts(): Promise<void> {
  const now = new Date();

  const missed = await prisma.scheduledPost.findMany({
    where: {
      status: 'scheduled',
      scheduledFor: { lte: now }
    },
    select: { id: true, scheduledFor: true }
  });

  if (missed.length === 0) {
    console.log('Reconciliation: no missed posts found');
    return;
  }

  console.log(`Reconciliation: re-enqueueing ${missed.length} missed post(s)`);

  const { Queue } = await import('bullmq');
  const queue = new Queue('publish-posts', { connection: { url: getRedisUrl() } });

  for (const post of missed) {
    await queue.add('publish', { postId: post.id }, { jobId: `reconcile-${post.id}` });
    console.log(`  → enqueued post ${post.id} (was due ${post.scheduledFor.toISOString()})`);
  }

  await queue.close();
}

/**
 * Fetch the post with all relations, call the Instagram Graph API,
 * and update the DB record with the result.
 */
async function publishPost(postId: string): Promise<void> {
  const post = await prisma.scheduledPost.findUnique({
    where: { id: postId },
    include: {
      mediaAsset: true,
      instagramAccount: true
    }
  });

  if (!post) {
    throw new Error(`Post ${postId} not found`);
  }

  if (post.status === 'published') {
    console.log(`Post ${postId} already published — skipping`);
    return;
  }

  // Mark as processing
  await prisma.scheduledPost.update({
    where: { id: postId },
    data: { status: 'processing', attemptCount: { increment: 1 } }
  });

  try {
    const imageUrl = buildPublicMediaUrl(post.mediaAsset.s3Key);

    const { instagramMediaId } = await publishToInstagram({
      igUserId: post.instagramAccount.igUserId,
      accessToken: post.instagramAccount.accessToken,
      imageUrl,
      caption: post.caption
    });

    await prisma.scheduledPost.update({
      where: { id: postId },
      data: {
        status: 'published',
        instagramMediaId,
        publishedAt: new Date(),
        lastError: null
      }
    });

    console.log(`Post ${postId} published — Instagram media ID: ${instagramMediaId}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    await prisma.scheduledPost.update({
      where: { id: postId },
      data: { status: 'failed', lastError: message }
    });

    // Re-throw so BullMQ records the failure and can retry.
    throw err;
  }
}

async function startWorker() {
  const redisUrl = getRedisUrl();

  try {
    await withStartupLock(async () => {
      await reconcileMissedScheduledPosts();
    });
  } catch (err) {
    console.error('Startup reconciliation failed:', err);
  }

  const worker = new Worker(
    'publish-posts',
    async (job) => publishPost(job.data.postId),
    {
      connection: { url: redisUrl },
      concurrency: Number(process.env.WORKER_CONCURRENCY ?? '1')
    }
  );

  worker.on('ready', () => {
    console.log('BullMQ worker is ready');
  });

  worker.on('completed', (job) => {
    console.log(`Publish job completed: ${job.id}`);
  });

  worker.on('failed', (job, err) => {
    console.error(`Publish job failed: ${job?.id}`, err);
  });

  worker.on('error', (err) => {
    console.error('Worker error:', err);
  });

  process.on('SIGINT', async () => {
    console.log('SIGINT received, closing worker...');
    await worker.close();
    await prisma.$disconnect();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, closing worker...');
    await worker.close();
    await prisma.$disconnect();
    process.exit(0);
  });

  console.log('Worker started');
}

startWorker().catch((err) => {
  console.error('Worker startup failed:', err);
  process.exit(1);
});
