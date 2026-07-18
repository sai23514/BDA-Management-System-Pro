import { Router } from 'express';
import { globalSearch } from '../controllers/searchController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = Router();

router.use(protect);

router.get('/', globalSearch);

export default router;
