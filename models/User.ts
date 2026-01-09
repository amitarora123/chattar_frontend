import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  username: string;
  display_name: string;
  email: string;
  password: string;
  avatar_url?: string;
  last_seen?: Date;
  is_active: boolean;
}

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      unique: true,
      required: true,
      min: 4,
    },
    display_name: {
      type: String,
      required: false,
      min: 4,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
    },
    avatar_url: {
      type: String,
      required: false,
    },
    last_seen: {
      type: Date,
      required: false,
    },
    is_active: {
      type: Boolean,
    },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
