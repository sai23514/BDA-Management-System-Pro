import type { Request, Response } from 'express';
import { Types } from 'mongoose';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { ERROR_MESSAGES, NOTIFICATION_TYPES } from '../utils/constants.js';
import { createNotification } from '../utils/notify.js';
import { emitToUser } from '../socket.js';
import { getPaginationParams } from '../utils/helpers.js';
import logger from '../utils/logger.js';

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

const USER_FIELDS = 'firstName lastName avatar email role';

interface PopulatedParticipant {
  _id: Types.ObjectId;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  email?: string;
  role?: string;
}

/**
 * @desc    List users available to start a direct message with
 * @route   GET /api/v1/chat/contacts
 * @access  Private
 */
export const getContacts = async (req: Request, res: Response): Promise<void> => {
  try {
    const contacts = await User.find({ _id: { $ne: req.user._id }, isActive: true })
      .select(USER_FIELDS)
      .sort({ firstName: 1 });

    res.status(200).json({ success: true, data: { contacts } });
  } catch (error) {
    logger.error(`Get contacts error: ${errorMessage(error)}`);
    res.status(500).json({ success: false, message: ERROR_MESSAGES.SERVER_ERROR });
  }
};

/**
 * @desc    List the current user's conversations
 * @route   GET /api/v1/chat/conversations
 * @access  Private
 */
export const getConversations = async (req: Request, res: Response): Promise<void> => {
  try {
    const me = req.user._id;

    const conversations = await Conversation.find({ participants: me })
      .populate('participants', USER_FIELDS)
      .sort({ lastMessageAt: -1, updatedAt: -1 });

    const result = await Promise.all(
      conversations.map(async (conversation) => {
        const participants = conversation.participants as unknown as PopulatedParticipant[];
        const otherUser = participants.find((p) => p._id.toString() !== me.toString()) ?? null;

        const unreadCount = await Message.countDocuments({
          conversationId: conversation._id,
          sender: { $ne: me },
          readBy: { $ne: me },
        });

        return {
          _id: conversation._id,
          otherUser,
          lastMessage: conversation.lastMessage,
          lastMessageAt: conversation.lastMessageAt,
          unreadCount,
        };
      }),
    );

    res.status(200).json({ success: true, data: { conversations: result } });
  } catch (error) {
    logger.error(`Get conversations error: ${errorMessage(error)}`);
    res.status(500).json({ success: false, message: ERROR_MESSAGES.SERVER_ERROR });
  }
};

/**
 * @desc    Get or create a direct conversation with another user
 * @route   POST /api/v1/chat/conversations
 * @access  Private
 */
export const getOrCreateConversation = async (req: Request, res: Response): Promise<void> => {
  try {
    const me = req.user._id;
    const { userId } = req.body as { userId?: string };

    if (!userId || !Types.ObjectId.isValid(userId)) {
      res.status(400).json({ success: false, message: 'A valid userId is required' });
      return;
    }
    if (userId === me.toString()) {
      res.status(400).json({ success: false, message: 'You cannot message yourself' });
      return;
    }

    const other = await User.findById(userId).select(USER_FIELDS);
    if (!other) {
      res.status(404).json({ success: false, message: ERROR_MESSAGES.USER_NOT_FOUND });
      return;
    }

    let conversation = await Conversation.findOne({
      isGroup: false,
      participants: { $all: [me, other._id], $size: 2 },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [me, other._id],
        isGroup: false,
      });
    }

    await conversation.populate('participants', USER_FIELDS);
    const participants = conversation.participants as unknown as PopulatedParticipant[];
    const otherUser = participants.find((p) => p._id.toString() !== me.toString()) ?? null;

    res.status(200).json({
      success: true,
      data: {
        conversation: {
          _id: conversation._id,
          otherUser,
          lastMessage: conversation.lastMessage,
          lastMessageAt: conversation.lastMessageAt,
          unreadCount: 0,
        },
      },
    });
  } catch (error) {
    logger.error(`Get/create conversation error: ${errorMessage(error)}`);
    res.status(500).json({ success: false, message: ERROR_MESSAGES.SERVER_ERROR });
  }
};

/**
 * @desc    Get messages in a conversation (and mark them read)
 * @route   GET /api/v1/chat/conversations/:id/messages
 * @access  Private
 */
