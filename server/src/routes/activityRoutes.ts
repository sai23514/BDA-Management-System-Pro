import { Router } from 'express';
import {
  getMyTasks,
  completeActivity,
  updateActivity,
  deleteActivity,
} from '../controllers/activityController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = Router();

router.use(protect);

router.get('/my-tasks', getMyTasks);
router.patch('/:id/complete', completeActivity);
router.put('/:id', updateActivity);
router.delete('/:id', deleteActivity);

export default router;
