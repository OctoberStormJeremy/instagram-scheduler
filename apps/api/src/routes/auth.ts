import { Router } from 'express';

export const authRouter = Router();

authRouter.post('/signup', async (_req, res) => {
  res.json({ ok: true });
});

authRouter.post('/login', async (_req, res) => {
  res.json({ ok: true });
});

authRouter.get('/me', async (_req, res) => {
  res.json({
    user: {
      id: 'demo-user',
      email: 'demo@example.com',
      name: 'Demo User',
      timezone: 'UTC',
      isAdmin: true
    }
  });
});
