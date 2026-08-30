import { Router } from 'express';
import { prisma } from '../lib/db';

export const adminReconciliationRouter = Router();

/**
 * GET /api/admin/reconciliation/runs
 * Returns recent reconciliation run history, newest first.
 */
adminReconciliationRouter.get('/runs', async (req, res) => {
  if (!req.user?.isAdmin) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  const runs = await prisma.reconciliationRun.findMany({
    orderBy: { startedAt: 'desc' },
    take: 50
  });

  res.json({ runs });
});

