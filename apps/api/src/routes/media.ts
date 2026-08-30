import { Router } from 'express';

export const mediaRouter = Router();

mediaRouter.post('/upload-url', async (_req, res) => {
  res.json({ uploadUrl: 'https://example.com/upload', key: 'uploads/demo/file.jpg' });
});

mediaRouter.post('/complete-upload', async (_req, res) => {
  res.json({ ok: true });
});

mediaRouter.get('/', async (_req, res) => {
  res.json({ media: [] });
});

mediaRouter.delete('/:id', async (_req, res) => {
  res.json({ ok: true });
});
