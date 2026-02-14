import mongoose, { Document } from 'mongoose';
import { Schema, Types } from 'mongoose';

interface IChatContacts extends Document {
  user_id: Types.ObjectId;
  contact_id: Types.ObjectId;
  name?: string;
}

const chatContactSchema = new Schema<IChatContacts>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    contact_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  },
);

chatContactSchema.index(
  {
    user_id: 1,
    contact_id: 1,
  },
  { unique: true },
);

export const ChatContacts =
  mongoose.models.ChatContacts ||
  mongoose.model('ChatContacts', chatContactSchema);
