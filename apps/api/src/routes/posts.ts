import { Router } from 'express';

export const postsRouter = Router();

postsRouter.post('/', async (_req, res) => {
  res.json({ post: { id: 'demo-post', status: 'scheduled' } });
});

postsRouter.get('/', async (_req, res) => {
  res.json({ posts: [] });
});

postsRouter.get('/:id', async (req, res) => {
  res.json({
    post: {
      id: req.params.id,
      caption: 'Demo caption',
      scheduledFor: new Date().toISOString(),
      timezone: 'UTC',
      status: 'scheduled'
    }
  });
});

postsRouter.get('/:id/status', async (req, res) => {
  res.json({
    status: 'scheduled',
    publishedAt: null,
    lastError: null,
    updatedAt: new Date().toISOString()
  });
});

postsRouter.post('/:id/cancel', async (_req, res) => {
  res.json({ ok: true });
});

postsRouter.post('/:id/retry', async (_req, res) => {
  res.json({ ok: true });
});
