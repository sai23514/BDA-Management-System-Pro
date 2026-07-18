import { Router, type Request, type Response } from 'express';
import authRoutes from './authRoutes.js';
import leadRoutes from './leadRoutes.js';
import clientRoutes from './clientRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import activityRoutes from './activityRoutes.js';
import reportRoutes from './reportRoutes.js';
import aiRoutes from './aiRoutes.js';
import searchRoutes from './searchRoutes.js';
import chatRoutes from './chatRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/leads', leadRoutes);
router.use('/clients', clientRoutes);
router.use('/notifications', notificationRoutes);
router.use('/activities', activityRoutes);
router.use('/reports', reportRoutes);
router.use('/ai', aiRoutes);
router.use('/search', searchRoutes);
router.use('/chat', chatRoutes);

// Health check endpoint
router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

export default router;
