import type { Types } from 'mongoose';
import Notification from '../models/Notification.js';
import type { NotificationType } from './constants.js';
import logger from './logger.js';

interface CreateNotificationInput {
  recipient: Types.ObjectId | string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  meta?: Record<string, unknown>;
}

/**
 * Best-effort notification creation. Never throws so it can be safely
 * awaited inside request handlers without risking the main operation.
 */
export const createNotification = async (input: CreateNotificationInput): Promise<void> => {
  try {
    await Notification.create({
      recipient: input.recipient as Types.ObjectId,
      type: input.type,
      title: input.title,
      message: input.message,
      link: input.link,
      meta: input.meta,
      read: false,
    });
  } catch (error) {
    logger.error(
      `Failed to create notification: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
};
