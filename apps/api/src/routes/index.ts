import { Router } from 'express';
import { authRouter } from './auth';
import { instagramRouter } from './instagram';
import { mediaRouter } from './media';
import { postsRouter } from './posts';
import { adminRouter } from './admin';
import { adminReconciliationRouter } from './admin-reconciliation';
import { requireAuth } from '../middleware/auth';

export const apiRouter = Router();

// Public routes
apiRouter.use('/auth', authRouter);

// Authenticated routes
apiRouter.use('/integrations/instagram', requireAuth, instagramRouter);
apiRouter.use('/media', requireAuth, mediaRouter);
apiRouter.use('/posts', requireAuth, postsRouter);
apiRouter.use('/admin', requireAuth, adminRouter);
apiRouter.use('/admin/reconciliation', requireAuth, adminReconciliationRouter);
