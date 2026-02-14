import mongoose, { Schema, Types } from 'mongoose';

export interface IMessage extends Document {
  chat_id: Types.ObjectId;
  sender_id: Types.ObjectId;
  content: string;
  message_type: string;
  reply_to_id: Types.ObjectId;
  is_edited: boolean;
  is_deleted: boolean;
}

export interface IMessageAttachments extends Document {
  message_id: Types.ObjectId;
  file_url: string;
  file_type: string;
  file_size: number;
  uploaded_at: Date;
}

export interface IMessageReads extends Document {
  message_id: Types.ObjectId;
  user_id: Types.ObjectId;
  read_at: Date;
}

export interface IMessageReactions extends Document {
  message_id: Types.ObjectId;
  user_id: Types.ObjectId;
  reaction: string;
  reacted_at: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    chat_id: {
      type: Schema.Types.ObjectId,
      ref: 'Chat',
    },
    sender_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    content: {
      type: String,
      required: true,
    },
    message_type: String,
    reply_to_id: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
    },
    is_edited: Boolean,
    is_deleted: Boolean,
  },
  { timestamps: true },
);

const messageAttachmentSchema = new Schema<IMessageAttachments>({
  message_id: {
    type: Schema.Types.ObjectId,
    ref: 'Message',
  },
  file_size: Number,
  file_url: String,
  file_type: String,
  uploaded_at: Date,
});

const messageReadsSchema = new Schema<IMessageReads>({
  message_id: {
    type: Schema.Types.ObjectId,
    ref: 'Message',
  },
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  read_at: Date,
});

const messageReactionSchema = new Schema<IMessageReactions>({
  message_id: {
    type: Schema.Types.ObjectId,
    ref: 'Message',
  },
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  reaction: String,
  reacted_at: Date,
});

export const Message =
  mongoose.models.Message || mongoose.model('Message', messageSchema);

export const MessageAttachment =
  mongoose.models.MessageAttachment ||
  mongoose.model('MessageAttachment', messageAttachmentSchema);

export const MessageReadsSchema =
  mongoose.models.MessageReadsSchema ||
  mongoose.model('MessageReadsSchema', messageReadsSchema);

export const MessageReaction =
  mongoose.models.MessageReaction ||
  mongoose.model('MessageReaction', messageReactionSchema);
