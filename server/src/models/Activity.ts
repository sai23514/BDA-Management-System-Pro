import {
  Schema,
  model,
  type Model,
  type HydratedDocument,
  type Types,
} from 'mongoose';
import {
  ACTIVITY_TYPES,
  ACTIVITY_STATUS,
  LEAD_PRIORITY,
  type ActivityType,
  type ActivityStatus,
  type LeadPriority,
} from '../utils/constants.js';

export interface IActivityAttachment {
  filename?: string;
  url?: string;
  uploadedAt: Date;
}

export interface IActivity {
  type: ActivityType;
  subject: string;
  description?: string;
  leadId: Types.ObjectId;
  clientId: Types.ObjectId | null;
  userId: Types.ObjectId;
  status: ActivityStatus;
  priority: LeadPriority;
  dueDate: Date | null;
  completedDate: Date | null;
  duration: number;
  outcome?: string;
  attachments: IActivityAttachment[];
  metadata: Map<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type ActivityModel = Model<IActivity, {}>;
export type ActivityDocument = HydratedDocument<IActivity>;

const activitySchema = new Schema<IActivity, ActivityModel>(
  {
    type: {
      type: String,
      enum: Object.values(ACTIVITY_TYPES),
      required: [true, 'Activity type is required'],
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      maxlength: [200, 'Subject cannot exceed 200 characters'],
    },
    description: {
      type: String,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    leadId: {
      type: Schema.Types.ObjectId,
      ref: 'Lead',
      required: true,
    },
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      default: null,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(ACTIVITY_STATUS),
      default: ACTIVITY_STATUS.PENDING,
    },
    priority: {
      type: String,
      enum: Object.values(LEAD_PRIORITY),
      default: LEAD_PRIORITY.MEDIUM,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    completedDate: {
      type: Date,
      default: null,
    },
    duration: {
      type: Number,
      default: 0,
      min: 0,
    },
    outcome: {
      type: String,
      maxlength: [1000, 'Outcome cannot exceed 1000 characters'],
    },
    attachments: [
      {
        filename: String,
        url: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  },
);

activitySchema.index({ leadId: 1, createdAt: -1 });
activitySchema.index({ userId: 1, createdAt: -1 });
activitySchema.index({ type: 1 });
activitySchema.index({ status: 1 });
activitySchema.index({ dueDate: 1 });

// Auto-set completed date when status changes to completed
activitySchema.pre('save', function (next) {
  if (
    this.isModified('status') &&
    this.status === ACTIVITY_STATUS.COMPLETED &&
    !this.completedDate
  ) {
    this.completedDate = new Date();
  }
  next();
});

const Activity = model<IActivity, ActivityModel>('Activity', activitySchema);

export default Activity;
