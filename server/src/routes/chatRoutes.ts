import { Router } from 'express';
import {
  getContacts,
  getConversations,
  getOrCreateConversation,
  getMessages,
  sendMessage,
  markConversationRead,
  getUnreadTotal,
} from '../controllers/chatController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = Router();

router.use(protect);

router.get('/contacts', getContacts);
router.get('/unread', getUnreadTotal);
router.get('/conversations', getConversations);
router.post('/conversations', getOrCreateConversation);
router.get('/conversations/:id/messages', getMessages);
router.post('/conversations/:id/messages', sendMessage);
router.patch('/conversations/:id/read', markConversationRead);

export default router;
