import { Router } from 'express';

export const instagramRouter = Router();

instagramRouter.get('/connect', async (_req, res) => {
  res.json({ url: 'https://example.com/oauth', state: 'demo-state' });
});

instagramRouter.get('/callback', async (_req, res) => {
  res.json({ ok: true });
});

instagramRouter.get('/status', async (_req, res) => {
  res.json({ accounts: [] });
});

instagramRouter.delete('/disconnect', async (_req, res) => {
  res.json({ ok: true });
});
