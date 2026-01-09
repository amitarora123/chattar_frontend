import mongoose, { Schema, Types } from "mongoose";

interface IChat extends Document {
  is_group: boolean;
}

interface IChatParticipants extends Document {
  chat_id: Types.ObjectId;
  user_id: Types.ObjectId;
  joined_at: Date;
  left_at: Date;
  is_muted: boolean;
}

const chatSchema = new Schema<IChat>(
  {
    is_group: Boolean,
  },
  { timestamps: true }
);

const chatParticipantsSchema = new Schema<IChatParticipants>({
  chat_id: {
    type: Schema.Types.ObjectId,
    ref: "Chat",
  },
  user_id: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  joined_at: Date,
  left_at: Date,
  is_muted: Boolean,
});

export const Chat = mongoose.models.Chat || mongoose.model("Chat", chatSchema);
export const ChatParticipants =
  mongoose.models.ChatParticipants ||
  mongoose.model("ChatParticipants", chatParticipantsSchema);
