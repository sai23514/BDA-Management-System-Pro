import type { Request, Response } from 'express';
import Notification from '../models/Notification.js';
import { ERROR_MESSAGES } from '../utils/constants.js';
import logger from '../utils/logger.js';

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

/**
 * @desc    Get current user's notifications (most recent first)
 * @route   GET /api/v1/notifications
 * @access  Private
 */
export const getNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 100);

    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(limit);

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      read: false,
    });

    res.status(200).json({ success: true, data: { notifications, unreadCount } });
  } catch (error) {
    logger.error(`Get notifications error: ${errorMessage(error)}`);
    res.status(500).json({ success: false, message: ERROR_MESSAGES.SERVER_ERROR });
  }
};

/**
 * @desc    Mark a notification as read
 * @route   PATCH /api/v1/notifications/:id/read
 * @access  Private
 */
export const markAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { read: true },
      { new: true },
    );

    if (!notification) {
      res.status(404).json({ success: false, message: 'Notification not found' });
      return;
    }

    res.status(200).json({ success: true, data: { notification } });
  } catch (error) {
    logger.error(`Mark notification read error: ${errorMessage(error)}`);
    res.status(500).json({ success: false, message: ERROR_MESSAGES.SERVER_ERROR });
  }
};

/**
 * @desc    Mark all notifications as read
 * @route   PATCH /api/v1/notifications/read-all
 * @access  Private
 */
export const markAllAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, read: false },
      { read: true },
    );

    res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    logger.error(`Mark all read error: ${errorMessage(error)}`);
    res.status(500).json({ success: false, message: ERROR_MESSAGES.SERVER_ERROR });
  }
};

/**
 * @desc    Delete a notification
 * @route   DELETE /api/v1/notifications/:id
 * @access  Private
 */
export const deleteNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.user._id });
    res.status(200).json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    logger.error(`Delete notification error: ${errorMessage(error)}`);
    res.status(500).json({ success: false, message: ERROR_MESSAGES.SERVER_ERROR });
  }
};
