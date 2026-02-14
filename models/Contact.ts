import mongoose, { Document } from 'mongoose';
import { Schema, Types } from 'mongoose';

interface IContacts extends Document {
  owner_id: Types.ObjectId;
  user_id: Types.ObjectId;
  name?: string;
}

const contactSchema = new Schema<IContacts>(
  {
    owner_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    user_id: {
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

contactSchema.index(
  {
    user_id: 1,
    contact_id: 1,
  },
  { unique: true },
);

export const Contacts =
  mongoose.models.Contacts ||
  mongoose.model('Contacts', contactSchema);
