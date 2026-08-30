import dotenv from 'dotenv';
import { Worker } from 'bullmq';
import { withStartupLock } from './lib/startup-lock';
import { getRedisUrl } from './lib/config';

dotenv.config();

async function reconcileMissedScheduledPosts() {
  console.log('Reconciling missed scheduled posts...');
  return { ok: true };
}

async function publishPost(postId: string) {
  console.log(`Publishing post ${postId}`);
  return { ok: true };
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
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, closing worker...');
    await worker.close();
    process.exit(0);
  });

  console.log('Worker started');
}

startWorker().catch((err) => {
  console.error('Worker startup failed:', err);
  process.exit(1);
});
