import { Router } from 'express';
import { draftEmail, summarizeLead } from '../controllers/aiController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = Router();

router.use(protect);

router.post('/draft-email', draftEmail);
router.post('/summarize', summarizeLead);

export default router;
