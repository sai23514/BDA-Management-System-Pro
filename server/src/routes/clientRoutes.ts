import { Router } from 'express';
import {
  getClients,
  getClient,
  createClient,
  convertLeadToClient,
  updateClient,
  deleteClient,
  getClientStats,
} from '../controllers/clientController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/rbacMiddleware.js';
import { ROLES } from '../utils/constants.js';

const router = Router();

router.use(protect);

router.get('/stats', getClientStats);
router.get('/', getClients);
router.post('/', createClient);
router.post('/convert/:leadId', convertLeadToClient);
router.get('/:id', getClient);
router.put('/:id', updateClient);
router.delete('/:id', authorize(ROLES.SUPER_ADMIN, ROLES.MANAGER, ROLES.TEAM_LEAD), deleteClient);

export default router;
