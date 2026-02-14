import mongoose, { Schema, Types } from 'mongoose';

interface IChat extends Document {
  is_group: boolean;
  participants: Types.ObjectId[];
  name?: string;
}

interface IChatParticipants extends Document {
  chat_id: Types.ObjectId;
  user_id: Types.ObjectId;
  joined_at: Date;
  left_at: Date;
  is_muted: boolean;
  cleared_at?: Date;
}

const chatSchema = new Schema<IChat>(
  {
    name: String,
    is_group: Boolean,
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
  },
  { timestamps: true },
);

chatSchema.index(
  { participants: 1 },
  {
    unique: true,
    partialFilterExpression: { is_group: false },
  },
);

const chatParticipantsSchema = new Schema<IChatParticipants>({
  chat_id: {
    type: Schema.Types.ObjectId,
    ref: 'Chat',
  },
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  joined_at: Date,
  left_at: Date,
  is_muted: Boolean,
  cleared_at: {
    type: Date,
    required: false,
    default: null,
  },
});

export const Chat = mongoose.models.Chat || mongoose.model('Chat', chatSchema);
export const ChatParticipants =
  mongoose.models.ChatParticipants ||
  mongoose.model('ChatParticipants', chatParticipantsSchema);
