import { Router } from 'express';

export const adminReconciliationRouter = Router();

adminReconciliationRouter.get('/runs', async (_req, res) => {
  res.json({ runs: [] });
});
