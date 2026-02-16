import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IChat extends Document {
  is_group: boolean;
  chat_key: string | null;
  name?: string;
}

export interface IChatParticipants extends Document {
  chat_id: Types.ObjectId;
  user_id: Types.ObjectId;
  left_at: Date;
  is_muted: boolean;
  cleared_at?: Date;
  role: 'Admin' | 'Member';
}

const chatSchema = new Schema<IChat>(
  {
    name: String,
    is_group: {
      type: Boolean,
      default: false,
      required: false,
    },
    chat_key: {
      type: String,
      required: false,
      default: null,
    },
  },
  { timestamps: true },
);

chatSchema.index(
  { chat_key: 1 },
  {
    unique: true,
    partialFilterExpression: {
      is_group: false,
    },
  },
);

const chatParticipantsSchema = new Schema<IChatParticipants>(
  {
    chat_id: {
      type: Schema.Types.ObjectId,
      ref: 'Chat',
    },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    left_at: {
      type: Date,
      default: null,
      required: false,
    },
    is_muted: {
      type: Boolean,
      default: false,
      required: false,
    },
    cleared_at: {
      type: Date,
      required: false,
      default: null,
    },
    role: {
      type: String,
      enum: ['Admin', 'Member'],
      default: 'Member',
    },
  },
  { timestamps: true },
);

export const Chat = mongoose.models.Chat || mongoose.model('Chat', chatSchema);
export const ChatParticipants =
  mongoose.models.ChatParticipants ||
  mongoose.model('ChatParticipants', chatParticipantsSchema);
