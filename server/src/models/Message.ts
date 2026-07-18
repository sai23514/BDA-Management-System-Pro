import {
  Schema,
  model,
  type Model,
  type HydratedDocument,
  type Types,
} from 'mongoose';

export interface IMessage {
  conversationId: Types.ObjectId;
  sender: Types.ObjectId;
  body: string;
  readBy: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type MessageModel = Model<IMessage, {}>;
export type MessageDocument = HydratedDocument<IMessage>;

const messageSchema = new Schema<IMessage, MessageModel>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    body: {
      type: String,
      required: [true, 'Message body is required'],
      trim: true,
      maxlength: [5000, 'Message cannot exceed 5000 characters'],
    },
    readBy: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  { timestamps: true },
);

messageSchema.index({ conversationId: 1, createdAt: -1 });

const Message = model<IMessage, MessageModel>('Message', messageSchema);

export default Message;
