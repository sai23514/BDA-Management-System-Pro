import {
  Schema,
  model,
  type Model,
  type HydratedDocument,
  type Types,
} from 'mongoose';

export interface IConversation {
  participants: Types.ObjectId[];
  isGroup: boolean;
  lastMessage?: string;
  lastMessageAt?: Date;
  lastSender?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type ConversationModel = Model<IConversation, {}>;
export type ConversationDocument = HydratedDocument<IConversation>;

const conversationSchema = new Schema<IConversation, ConversationModel>(
  {
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    isGroup: {
      type: Boolean,
      default: false,
    },
    lastMessage: {
      type: String,
      trim: true,
    },
    lastMessageAt: {
      type: Date,
    },
    lastSender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true },
);

conversationSchema.index({ participants: 1, lastMessageAt: -1 });

const Conversation = model<IConversation, ConversationModel>('Conversation', conversationSchema);

export default Conversation;
