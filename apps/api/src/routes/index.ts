import { Router } from 'express';
import { authRouter } from './auth';
import { instagramRouter } from './instagram';
import { mediaRouter } from './media';
import { postsRouter } from './posts';
import { adminRouter } from './admin';
import { adminReconciliationRouter } from './admin-reconciliation';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/integrations/instagram', instagramRouter);
apiRouter.use('/media', mediaRouter);
apiRouter.use('/posts', postsRouter);
apiRouter.use('/admin', adminRouter);
apiRouter.use('/admin/reconciliation', adminReconciliationRouter);
