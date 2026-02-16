import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IMessage extends Document {
  chat_id: Types.ObjectId;
  sender_id: Types.ObjectId;
  content: string;
  message_type: 'text' | 'media' | 'system';
  reply_to_id: Types.ObjectId;
  is_edited: boolean;
  is_deleted: boolean;
  attachment_id: Types.ObjectId;
  reads: Types.ObjectId[];
  reactions: Types.ObjectId[];
}

export interface IMessageAttachments extends Document {
  file_url: string;
  file_type: string;
  file_size: number;
}

export interface IMessageReads extends Document {
  participant_id: Types.ObjectId;
  read_at: Date;
}

export interface IMessageReactions extends Document {
  participant_id: Types.ObjectId;
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
    message_type: {
      type: String,
      enum: ['text', 'media', 'system'],
      default: 'text',
    },

    reply_to_id: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
      required: false,
    },
    is_edited: {
      type: Boolean,
      default: false,
      required: false,
    },
    is_deleted: {
      type: Boolean,
      default: false,
      required: false,
    },
    attachment_id: {
      type: Schema.Types.ObjectId,
      ref: 'MessageAttachment',
      default: null,
    },
    reads: [
      {
        type: Schema.Types.ObjectId,
        ref: 'MessageRead',
        default: null,
      },
    ],
    reactions: [
      {
        type: Schema.Types.ObjectId,
        ref: 'MessageReads',
        default: null,
      },
    ],
  },
  { timestamps: true },
);

const messageAttachmentSchema = new Schema<IMessageAttachments>(
  {
    file_size: Number,
    file_url: String,
    file_type: String,
  },
  { timestamps: true },
);

const messageReadsSchema = new Schema<IMessageReads>({
  participant_id: {
    type: Schema.Types.ObjectId,
    ref: 'ChatParticipants',
  },
  read_at: Date,
});

const messageReactionSchema = new Schema<IMessageReactions>({
  participant_id: {
    type: Schema.Types.ObjectId,
    ref: 'ChatParticipants',
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
