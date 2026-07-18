import {
  Schema,
  model,
  type Model,
  type HydratedDocument,
  type Types,
} from 'mongoose';
import { NOTIFICATION_TYPES, type NotificationType } from '../utils/constants.js';

export interface INotification {
  recipient: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  meta?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type NotificationModel = Model<INotification, {}>;
export type NotificationDocument = HydratedDocument<INotification>;

const notificationSchema = new Schema<INotification, NotificationModel>(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(NOTIFICATION_TYPES),
      default: NOTIFICATION_TYPES.SYSTEM,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    link: {
      type: String,
      trim: true,
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    meta: {
      type: Schema.Types.Mixed,
    },
  },
  { timestamps: true },
);

notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

const Notification = model<INotification, NotificationModel>('Notification', notificationSchema);

export default Notification;
