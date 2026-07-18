import { Router } from 'express';
import { getReportsOverview } from '../controllers/reportController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = Router();

router.use(protect);

router.get('/overview', getReportsOverview);

export default router;
