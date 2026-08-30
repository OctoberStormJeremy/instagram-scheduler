import { Router } from 'express';

export const adminRouter = Router();

adminRouter.post('/reconcile-scheduled-posts', async (_req, res) => {
  res.json({
    runId: 'demo-run',
    count: 0,
    results: []
  });
});