export const getMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    const me = req.user._id;
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      res.status(404).json({ success: false, message: 'Conversation not found' });
      return;
    }
    if (!conversation.participants.some((p) => p.toString() === me.toString())) {
      res.status(403).json({ success: false, message: ERROR_MESSAGES.PERMISSION_DENIED });
      return;
    }

    const { limit, skip } = getPaginationParams(
      (req.query.page as string) ?? 1,
      (req.query.limit as string) ?? 30,
    );

    const messages = await Message.find({ conversationId: conversation._id })
      .populate('sender', USER_FIELDS)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Mark unread messages (sent by others) as read
    await Message.updateMany(
      { conversationId: conversation._id, sender: { $ne: me }, readBy: { $ne: me } },
      { $addToSet: { readBy: me } },
    );

    res.status(200).json({ success: true, data: { messages: messages.reverse() } });
  } catch (error) {
    logger.error(`Get messages error: ${errorMessage(error)}`);
    res.status(500).json({ success: false, message: ERROR_MESSAGES.SERVER_ERROR });
  }
};

/**
 * @desc    Send a message in a conversation
 * @route   POST /api/v1/chat/conversations/:id/messages
 * @access  Private
 */
export const sendMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const me = req.user._id;
    const { body } = req.body as { body?: string };

    if (!body || !body.trim()) {
      res.status(400).json({ success: false, message: 'Message body is required' });
      return;
    }

    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      res.status(404).json({ success: false, message: 'Conversation not found' });
      return;
    }
    if (!conversation.participants.some((p) => p.toString() === me.toString())) {
      res.status(403).json({ success: false, message: ERROR_MESSAGES.PERMISSION_DENIED });
      return;
    }

    const message = await Message.create({
      conversationId: conversation._id,
      sender: me,
      body: body.trim(),
      readBy: [me],
    });

    conversation.lastMessage = body.trim().slice(0, 200);
    conversation.lastMessageAt = new Date();
    conversation.lastSender = me;
    await conversation.save();

    const populated = await Message.findById(message._id).populate('sender', USER_FIELDS);

    const recipients = conversation.participants.filter((p) => p.toString() !== me.toString());
    const senderName = `${req.user.firstName} ${req.user.lastName}`;

    recipients.forEach((recipientId) => {
      emitToUser(recipientId.toString(), 'message:new', {
        conversationId: conversation._id.toString(),
        message: populated,
      });
      void createNotification({
        recipient: recipientId,
        type: NOTIFICATION_TYPES.MENTION,
        title: `New message from ${senderName}`,
        message: body.trim().slice(0, 120),
        link: '/chat',
      });
    });

    logger.info(`Message sent by ${req.user.email} in conversation ${conversation._id.toString()}`);
    res.status(201).json({ success: true, data: { message: populated } });
  } catch (error) {
    logger.error(`Send message error: ${errorMessage(error)}`);
    res.status(500).json({ success: false, message: ERROR_MESSAGES.SERVER_ERROR });
  }
};

/**
 * @desc    Mark all messages in a conversation as read
 * @route   PATCH /api/v1/chat/conversations/:id/read
 * @access  Private
 */
export const markConversationRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const me = req.user._id;
    await Message.updateMany(
      { conversationId: req.params.id, sender: { $ne: me }, readBy: { $ne: me } },
      { $addToSet: { readBy: me } },
    );
    res.status(200).json({ success: true, message: 'Conversation marked as read' });
  } catch (error) {
    logger.error(`Mark conversation read error: ${errorMessage(error)}`);
    res.status(500).json({ success: false, message: ERROR_MESSAGES.SERVER_ERROR });
  }
};

/**
 * @desc    Total unread message count for the current user
 * @route   GET /api/v1/chat/unread
 * @access  Private
 */
export const getUnreadTotal = async (req: Request, res: Response): Promise<void> => {
  try {
    const me = req.user._id;
    const conversations = await Conversation.find({ participants: me }).select('_id');
    const ids = conversations.map((c) => c._id);

    const unreadTotal = await Message.countDocuments({
      conversationId: { $in: ids },
      sender: { $ne: me },
      readBy: { $ne: me },
    });

    res.status(200).json({ success: true, data: { unreadTotal } });
  } catch (error) {
    logger.error(`Get unread total error: ${errorMessage(error)}`);
    res.status(500).json({ success: false, message: ERROR_MESSAGES.SERVER_ERROR });
  }
};
